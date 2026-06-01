import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';

import { getAllOrders, updateOrderStatus } from '../controllers/adminOrderController.js';
import {
  setPaymentDeadline,
  applyPenalty,
  waivePenalty,
  getPaymentHistory,
  getOverdueOrders,
  getPaymentRules,
  updatePaymentRules,
  getAuditLogs,
} from '../controllers/adminPaymentController.js';
import {
  getCancellationRequests,
  approveCancellation,
  rejectCancellation,
  processRefund,
} from '../controllers/cancellationController.js';

const router = express.Router();
router.use(protect, isAdmin);

// ── Orders ───────────────────────────────────────────────────────────────────
router.get('/', getAllOrders);
router.patch('/:id/status', updateOrderStatus);

// ── Payment deadline & penalty ────────────────────────────────────────────────
router.get('/overdue', getOverdueOrders);
router.post('/:id/set-deadline', setPaymentDeadline);
router.post('/:id/apply-penalty', applyPenalty);
router.post('/:id/waive-penalty', waivePenalty);
router.get('/:id/payment-history', getPaymentHistory);

// ── Payment rules (singleton config) ─────────────────────────────────────────
router.get('/payment-rules', getPaymentRules);
router.put('/payment-rules', updatePaymentRules);

// ── Cancellation requests ─────────────────────────────────────────────────────
router.get('/cancellations', getCancellationRequests);
router.post('/cancellations/:id/approve', approveCancellation);
router.post('/cancellations/:id/reject', rejectCancellation);
router.post('/cancellations/:id/refund', processRefund);

// ── Audit logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

export default router;
