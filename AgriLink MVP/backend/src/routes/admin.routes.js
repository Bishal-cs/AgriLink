import { Router } from 'express';
import { getUsers, verifyUser, suspendUser, getAnalytics } from '../controllers/admin.controller.js';
import { getReports, updateReportStatus } from '../controllers/reports.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/users', auth, requireRole('admin'), getUsers);
router.patch('/users/:id/verify', auth, requireRole('admin'), verifyUser);
router.patch('/users/:id/suspend', auth, requireRole('admin'), suspendUser);
router.get('/analytics', auth, requireRole('admin'), getAnalytics);

// Admin Reports Routes
router.get('/reports', auth, requireRole('admin'), getReports);
router.patch('/reports/:id/status', auth, requireRole('admin'), updateReportStatus);

export default router;
