import { Router } from 'express';
import { getUnreadNotifications, getAllNotifications, markAsRead, markAllAsRead } from '../controllers/notifications.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', auth, getAllNotifications);
router.get('/unread', auth, getUnreadNotifications);
router.patch('/:id/read', auth, markAsRead);
router.patch('/read-all', auth, markAllAsRead);

export default router;
