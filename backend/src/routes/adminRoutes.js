import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  getAllCustomers,
  toggleCustomerStatus,
  getStats,
  getRevenueRealized,
  changeAdminPassword,
  requestChangeAdminEmail,
  confirmAdminEmail,
} from '../controllers/adminController.js';

const router = express.Router();

// Public route to confirm email using token from email link
router.post('/confirm-email', confirmAdminEmail);

// Apply protect and isAdmin middlewares to all remaining admin routes
router.use(protect, isAdmin);

router.get('/stats', getStats);
router.get('/revenue-realized', getRevenueRealized);
router.get('/users', getAllCustomers);
router.patch('/users/:id/status', toggleCustomerStatus);

// Admin Account Settings
router.post('/change-password', changeAdminPassword);
router.post('/change-email', requestChangeAdminEmail);

export default router;

