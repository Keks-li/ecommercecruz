import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getPublicKey,
  initializeCheckoutPayment,
  initializeBalancePayment,
  verifyPayment,
  handleWebhook,
} from '../controllers/paystackController.js';

const router = express.Router();

// ── Public Routes ───────────────────────────────────────────────────────────
// Frontend requests public key for client-side PaystackPop inline setup
router.get('/public-key', getPublicKey);

// Webhook endpoint (verified cryptographically via HMAC-SHA512)
router.post('/webhook', handleWebhook);

// ── Protected Customer Routes ───────────────────────────────────────────────
router.use(protect);

// Initialize checkout payment for cart items
router.post('/initialize-checkout', initializeCheckoutPayment);

// Initialize installment / balance payment for an existing order
router.post('/orders/:id/initialize', initializeBalancePayment);

// Verify completed payment with Paystack API and apply atomic credit
router.get('/verify/:reference', verifyPayment);

export default router;
