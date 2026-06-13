import { Router } from 'express';
import { getListings, getListingById, createListing, updateListing, deleteListing, getMyListings } from '../controllers/listings.controller.js';
import { getOffersForListing } from '../controllers/offers.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', getListings); // Public
router.get('/my', auth, requireRole('farmer'), getMyListings);
router.get('/:id', getListingById); // Public
router.post('/', auth, requireRole('farmer'), upload.array('images', 5), createListing);
router.put('/:id', auth, requireRole('farmer'), upload.array('images', 5), updateListing);
router.delete('/:id', auth, requireRole('farmer'), deleteListing);
router.get('/:id/offers', auth, requireRole('farmer'), getOffersForListing);

export default router;
