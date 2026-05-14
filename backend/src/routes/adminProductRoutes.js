import express from 'express';
import multer from 'multer';
import { protect, isAdmin } from '../middleware/auth.js';
import { createProduct, updateProductStatus } from '../controllers/adminProductController.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Apply protect and isAdmin middlewares to all routes in this file
router.use(protect);
router.use(isAdmin);

// Route for creating a new product
router.post('/', upload.single('image'), createProduct);

// Route for toggling product status
router.patch('/:id/status', updateProductStatus);

export default router;
