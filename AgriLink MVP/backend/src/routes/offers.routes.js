import { Router } from 'express';
import { sendOffer, acceptOffer, rejectOffer, getMyOffers } from '../controllers/offers.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.post('/', auth, requireRole('distributor'), sendOffer);
router.get('/my', auth, requireRole('distributor'), getMyOffers);
router.patch('/:id/accept', auth, requireRole('farmer'), acceptOffer);
router.patch('/:id/reject', auth, requireRole('farmer'), rejectOffer);

export default router;
