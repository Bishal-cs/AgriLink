import { Router } from 'express';
import { register, login, resetPassword, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
