import express from 'express';
import { getAlerts, resolveAlert } from '../controllers/alert.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes are protected by JWT
router.use(protect());

router.get('/', getAlerts);
router.patch('/:id/resolve', resolveAlert);

export default router;
