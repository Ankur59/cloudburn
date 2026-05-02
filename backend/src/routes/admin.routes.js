import { Router } from 'express';
import { triggerSync, previewCostRecords } from '../controllers/admin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// All admin routes require Admin JWT
router.use(protect('Admin'));

// Trigger the cost sync manually (same as cron)
// Body (optional): { orgId } — to sync one org only
router.post('/sync',         triggerSync);

// Preview what's in costRecords for a given org
// Query: ?orgId=<id>&date=<YYYY-MM-DD>
router.get('/sync/preview',  previewCostRecords);

export default router;
