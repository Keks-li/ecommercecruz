import prisma from '../utils/prisma.js';

export const getStats = async (req, res) => {
  try {
    // 1. Core counters
    const totalActiveUsers = await prisma.user.count({
      where: { role: 'CUSTOMER', status: 'ACTIVE' },
    });

    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    const totalOrders = await prisma.order.count();

    const revenueResult = await prisma.order.aggregate({
      _sum: { total_price: true },
    });
    const totalRevenue = revenueResult._sum.total_price || 0;

    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' },
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

    // 2. Temporal sales (Today, Week, Month)
    const now = new Date();
    
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);

    // Today
    const todayOrders = await prisma.order.findMany({
      where: { created_at: { gte: startOfToday } },
    });
    const salesTodayCount = todayOrders.length;
    const salesTodayRevenue = todayOrders.reduce((sum, o) => sum + o.total_price, 0);

    // Week (last 7 days)
    const weekOrders = await prisma.order.findMany({
      where: { created_at: { gte: startOfWeek } },
    });
    const salesWeekCount = weekOrders.length;
    const salesWeekRevenue = weekOrders.reduce((sum, o) => sum + o.total_price, 0);

    // Month (last 30 days)
    const monthOrders = await prisma.order.findMany({
      where: { created_at: { gte: startOfMonth } },
    });
    const salesMonthCount = monthOrders.length;
    const salesMonthRevenue = monthOrders.reduce((sum, o) => sum + o.total_price, 0);

    // 3. Recent orders feed (take 5)
    const recentOrders = await prisma.order.findMany({
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

    // 4. Top selling products (take 5)
    const orderItems = await prisma.orderItem.findMany({
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

    // 5. Chart Data (Daily / Weekly / Monthly)
    const allOrders = await prisma.order.findMany({
      orderBy: { created_at: 'asc' }
    });

    const dailyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      
      const dayOrders = allOrders.filter(o => o.created_at >= start && o.created_at <= end);
      const revenue = dayOrders.reduce((sum, o) => sum + o.total_price, 0);
      dailyChart.push({ label, sales: dayOrders.length, revenue });
    }

    const weeklyChart = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - (i + 1) * 7); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setDate(end.getDate() - i * 7); end.setHours(23, 59, 59, 999);
      const label = i === 0 ? 'This Week' : `${i} Wk Ago`;
      
      const weekOrders = allOrders.filter(o => o.created_at >= start && o.created_at <= end);
      const revenue = weekOrders.reduce((sum, o) => sum + o.total_price, 0);
      weeklyChart.push({ label, sales: weekOrders.length, revenue });
    }

    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const monthOrders = allOrders.filter(o => {
        const od = new Date(o.created_at);
        return od.getMonth() === m && od.getFullYear() === y;
      });
      const revenue = monthOrders.reduce((sum, o) => sum + o.total_price, 0);
      monthlyChart.push({ label, sales: monthOrders.length, revenue });
    }

    res.json({
      totalRevenue,
      totalOrders,
      totalActiveUsers,
      totalCustomers,
      pendingOrders,
      lowStockProductsCount,
      lowStockProductsList,
      salesTodayCount,
      salesTodayRevenue,
      salesWeekCount,
      salesWeekRevenue,
      salesMonthCount,
      salesMonthRevenue,
      recentOrders: formattedRecentOrders,
      topSellingProducts,
      charts: {
        daily: dailyChart,
        weekly: weeklyChart,
        monthly: monthlyChart
      }
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
