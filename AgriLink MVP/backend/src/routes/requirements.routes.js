import express from 'express';
import {
  getRequirements,
  getMyRequirements,
  createRequirement,
  cancelRequirement,
} from '../controllers/requirements.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

// Public/Farmer routes
router.get('/', auth, getRequirements);

// Distributor routes
router.get('/my', auth, requireRole('distributor'), getMyRequirements);
router.post('/', auth, requireRole('distributor'), createRequirement);
router.delete('/:id', auth, requireRole('distributor'), cancelRequirement);

export default router;
