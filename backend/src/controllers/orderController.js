import prisma from '../utils/prisma.js';

/**
 * POST /api/orders
 * Creates a new order for the authenticated customer.
 * Securely fetches prices from database and validates product availability.
 */
export const createOrder = async (req, res) => {
  try {
    const { items, pickup_region, pickup_district, pickup_city } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Extract product IDs
    const productIds = items.map(item => Number(item.id));

    // Fetch products from database to get real prices and verify status
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
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

      validatedItems.push({
        product_id: dbProduct.id,
        quantity: qty,
        price: price
      });
    }

    // Execute within a database transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the main order
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          total_price: totalPrice,
          status: 'PENDING',
          pickup_region,
          pickup_district,
          pickup_city
        }
      });

      // 2. Create the order items
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
              product: {
                select: {
                  name: true,
                  image_url: true,
                  unique_code: true
                }
              }
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
            product: {
              select: {
                name: true,
                image_url: true,
                unique_code: true
              }
            }
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
