import { Router } from 'express';
import { getStorageFacilities, createFacility, updateFacility, getMyFacilities } from '../controllers/storage.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getStorageFacilities); // Public
router.get('/my', auth, requireRole('storage_owner'), getMyFacilities);
router.post('/', auth, requireRole('storage_owner'), createFacility);
router.put('/:id', auth, requireRole('storage_owner'), updateFacility);

export default router;
