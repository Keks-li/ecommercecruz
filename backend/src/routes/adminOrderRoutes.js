import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import { getAllOrders, updateOrderStatus } from '../controllers/adminOrderController.js';

const router = express.Router();

router.use(protect, isAdmin);

router.get('/', getAllOrders);
router.patch('/:id/status', updateOrderStatus);

export default router;
