import { Router } from 'express';
import { matchStorage } from '../services/matching.service.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// GET /api/matching/storage?lng=...&lat=...&qty=...
router.get('/storage', auth, requireRole('farmer'), async (req, res, next) => {
  try {
    const { lng, lat, qty } = req.query;

    if (!lng || !lat || !qty) {
      return res.status(400).json({ error: 'lng, lat, and qty are required query params' });
    }

    const farmerCoords = [Number(lng), Number(lat)];
    const results = await matchStorage(farmerCoords, Number(qty));

    res.json({ matches: results });
  } catch (error) {
    next(error);
  }
});

export default router;
