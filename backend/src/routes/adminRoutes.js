import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import { getAllCustomers, toggleCustomerStatus, getStats } from '../controllers/adminController.js';

const router = express.Router();

// Apply protect and isAdmin middlewares to all admin routes
router.use(protect, isAdmin);

router.get('/stats', getStats);
router.get('/users', getAllCustomers);
router.patch('/users/:id/status', toggleCustomerStatus);

export default router;
