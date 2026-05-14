import express from 'express';
import { getActiveProducts, validateCartProducts } from '../controllers/productController.js';

const router = express.Router();

// Public — no auth required
router.get('/', getActiveProducts);
router.post('/validate-cart', validateCartProducts);

export default router;
