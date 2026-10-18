import express from 'express';
import { protect } from '../middleware/auth.js';
import { createOrder, getMyOrders, payOrderBalance } from '../controllers/orderController.js';
import { requestCancellation } from '../controllers/cancellationController.js';
import {
  initializeCheckoutPayment,
  initializeBalancePayment,
} from '../controllers/paystackController.js';

const router = express.Router();
router.use(protect);

router.post('/', createOrder);
router.post('/paystack/initialize', initializeCheckoutPayment);
router.get('/', getMyOrders);
router.post('/:id/pay', payOrderBalance);
router.post('/:id/paystack/initialize', initializeBalancePayment);
router.post('/:id/cancel', requestCancellation);

export default router;
