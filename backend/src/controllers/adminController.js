import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmailConfirmation } from '../utils/mailer.js';

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
        name: true,
        phone: true,
        auth_provider: true,
        avatar_url: true,
        role: true,
        status: true,
        created_at: true,
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

export const getRevenueRealized = async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;

    let dateFilter = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      dateFilter = { created_at: { gte: start, lte: end } };
    } else if (startDate || endDate) {
      dateFilter.created_at = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.created_at.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.created_at.lte = end;
      }
    }

    // 1. Fetch transactions within scope
    const transactions = await prisma.paymentTransaction.findMany({
      where: { ...dateFilter },
      include: {
        order: {
          select: {
            id: true,
            total_price: true,
            amount_paid: true,
            payment_status: true,
            status: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 2. Aggregate cash flow sums
    let grossInflows = 0;
    let totalRefunds = 0;
    const methodBreakdown = {};

    transactions.forEach((tx) => {
      if (tx.amount > 0) {
        grossInflows += tx.amount;
        const method = tx.payment_method || 'MANUAL';
        methodBreakdown[method] = (methodBreakdown[method] || 0) + tx.amount;
      } else {
        totalRefunds += Math.abs(tx.amount);
      }
    });

    const netRealizedRevenue = grossInflows - totalRefunds;

    // 3. Overall Order contracts & receivables
    const ordersResult = await prisma.order.findMany({
      select: {
        id: true,
        total_price: true,
        amount_paid: true,
        penalty_amount: true,
        payment_status: true,
      },
    });

    let totalContracted = 0;
    let totalOutstanding = 0;
    let totalPenalties = 0;
    let fullyPaidCount = 0;
    let partiallyPaidCount = 0;
    let overdueCount = 0;

    ordersResult.forEach((o) => {
      totalContracted += o.total_price || 0;
      totalPenalties += o.penalty_amount || 0;
      const bal = Math.max(0, (o.total_price || 0) + (o.penalty_amount || 0) - (o.amount_paid || 0));
      totalOutstanding += bal;

      if (o.payment_status === 'PAID') fullyPaidCount++;
      else if (o.payment_status === 'PARTIALLY_PAID') partiallyPaidCount++;
      else if (o.payment_status === 'OVERDUE') overdueCount++;
    });

    const realizationRate = totalContracted > 0
      ? Number(((grossInflows / totalContracted) * 100).toFixed(1))
      : 100;

    // 4. Daily timeline
    const dailyMap = {};
    transactions.forEach((tx) => {
      const day = new Date(tx.created_at).toISOString().split('T')[0];
      if (!dailyMap[day]) {
        dailyMap[day] = { date: day, inflow: 0, outflow: 0, net: 0, count: 0 };
      }
      if (tx.amount > 0) {
        dailyMap[day].inflow += tx.amount;
      } else {
        dailyMap[day].outflow += Math.abs(tx.amount);
      }
      dailyMap[day].net += tx.amount;
      dailyMap[day].count += 1;
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Critical low stock inventory
    const lowStockCount = await prisma.product.count({
      where: { status: 'ACTIVE', stock: { lt: 5 } },
    });
    const lowStockProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE', stock: { lt: 5 } },
      select: { id: true, name: true, unique_code: true, stock: true, image_url: true, price: true },
      take: 6,
    });

    return res.json({
      summary: {
        netRealizedRevenue,
        grossInflows,
        totalRefunds,
        totalContracted,
        totalOutstanding,
        totalPenalties,
        realizationRate,
        transactionCount: transactions.length,
        fullyPaidCount,
        partiallyPaidCount,
        overdueCount,
        lowStockCount,
        lowStockProducts,
      },
      methodBreakdown,
      dailyTrend,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        orderId: tx.order_id,
        amount: tx.amount,
        paymentMethod: tx.payment_method,
        reference: tx.reference,
        note: tx.note,
        createdAt: tx.created_at,
        customerEmail: tx.order?.user?.email || 'Unknown',
        orderTotal: tx.order?.total_price || 0,
        paymentStatus: tx.order?.payment_status || 'PENDING',
      })),
    });
  } catch (error) {
    console.error('Error calculating realized revenue:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/admin/change-password
 * Admin changes their account password
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide both your current password and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Admin account required.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    await prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'ADMIN_PASSWORD_UPDATED',
        entity: 'User',
        entity_id: adminId,
        ip_address: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Error changing admin password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/admin/change-email
 * Admin requests to change their email address; dispatches confirmation link
 */
export const requestChangeAdminEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const adminId = req.user.id;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'Please provide both the new email and your current password.' });
    }

    const trimmedNewEmail = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedNewEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (admin.email.toLowerCase() === trimmedNewEmail) {
      return res.status(400).json({ error: 'The new email is the same as your current email.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: trimmedNewEmail },
    });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Generate cryptographically signed token valid for 24h
    const token = jwt.sign(
      { userId: adminId, newEmail: trimmedNewEmail, action: 'CONFIRM_ADMIN_EMAIL' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const origin = req.get('origin') || req.get('referer');
    const frontendBase = origin
      ? origin.replace(/\/+$/, '')
      : (process.env.FRONTEND_URL || 'http://localhost:3000');
    const confirmationUrl = `${frontendBase}/admin/confirm-email?token=${encodeURIComponent(token)}`;

    // Dispatch confirmation email
    await sendEmailConfirmation({
      to: trimmedNewEmail,
      confirmationUrl,
      adminName: admin.name || 'Administrator',
    });

    await prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'ADMIN_EMAIL_CHANGE_REQUESTED',
        entity: 'User',
        entity_id: adminId,
        new_value: trimmedNewEmail,
        ip_address: req.ip || req.headers['x-forwarded-for'],
      },
    });

    res.json({
      message: `A confirmation link has been sent to ${trimmedNewEmail}. Please check your email and click the confirmation link to complete the change.`,
      confirmationUrl, // returned for developer convenience in local dev
    });
  } catch (err) {
    console.error('Error requesting email change:', err);
    res.status(500).json({ error: err.message || 'Failed to process email change request.' });
  }
};

/**
 * POST /api/admin/confirm-email
 * Verifies the token and confirms the new admin email address
 */
export const confirmAdminEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(400).json({ error: 'The email confirmation link is invalid or has expired. Please request a new link.' });
    }

    if (decoded.action !== 'CONFIRM_ADMIN_EMAIL' || !decoded.userId || !decoded.newEmail) {
      return res.status(400).json({ error: 'Invalid verification token payload.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: decoded.newEmail },
    });
    if (existing && existing.id !== user.id) {
      return res.status(400).json({ error: 'This email is already in use by another account.' });
    }

    const oldEmail = user.email;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: decoded.newEmail },
    });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'ADMIN_EMAIL_CONFIRMED',
        entity: 'User',
        entity_id: user.id,
        old_value: oldEmail,
        new_value: decoded.newEmail,
        ip_address: req.ip || req.headers['x-forwarded-for'],
      },
    });

    const newToken = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Admin email updated successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        name: updatedUser.name,
      },
      token: newToken,
    });
  } catch (err) {
    console.error('Error confirming admin email:', err);
    res.status(500).json({ error: 'Failed to confirm email.' });
  }
};

