import express from 'express';
import { getActiveProducts, validateCartProducts, getProductById } from '../controllers/productController.js';

const router = express.Router();

// Public — no auth required
router.get('/', getActiveProducts);
router.get('/:id', getProductById);
router.post('/validate-cart', validateCartProducts);

export default router;
