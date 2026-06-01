import express from 'express';
import { protect } from '../middleware/auth.js';
import { createOrder, getMyOrders, payOrderBalance } from '../controllers/orderController.js';

const router = express.Router();

// All order routes require customer login
router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.post('/:id/pay', payOrderBalance);

export default router;
