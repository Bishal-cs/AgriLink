import { Router } from 'express';
import { getOrders, getOrderById, updateOrderStatus } from '../controllers/orders.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', auth, getOrders);
router.get('/:id', auth, getOrderById);
router.patch('/:id/status', auth, requireRole('distributor'), updateOrderStatus);

export default router;
