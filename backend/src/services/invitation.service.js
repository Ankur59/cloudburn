import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import Invitation from '../models/invitation.model.js';
import Team from '../models/team.model.js';
import User from '../models/user.model.js';
import Organization from '../models/organization.model.js';
import AppError from '../utils/AppError.js';
import { config } from '../config/config.js';
import { sendInvitationEmail } from './email.service.js';

const INVITE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const generateCryptoToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ── Shared helper — does this team already have an active TeamLead? ────────────
// Used in both sendInvite and acceptInvite to enforce the single-TL rule.
const teamHasLead = (teamId, orgId) =>
  User.exists({ teamId, orgId, role: 'TeamLead' });

// ── Send Invite ───────────────────────────────────────────────────────────────
export const sendInvite = async ({ orgId, invitedBy, inviterName, teamId, email }) => {
  // 1) Verify team + org exist, and that the email isn't already a registered user
  //    All three run in parallel — no added latency.
  const [team, org, emailTaken] = await Promise.all([
    Team.findOne({ _id: teamId, orgId }).lean(),
    Organization.findById(orgId).lean(),
    User.exists({ email }),
  ]);
  if (!team)     throw new AppError('Team not found.', 404);
  if (!org)      throw new AppError('Organization not found.', 404);
  if (emailTaken) {
    throw new AppError(
      'A user with this email already exists. Cannot send an invitation to a registered account.',
      409
    );
  }

  // 2) Reject if the team already has a TeamLead
  const hasLead = await teamHasLead(teamId, orgId);
  if (hasLead) {
    throw new AppError('This team already has a Team Lead.', 409);
  }


  // 3) Reject if there is already a PENDING (non-expired) invite for this team
  const pendingInvite = await Invitation.findOne({
    teamId,
    status: 'PENDING',
    expiresAt: { $gt: new Date() },
  }).lean();
  if (pendingInvite) {
    throw new AppError(
      'A pending invitation already exists for this team. Please wait for it to expire or revoke it.',
      409
    );
  }

  // 4) Generate tokens and create invitation record
  const rawToken    = generateCryptoToken();
  const hashedToken = hashToken(rawToken);

  await Invitation.create({
    orgId,
    teamId,
    email,
    role:      'TeamLead',
    token:     hashedToken,
    status:    'PENDING',
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    invitedBy,
  });

  // 5) Fire-and-forget — don't block response on email delivery
  sendInvitationEmail({
    to:          email,
    inviterName,
    teamName:    team.name,
    orgName:     org.name,
    rawToken,
  }).catch((err) => console.error('📧 Invitation email failed:', err.message));

  return { email, teamName: team.name };
};

// ── Revoke Invite (soft delete) ──────────────────────────────────────────────
export const revokeInvite = async ({ invitationId, orgId }) => {
  const invite = await Invitation.findOneAndUpdate(
    {
      _id: invitationId,
      orgId,          // scoped to org — admin can only revoke their own org's invites
      status: 'PENDING', // can only revoke an invite that hasn't been accepted/expired
    },
    {
      $set: {
        status:    'REVOKED',
        revokedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!invite) {
    throw new AppError(
      'Invitation not found, already accepted, or cannot be revoked.',
      404
    );
  }

  return invite;
};

export const acceptInvite = async ({ rawToken, name, password }) => {
  const hashedToken = hashToken(rawToken);

  // 1) Find the invitation — select token field explicitly (select:false)
  const invite = await Invitation.findOne({ token: hashedToken }).select('+token');
  if (!invite) throw new AppError('Invitation not found. The link may be invalid.', 404);

  // 2) Check status — reject ACCEPTED or already-used invites
  if (invite.status === 'ACCEPTED') {
    throw new AppError('This invitation has already been accepted.', 409);
  }

  // 3) Check expiry (belt-and-suspenders — TTL index removes docs, but race conditions exist)
  if (invite.expiresAt < new Date()) {
    await Invitation.findByIdAndUpdate(invite._id, { status: 'EXPIRED' });
    throw new AppError('This invitation has expired. Please ask your admin to send a new one.', 410);
  }

  // Run remaining checks in parallel for speed
  const [team, hasLead, existingUser] = await Promise.all([
    Team.findOne({ _id: invite.teamId, orgId: invite.orgId }).lean(),
    teamHasLead(invite.teamId, invite.orgId),
    User.findOne({ email: invite.email }).lean(),
  ]);

  // 4) Verify the team wasn't deleted after the invite was sent
  if (!team) {
    throw new AppError('The team you were invited to no longer exists.', 404);
  }

  // 5) Reject if another TeamLead already accepted a different invite for this team
  if (hasLead) {
    throw new AppError('This team already has a Team Lead.', 409);
  }

  // 6) Reject if a user account already exists for this email
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // 7) Create the TeamLead user
  //    Email is implicitly verified — they clicked a link sent to their inbox.
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    orgId:           invite.orgId,
    teamId:          invite.teamId,
    name,
    email:           invite.email,
    passwordHash,
    role:            'TeamLead',
    isEmailVerified: true,
  });

  // 8) Mark invitation as ACCEPTED
  await Invitation.findByIdAndUpdate(invite._id, { status: 'ACCEPTED' });

  return user;
};
