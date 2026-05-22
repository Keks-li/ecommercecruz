import express from 'express';
import { protect } from '../middleware/auth.js';
import { createOrder, getMyOrders } from '../controllers/orderController.js';

const router = express.Router();

// All order routes require customer login
router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);

export default router;
