import prisma from '../utils/prisma.js';

export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unique_code: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'SHIPPED', 'DELIVERED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid or missing status. Must be PENDING, SHIPPED, or DELIVERED.' });
    }

    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
