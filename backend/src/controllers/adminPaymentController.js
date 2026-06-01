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
    let rules = await prisma.paymentRule.findFirst();
    if (!rules) {
      // Create singleton if somehow missing
      rules = await prisma.paymentRule.create({ data: {} });
    }
    return res.json(rules);
  } catch (err) {
    console.error('getPaymentRules error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── updatePaymentRules ────────────────────────────────────────────────────────

/**
 * PUT /api/admin/payment-rules
 */
export const updatePaymentRules = async (req, res) => {
  try {
    const {
      default_deadline_days,
      default_penalty_pct,
      grace_period_days,
      default_cancel_fee_pct,
      enable_recurring,
      penalty_frequency,
      max_refund_days,
    } = req.body;

    let existing = await prisma.paymentRule.findFirst();
    const oldValue = existing ? { ...existing } : {};

    if (existing) {
      existing = await prisma.paymentRule.update({
        where: { id: existing.id },
        data: {
          ...(default_deadline_days != null && { default_deadline_days: Number(default_deadline_days) }),
          ...(default_penalty_pct != null && { default_penalty_pct: parseFloat(default_penalty_pct) }),
          ...(grace_period_days != null && { grace_period_days: Number(grace_period_days) }),
          ...(default_cancel_fee_pct != null && { default_cancel_fee_pct: parseFloat(default_cancel_fee_pct) }),
          ...(enable_recurring != null && { enable_recurring: Boolean(enable_recurring) }),
          ...(penalty_frequency && { penalty_frequency }),
          ...(max_refund_days != null && { max_refund_days: Number(max_refund_days) }),
        },
      });
    } else {
      existing = await prisma.paymentRule.create({ data: req.body });
    }

    await audit({
      userId: req.user.id,
      action: 'PAYMENT_RULES_UPDATED',
      entity: 'PaymentRule',
      entityId: existing.id,
      oldValue,
      newValue: existing,
      ip: req.ip,
    });

    return res.json(existing);
  } catch (err) {
    console.error('updatePaymentRules error:', err);
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
