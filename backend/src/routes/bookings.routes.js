import { Router } from 'express';
import { createBooking, acceptBooking, rejectBooking, getBookings } from '../controllers/bookings.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', auth, getBookings);
router.post('/', auth, requireRole('farmer', 'distributor'), createBooking);
router.patch('/:id/accept', auth, requireRole('storage_owner'), acceptBooking);
router.patch('/:id/reject', auth, requireRole('storage_owner'), rejectBooking);

export default router;
