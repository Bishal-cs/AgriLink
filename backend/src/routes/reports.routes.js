import express from 'express';
import { submitReport } from '../controllers/reports.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', auth, submitReport);

export default router;
