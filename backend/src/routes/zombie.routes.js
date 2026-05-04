import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getZombies, triggerScan, patchZombieStatus } from '../controllers/zombie.controller.js';

const router = Router();

// All routes require a valid JWT
router.use(protect());

router.get('/',        getZombies);       // GET  /api/zombie
router.post('/scan',   triggerScan);      // POST /api/zombie/scan
router.patch('/:id',   patchZombieStatus);// PATCH /api/zombie/:id

export default router;
