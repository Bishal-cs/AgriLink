import { Router } from 'express';
import { createRating, getUserRatings } from '../controllers/ratings.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.post('/', auth, requireRole('farmer', 'distributor'), createRating);
router.get('/user/:id', getUserRatings); // Public

export default router;
