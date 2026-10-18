import express from 'express';
import { register, login, socialLogin, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.patch('/profile', protect, updateProfile);

export default router;
