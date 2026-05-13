import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

// Grouping middlewares for protected routes
export const protect = async (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return; // verifyToken already sent the response
    checkStatus(req, res, next);
  });
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};

export const checkStatus = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Forbidden: User is suspended' });
    }

    next();
  } catch (err) {
    console.error('Error checking user status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
