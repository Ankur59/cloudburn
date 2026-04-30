import { Router } from 'express';
import { sendInvite, acceptInvite, revokeInvite } from '../controllers/invitation.controller.js';
import { sendInviteValidator, acceptInviteValidator, invitationIdValidator } from '../validators/invitation.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Admin-only: send an invitation
router.post('/', protect('Admin'), sendInviteValidator, sendInvite);

// Admin-only: revoke a pending invitation (soft delete)
router.patch('/:id/revoke', protect('Admin'), invitationIdValidator, revokeInvite);

// Public: accept an invitation via token (the token is the credential)
router.post('/accept', acceptInviteValidator, acceptInvite);

export default router;
