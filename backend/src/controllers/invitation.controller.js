import asyncHandler from "../middlewares/async.middleware.js";
import { sendSuccess } from "../utils/responseHelper.js";
import * as invitationService from "../services/invitation.service.js";

// ── POST /api/invitations ─────────────────────────────────────────────────────
export const sendInvite = asyncHandler(async (req, res) => {
  const { email, teamId } = req.body;

  // orgId, invitedBy, and inviterName all come from the verified JWT + DB user
  // — never from the client body
  const result = await invitationService.sendInvite({
    orgId: req.tokenOrgId,
    invitedBy: req.user._id,
    inviterName: req.user.name,
    teamId,
    email,
  });

  return sendSuccess(
    res,
    201,
    `Invitation sent to ${result.email} for the ${result.teamName} team.`,
    { email: result.email, teamName: result.teamName },
  );
});

// ── POST /api/invitations/accept ──────────────────────────────────────────────
export const acceptInvite = asyncHandler(async (req, res) => {
  const { token, name, password } = req.body;

  const user = await invitationService.acceptInvite({
    rawToken: token,
    name,
    password,
  });

  return sendSuccess(
    res,
    201,
    "Invitation accepted. Your account has been created. You can now log in.",
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        teamId: user.teamId,
      },
    },
  );
});

// ── PATCH /api/invitations/:id/revoke ────────────────────────────────────────
export const revokeInvite = asyncHandler(async (req, res) => {
  const invite = await invitationService.revokeInvite({
    invitationId: req.params.id,
    orgId: req.tokenOrgId, // from JWT — never from body
  });

  return sendSuccess(res, 200, "Invitation revoked successfully.", {
    invitation: {
      id: invite._id,
      email: invite.email,
      status: invite.status,
      revokedAt: invite.revokedAt,
    },
  });
});
