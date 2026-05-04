import express from 'express';
import { getResourceUsageAnalytics } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All analytics routes are protected
router.use(protect);

router.get('/resource-usage', getResourceUsageAnalytics);

export default router;
