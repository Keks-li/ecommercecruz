import express from 'express';
import multer from 'multer';
import { protect, isAdmin } from '../middleware/auth.js';
import { createProduct, toggleProductStatus, updateProduct, getAllProducts } from '../controllers/adminProductController.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Apply protect and isAdmin middlewares to all routes in this file
router.use(protect);
router.use(isAdmin);

router.get('/', getAllProducts);
router.post('/', upload.single('image'), createProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.patch('/:id/status', toggleProductStatus);

export default router;
