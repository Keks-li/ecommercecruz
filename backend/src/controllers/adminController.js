import prisma from '../utils/prisma.js';

export const getStats = async (req, res) => {
  try {
    const { date } = req.query;
    let dateFilter = {};
    let userDateFilter = {};
    let orderItemFilter = {};

    if (date) {
      // Parse target date and set local start/end times
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      dateFilter = { created_at: { gte: startOfDay, lte: endOfDay } };
      userDateFilter = { created_at: { gte: startOfDay, lte: endOfDay } };
      orderItemFilter = { order: { created_at: { gte: startOfDay, lte: endOfDay } } };
    }

    // 1. Core counters
    const totalActiveUsers = await prisma.user.count({
      where: { role: 'CUSTOMER', status: 'ACTIVE', ...userDateFilter },
    });

    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER', ...userDateFilter },
    });

    const totalOrders = await prisma.order.count({
      where: { ...dateFilter },
    });

    const revenueResult = await prisma.order.aggregate({
      where: { ...dateFilter },
      _sum: { total_price: true },
    });
    const totalRevenue = revenueResult._sum.total_price || 0;

    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING', ...dateFilter },
    });

    const lowStockProductsCount = await prisma.product.count({
      where: { status: 'ACTIVE', stock: { lt: 5 } },
    });

    const lowStockProductsList = await prisma.product.findMany({
      where: { status: 'ACTIVE', stock: { lt: 5 } },
      select: {
        id: true,
        name: true,
        unique_code: true,
        stock: true,
        price: true,
        image_url: true,
      },
    });

    // 2. Recent orders feed (take 5)
    const recentOrders = await prisma.order.findMany({
      where: { ...dateFilter },
      take: 5,
      orderBy: { id: 'desc' },
      include: {
        user: {
          select: { email: true }
        },
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    });

    const formattedRecentOrders = recentOrders.map(o => ({
      id: o.id,
      customerEmail: o.user.email,
      totalPrice: o.total_price,
      status: o.status,
      pickupCity: o.pickup_city,
      createdAt: o.created_at,
      items: o.items.map(item => ({
        productName: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price
      }))
    }));

    // 3. Top selling products (take 5)
    const orderItems = await prisma.orderItem.findMany({
      where: { ...orderItemFilter },
      include: { product: true }
    });
    const productSales = {};
    orderItems.forEach(item => {
      const pid = item.product_id;
      if (item.product) {
        if (!productSales[pid]) {
          productSales[pid] = {
            id: pid,
            name: item.product.name,
            image_url: item.product.image_url,
            price: item.product.price,
            unique_code: item.product.unique_code,
            stock: item.product.stock,
            quantitySold: 0,
            totalRevenue: 0
          };
        }
        productSales[pid].quantitySold += item.quantity;
        productSales[pid].totalRevenue += item.price * item.quantity;
      }
    });
    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    res.json({
      totalRevenue,
      totalOrders,
      totalActiveUsers,
      totalCustomers,
      pendingOrders,
      lowStockProductsCount,
      lowStockProductsList,
      recentOrders: formattedRecentOrders,
      topSellingProducts,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'CUSTOMER') {
      return res.status(400).json({ error: 'Only customer status can be toggled' });
    }

    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: newStatus },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error toggling customer status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
