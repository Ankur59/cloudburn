import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../config/cloudinary.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  leaveOrganization,
  removeAvatar,
} from '../controllers/settings.controller.js';

const router = Router();
router.use(protect());

// ── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile', getProfile);
router.patch('/profile', uploadAvatar.single('avatar'), updateProfile);
router.delete('/avatar', removeAvatar);

// ── Security ─────────────────────────────────────────────────────────────────
router.patch('/password', changePassword);

// ── Danger Zone ───────────────────────────────────────────────────────────────
router.delete('/leave-org', leaveOrganization);

export default router;
