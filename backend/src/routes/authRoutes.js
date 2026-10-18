import express from 'express';
import { register, login, socialLogin, updateProfile, getAuthConfig } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', getAuthConfig);
router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.patch('/profile', protect, updateProfile);

export default router;
