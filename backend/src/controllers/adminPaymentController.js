import prisma from '../utils/prisma.js';

// ── Audit helper ─────────────────────────────────────────────────────────────

async function audit({ userId, action, entity, entityId, oldValue, newValue, ip }) {
  await prisma.auditLog.create({
    data: {
      user_id: userId ?? null,
      action,
      entity,
      entity_id: entityId ?? null,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      ip_address: ip ?? null,
    },
  });
}

// ── setPaymentDeadline ────────────────────────────────────────────────────────

/**
 * POST /api/admin/orders/:id/set-deadline
 * Body: { days: number, penaltyPct?: number }
 */
export const setPaymentDeadline = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { days, penaltyPct } = req.body;

    if (!days || isNaN(Number(days)) || Number(days) <= 0)
      return res.status(400).json({ error: 'days must be a positive number' });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(days));

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_due_date: dueDate,
        penalty_pct: penaltyPct != null ? parseFloat(penaltyPct) : order.penalty_pct,
      },
    });

    await audit({
      userId: req.user.id,
      action: 'SET_PAYMENT_DEADLINE',
      entity: 'Order',
      entityId: orderId,
      oldValue: { payment_due_date: order.payment_due_date, penalty_pct: order.penalty_pct },
      newValue: { payment_due_date: updated.payment_due_date, penalty_pct: updated.penalty_pct },
      ip: req.ip,
    });

    return res.json(updated);
  } catch (err) {
    console.error('setPaymentDeadline error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── applyPenalty ──────────────────────────────────────────────────────────────

/**
 * POST /api/admin/orders/:id/apply-penalty
 * Applies a one-time overdue penalty to the outstanding balance.
 */
export const applyPenalty = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.penalty_applied)
      return res.status(400).json({ error: 'Penalty has already been applied to this order' });

    if (order.payment_status === 'PAID')
      return res.status(400).json({ error: 'Order is already fully paid' });

    // Resolve penalty % — per-order override OR global default
    let pct = order.penalty_pct;
    if (!pct) {
      const rules = await prisma.paymentRule.findFirst();
      pct = rules?.default_penalty_pct ?? 10;
    }

    const outstanding = order.total_price - order.amount_paid;
    const penaltyAmount = parseFloat((outstanding * (pct / 100)).toFixed(2));

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        penalty_amount: penaltyAmount,
        penalty_applied: true,
        payment_status: 'OVERDUE',
      },
    });

    await audit({
      userId: req.user.id,
      action: 'PENALTY_APPLIED',
      entity: 'Order',
      entityId: orderId,
      oldValue: { penalty_amount: 0, payment_status: order.payment_status },
      newValue: { penalty_amount: penaltyAmount, penalty_pct: pct, payment_status: 'OVERDUE' },
      ip: req.ip,
    });

    return res.json({
      ...updated,
      outstanding_before: outstanding,
      penalty_amount: penaltyAmount,
      new_amount_due: outstanding + penaltyAmount,
    });
  } catch (err) {
    console.error('applyPenalty error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── waivePenalty ──────────────────────────────────────────────────────────────

/**
 * POST /api/admin/orders/:id/waive-penalty
 */
export const waivePenalty = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!order.penalty_applied)
      return res.status(400).json({ error: 'No penalty has been applied to this order' });

    // Recalculate payment status without penalty
    let newStatus = order.payment_status;
    if (newStatus === 'OVERDUE') {
      newStatus = order.amount_paid >= order.total_price ? 'PAID'
        : order.amount_paid > 0 ? 'PARTIALLY_PAID' : 'PENDING';
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { penalty_amount: 0, penalty_applied: false, payment_status: newStatus },
    });

    await audit({
      userId: req.user.id,
      action: 'PENALTY_WAIVED',
      entity: 'Order',
      entityId: orderId,
      oldValue: { penalty_amount: order.penalty_amount, payment_status: order.payment_status },
      newValue: { penalty_amount: 0, payment_status: newStatus },
      ip: req.ip,
    });

    return res.json(updated);
  } catch (err) {
    console.error('waivePenalty error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── getPaymentHistory ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/orders/:id/payment-history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        transactions: { orderBy: { created_at: 'desc' } },
        user: { select: { email: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json(order);
  } catch (err) {
    console.error('getPaymentHistory error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── getOverdueOrders ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/orders/overdue
 * Returns all orders past their payment_due_date and not fully paid.
 */
export const getOverdueOrders = async (req, res) => {
  try {
    const now = new Date();
    const orders = await prisma.order.findMany({
      where: {
        payment_due_date: { lt: now },
        payment_status: { not: 'PAID' },
      },
      include: {
        user: { select: { id: true, email: true } },
        items: { include: { product: { select: { name: true, unique_code: true } } } },
        transactions: { orderBy: { created_at: 'desc' } },
      },
      orderBy: { payment_due_date: 'asc' },
    });
    return res.json(orders);
  } catch (err) {
    console.error('getOverdueOrders error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── getPaymentRules ───────────────────────────────────────────────────────────

export const getPaymentRules = async (req, res) => {
  try {
    const rules = await prisma.paymentRule.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { id: 'asc' },
    });
    return res.json(rules);
  } catch (err) {
    console.error('getPaymentRules error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── createPaymentRule ─────────────────────────────────────────────────────────

export const createPaymentRule = async (req, res) => {
  try {
    const {
      name,
      is_default,
      default_deadline_days,
      default_penalty_pct,
      grace_period_days,
      default_cancel_fee_pct,
      enable_recurring,
      penalty_frequency,
      max_refund_days,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Rule name is required' });

    const setAsDefault = Boolean(is_default);

    const newRule = await prisma.$transaction(async (tx) => {
      if (setAsDefault) {
        await tx.paymentRule.updateMany({
          where: { is_default: true },
          data: { is_default: false },
        });
      }

      return tx.paymentRule.create({
        data: {
          name,
          is_default: setAsDefault,
          default_deadline_days: Number(default_deadline_days) || 14,
          default_penalty_pct: parseFloat(default_penalty_pct) || 10,
          grace_period_days: Number(grace_period_days) || 3,
          default_cancel_fee_pct: parseFloat(default_cancel_fee_pct) || 15,
          enable_recurring: Boolean(enable_recurring),
          penalty_frequency: penalty_frequency || 'monthly',
          max_refund_days: Number(max_refund_days) || 30,
        },
      });
    });

    await audit({
      userId: req.user.id,
      action: 'PAYMENT_RULE_CREATED',
      entity: 'PaymentRule',
      entityId: newRule.id,
      newValue: newRule,
      ip: req.ip,
    });

    return res.status(201).json(newRule);
  } catch (err) {
    console.error('createPaymentRule error:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'A payment rule with this name already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── updatePaymentRules ────────────────────────────────────────────────────────

export const updatePaymentRules = async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id, 10);
    if (isNaN(ruleId)) {
      // If no ID param, fall back to default rule singleton behavior
      const defaultRule = await prisma.paymentRule.findFirst({ where: { is_default: true } });
      if (!defaultRule) return res.status(404).json({ error: 'Default rule not found' });
      req.params.id = defaultRule.id;
      return updatePaymentRules(req, res);
    }

    const {
      name,
      is_default,
      default_deadline_days,
      default_penalty_pct,
      grace_period_days,
      default_cancel_fee_pct,
      enable_recurring,
      penalty_frequency,
      max_refund_days,
    } = req.body;

    const existing = await prisma.paymentRule.findUnique({ where: { id: ruleId } });
    if (!existing) return res.status(404).json({ error: 'Rule not found' });

    const setAsDefault = Boolean(is_default);

    if (existing.is_default && !setAsDefault) {
      const defaultCount = await prisma.paymentRule.count({ where: { is_default: true } });
      if (defaultCount <= 1) {
        return res.status(400).json({ error: 'At least one default payment rule is required. Set another rule as default first.' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (setAsDefault && !existing.is_default) {
        await tx.paymentRule.updateMany({
          where: { is_default: true },
          data: { is_default: false },
        });
      }

      return tx.paymentRule.update({
        where: { id: ruleId },
        data: {
          ...(name && { name }),
          is_default: setAsDefault,
          ...(default_deadline_days != null && { default_deadline_days: Number(default_deadline_days) }),
          ...(default_penalty_pct != null && { default_penalty_pct: parseFloat(default_penalty_pct) }),
          ...(grace_period_days != null && { grace_period_days: Number(grace_period_days) }),
          ...(default_cancel_fee_pct != null && { default_cancel_fee_pct: parseFloat(default_cancel_fee_pct) }),
          ...(enable_recurring != null && { enable_recurring: Boolean(enable_recurring) }),
          ...(penalty_frequency && { penalty_frequency }),
          ...(max_refund_days != null && { max_refund_days: Number(max_refund_days) }),
        },
      });
    });

    await audit({
      userId: req.user.id,
      action: 'PAYMENT_RULE_UPDATED',
      entity: 'PaymentRule',
      entityId: ruleId,
      oldValue: existing,
      newValue: updated,
      ip: req.ip,
    });

    return res.json(updated);
  } catch (err) {
    console.error('updatePaymentRule error:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'A payment rule with this name already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── deletePaymentRule ─────────────────────────────────────────────────────────

export const deletePaymentRule = async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id, 10);
    if (isNaN(ruleId)) return res.status(400).json({ error: 'Invalid rule ID' });

    const existing = await prisma.paymentRule.findUnique({
      where: { id: ruleId },
      include: { _count: { select: { products: true } } }
    });
    if (!existing) return res.status(404).json({ error: 'Rule not found' });

    if (existing.is_default) {
      return res.status(400).json({ error: 'The default payment rule cannot be deleted.' });
    }

    const deleted = await prisma.paymentRule.delete({ where: { id: ruleId } });

    await audit({
      userId: req.user.id,
      action: 'PAYMENT_RULE_DELETED',
      entity: 'PaymentRule',
      entityId: ruleId,
      oldValue: existing,
      newValue: null,
      ip: req.ip,
    });

    return res.json({ success: true, message: 'Payment rule deleted successfully', deleted });
  } catch (err) {
    console.error('deletePaymentRule error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── getAuditLogs ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/audit-logs?page=1&limit=50&entity=Order
 */
export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const entity = req.query.entity || undefined;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where: entity ? { entity } : {},
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: entity ? { entity } : {} }),
    ]);

    return res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── getResolvedOrderRules ────────────────────────────────────────────────────

export const getResolvedOrderRules = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: { payment_rule: true }
            }
          }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const defaultRule = await prisma.paymentRule.findFirst({ where: { is_default: true } }) || {
      default_deadline_days: 14,
      default_penalty_pct: 10,
      grace_period_days: 3,
      default_cancel_fee_pct: 15,
    };

    const productRules = order.items
      .map(item => item.product?.payment_rule)
      .filter(Boolean);

    let resolvedDays = defaultRule.default_deadline_days;
    let resolvedPenaltyPct = defaultRule.default_penalty_pct;
    let resolvedGraceDays = defaultRule.grace_period_days;
    let resolvedCancelFeePct = defaultRule.default_cancel_fee_pct;

    if (productRules.length > 0) {
      const deadlines = productRules.map(r => r.default_deadline_days).filter(d => d != null);
      if (deadlines.length > 0) resolvedDays = Math.min(...deadlines);

      const penalties = productRules.map(r => r.default_penalty_pct).filter(p => p != null);
      if (penalties.length > 0) resolvedPenaltyPct = Math.max(...penalties);

      const graces = productRules.map(r => r.grace_period_days).filter(g => g != null);
      if (graces.length > 0) resolvedGraceDays = Math.min(...graces);

      const cancelFees = productRules.map(r => r.default_cancel_fee_pct).filter(c => c != null);
      if (cancelFees.length > 0) resolvedCancelFeePct = Math.max(...cancelFees);
    }

    return res.json({
      deadline_days: resolvedDays,
      penalty_pct: resolvedPenaltyPct,
      grace_period_days: resolvedGraceDays,
      cancel_fee_pct: resolvedCancelFeePct,
    });
  } catch (error) {
    console.error('Error resolving order rules:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

