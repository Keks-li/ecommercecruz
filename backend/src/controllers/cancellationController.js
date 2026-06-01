import prisma from '../utils/prisma.js';

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

// ── requestCancellation (Customer) ───────────────────────────────────────────

/**
 * POST /api/orders/:id/cancel
 * Customer requests a cancellation. Fee is calculated from global PaymentRule.
 */
export const requestCancellation = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    if (!reason?.trim()) return res.status(400).json({ error: 'A cancellation reason is required' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { cancellation: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    if (['DELIVERED', 'SHIPPED'].includes(order.status))
      return res.status(400).json({ error: 'Cannot cancel an order that has been shipped or delivered' });

    if (order.cancellation_status !== 'NONE')
      return res.status(400).json({ error: `A cancellation request already exists (${order.cancellation_status})` });

    // Fetch cancel fee from global rules
    const rules = await prisma.paymentRule.findFirst();
    const feePct = rules?.default_cancel_fee_pct ?? 15;
    const refundAmount = parseFloat((order.amount_paid - order.amount_paid * (feePct / 100)).toFixed(2));

    const cancelReq = await prisma.$transaction(async (tx) => {
      const req_ = await tx.cancellationRequest.create({
        data: {
          order_id: orderId,
          requested_by: userId,
          reason: reason.trim(),
          cancellation_fee_pct: feePct,
          refund_amount: refundAmount,
          status: 'REQUESTED',
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { cancellation_status: 'REQUESTED' },
      });

      return req_;
    });

    await audit({
      userId,
      action: 'CANCELLATION_REQUESTED',
      entity: 'Order',
      entityId: orderId,
      newValue: { reason, feePct, refundAmount },
      ip: req.ip,
    });

    return res.status(201).json(cancelReq);
  } catch (err) {
    console.error('requestCancellation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── getCancellationRequests (Admin) ──────────────────────────────────────────

export const getCancellationRequests = async (req, res) => {
  try {
    const requests = await prisma.cancellationRequest.findMany({
      include: {
        order: {
          include: {
            user: { select: { id: true, email: true } },
            items: { include: { product: { select: { name: true, unique_code: true } } } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return res.json(requests);
  } catch (err) {
    console.error('getCancellationRequests error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── approveCancellation (Admin) ───────────────────────────────────────────────

/**
 * POST /api/admin/orders/cancellations/:id/approve
 * id = CancellationRequest.id
 */
export const approveCancellation = async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const { admin_note } = req.body;

    const cancelReq = await prisma.cancellationRequest.findUnique({
      where: { id: reqId },
      include: { order: true },
    });
    if (!cancelReq) return res.status(404).json({ error: 'Cancellation request not found' });
    if (cancelReq.status !== 'REQUESTED')
      return res.status(400).json({ error: `Request is already ${cancelReq.status}` });

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.cancellationRequest.update({
        where: { id: reqId },
        data: { status: 'APPROVED', admin_note: admin_note ?? null, updated_at: new Date() },
      });

      await tx.order.update({
        where: { id: cancelReq.order_id },
        data: { cancellation_status: 'APPROVED', status: 'CANCELLED' },
      });

      return upd;
    });

    await audit({
      userId: req.user.id,
      action: 'CANCELLATION_APPROVED',
      entity: 'CancellationRequest',
      entityId: reqId,
      oldValue: { status: 'REQUESTED' },
      newValue: { status: 'APPROVED', refundAmount: cancelReq.refund_amount },
      ip: req.ip,
    });

    return res.json(updated);
  } catch (err) {
    console.error('approveCancellation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── rejectCancellation (Admin) ────────────────────────────────────────────────

export const rejectCancellation = async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const { admin_note } = req.body;

    const cancelReq = await prisma.cancellationRequest.findUnique({ where: { id: reqId } });
    if (!cancelReq) return res.status(404).json({ error: 'Cancellation request not found' });
    if (cancelReq.status !== 'REQUESTED')
      return res.status(400).json({ error: `Request is already ${cancelReq.status}` });

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.cancellationRequest.update({
        where: { id: reqId },
        data: { status: 'REJECTED', admin_note: admin_note ?? null, updated_at: new Date() },
      });

      await tx.order.update({
        where: { id: cancelReq.order_id },
        data: { cancellation_status: 'REJECTED' },
      });

      return upd;
    });

    await audit({
      userId: req.user.id,
      action: 'CANCELLATION_REJECTED',
      entity: 'CancellationRequest',
      entityId: reqId,
      oldValue: { status: 'REQUESTED' },
      newValue: { status: 'REJECTED' },
      ip: req.ip,
    });

    return res.json(updated);
  } catch (err) {
    console.error('rejectCancellation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── processRefund (Admin) ─────────────────────────────────────────────────────

/**
 * POST /api/admin/orders/cancellations/:id/refund
 */
export const processRefund = async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);

    const cancelReq = await prisma.cancellationRequest.findUnique({
      where: { id: reqId },
      include: { order: true },
    });
    if (!cancelReq) return res.status(404).json({ error: 'Cancellation request not found' });
    if (cancelReq.status !== 'APPROVED')
      return res.status(400).json({ error: 'Cancellation must be approved before processing refund' });

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.cancellationRequest.update({
        where: { id: reqId },
        data: { status: 'REFUNDED', updated_at: new Date() },
      });

      await tx.order.update({
        where: { id: cancelReq.order_id },
        data: { cancellation_status: 'REFUNDED' },
      });

      // Log refund as a negative transaction
      await tx.paymentTransaction.create({
        data: {
          order_id: cancelReq.order_id,
          amount: -cancelReq.refund_amount,
          payment_method: 'REFUND',
          note: `Refund processed — GH₵${cancelReq.refund_amount.toFixed(2)} returned to customer`,
        },
      });

      return upd;
    });

    await audit({
      userId: req.user.id,
      action: 'REFUND_PROCESSED',
      entity: 'CancellationRequest',
      entityId: reqId,
      oldValue: { status: 'APPROVED' },
      newValue: { status: 'REFUNDED', refundAmount: cancelReq.refund_amount },
      ip: req.ip,
    });

    return res.json(updated);
  } catch (err) {
    console.error('processRefund error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
