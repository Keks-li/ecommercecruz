import prisma from '../utils/prisma.js';

/**
 * POST /api/orders
 * Creates a new order for the authenticated customer.
 * Securely fetches prices from database and validates product availability.
 */
export const createOrder = async (req, res) => {
  try {
    const { items, pickup_region, pickup_district, pickup_city, amount_paid } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Extract product IDs
    const productIds = items.map(item => Number(item.id));

    // Fetch products from database to get real prices and verify status
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    // Create a lookup map
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Validate all items exist and are active
    const validatedItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const dbProduct = productMap.get(Number(item.id));
      if (!dbProduct) {
        return res.status(404).json({ error: `Product with ID ${item.id} not found` });
      }

      if (dbProduct.status !== 'ACTIVE') {
        return res.status(400).json({ error: `Product '${dbProduct.name}' is no longer available` });
      }

      const qty = parseInt(item.qty, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive integer' });
      }

      const price = dbProduct.price;
      totalPrice += price * qty;

      validatedItems.push({ product_id: dbProduct.id, quantity: qty, price });
    }

    // Validate installment payment amount
    const parsedAmountPaid = parseFloat(amount_paid);
    if (isNaN(parsedAmountPaid) || parsedAmountPaid <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }
    if (parsedAmountPaid > totalPrice) {
      return res.status(400).json({ error: 'Payment amount cannot exceed the order total' });
    }

    // Execute within a database transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          total_price: totalPrice,
          amount_paid: parsedAmountPaid,
          status: 'PENDING',
          pickup_region,
          pickup_district,
          pickup_city
        }
      });

      await tx.orderItem.createMany({
        data: validatedItems.map(item => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              product: { select: { name: true, image_url: true, unique_code: true } }
            }
          }
        }
      });
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/orders
 * Returns all orders for the authenticated customer.
 */
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            product: { select: { name: true, image_url: true, unique_code: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/orders/:id/pay
 * Adds an installment payment to an existing order.
 * The extra amount is added to amount_paid, capped at total_price.
 * Only the order's owner can make this payment.
 */
export const payOrderBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    // Fetch the order and verify ownership
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const outstanding = order.total_price - order.amount_paid;
    if (outstanding <= 0) {
      return res.status(400).json({ error: 'This order has already been paid in full' });
    }
    if (parsedAmount > outstanding) {
      return res
        .status(400)
        .json({ error: `Amount exceeds the outstanding balance of GH₵ ${outstanding.toFixed(2)}` });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { amount_paid: order.amount_paid + parsedAmount },
      include: {
        items: {
          include: {
            product: { select: { name: true, image_url: true, unique_code: true } }
          }
        }
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error processing balance payment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
