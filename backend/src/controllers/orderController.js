import prisma from '../utils/prisma.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

async function writeAuditLog({ userId, action, entity, entityId, oldValue, newValue, ip }) {
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

function derivePaymentStatus(totalPrice, amountPaid) {
  if (amountPaid <= 0) return 'PENDING';
  if (amountPaid >= totalPrice) return 'PAID';
  return 'PARTIALLY_PAID';
}

// ── createOrder ──────────────────────────────────────────────────────────────

/**
 * POST /api/orders
 * Creates a new order. Records initial payment as a PaymentTransaction.
 */
export const createOrder = async (req, res) => {
  try {
    const { items, pickup_region, pickup_district, pickup_city, amount_paid } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const productIds = items.map(item => Number(item.id));
    const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    const validatedItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const dbProduct = productMap.get(Number(item.id));
      if (!dbProduct) return res.status(404).json({ error: `Product with ID ${item.id} not found` });
      if (dbProduct.status !== 'ACTIVE') return res.status(400).json({ error: `Product '${dbProduct.name}' is no longer available` });

      const qty = parseInt(item.qty, 10);
      if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be a positive integer' });

      totalPrice += dbProduct.price * qty;
      validatedItems.push({ product_id: dbProduct.id, quantity: qty, price: dbProduct.price });
    }

    const parsedAmountPaid = parseFloat(amount_paid);
    if (isNaN(parsedAmountPaid) || parsedAmountPaid <= 0)
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    if (parsedAmountPaid > totalPrice)
      return res.status(400).json({ error: 'Payment amount cannot exceed the order total' });

    const paymentStatus = derivePaymentStatus(totalPrice, parsedAmountPaid);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          total_price: totalPrice,
          amount_paid: parsedAmountPaid,
          payment_status: paymentStatus,
          status: 'PENDING',
          pickup_region,
          pickup_district,
          pickup_city,
        },
      });

      await tx.orderItem.createMany({
        data: validatedItems.map(item => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // Log initial payment transaction
      await tx.paymentTransaction.create({
        data: {
          order_id: newOrder.id,
          amount: parsedAmountPaid,
          payment_method: 'MANUAL',
          note: 'Initial payment at order creation',
        },
      });

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: { include: { product: { select: { name: true, image_url: true, unique_code: true } } } },
          transactions: true,
        },
      });
    });

    // Audit log
    await writeAuditLog({
      userId,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: order.id,
      newValue: { total: totalPrice, amountPaid: parsedAmountPaid, paymentStatus },
      ip: req.ip,
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── getMyOrders ──────────────────────────────────────────────────────────────

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { user_id: userId },
      include: {
        items: { include: { product: { select: { name: true, image_url: true, unique_code: true } } } },
        transactions: { orderBy: { created_at: 'desc' } },
        cancellation: true,
      },
      orderBy: { id: 'desc' },
    });
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── payOrderBalance ──────────────────────────────────────────────────────────

/**
 * POST /api/orders/:id/pay
 * Adds an installment payment. Logs PaymentTransaction + AuditLog.
 */
export const payOrderBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

    const { amount, reference } = req.body;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    // Outstanding = total + penalty - already paid
    const outstanding = order.total_price + order.penalty_amount - order.amount_paid;
    if (outstanding <= 0) return res.status(400).json({ error: 'This order has already been paid in full' });
    if (parsedAmount > outstanding)
      return res.status(400).json({ error: `Amount exceeds outstanding balance of GH₵ ${outstanding.toFixed(2)}` });

    const newAmountPaid = order.amount_paid + parsedAmount;
    const effectiveTotal = order.total_price + order.penalty_amount;
    const newPaymentStatus = derivePaymentStatus(effectiveTotal, newAmountPaid);

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.order.update({
        where: { id: orderId },
        data: { amount_paid: newAmountPaid, payment_status: newPaymentStatus },
        include: {
          items: { include: { product: { select: { name: true, image_url: true, unique_code: true } } } },
          transactions: { orderBy: { created_at: 'desc' } },
          cancellation: true,
        },
      });

      await tx.paymentTransaction.create({
        data: {
          order_id: orderId,
          amount: parsedAmount,
          payment_method: 'MANUAL',
          reference: reference ?? null,
          note: 'Balance payment by customer',
        },
      });

      return upd;
    });

    await writeAuditLog({
      userId,
      action: 'BALANCE_PAYMENT',
      entity: 'Order',
      entityId: orderId,
      oldValue: { amountPaid: order.amount_paid },
      newValue: { amountPaid: newAmountPaid, paymentStatus: newPaymentStatus },
      ip: req.ip,
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error processing balance payment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
