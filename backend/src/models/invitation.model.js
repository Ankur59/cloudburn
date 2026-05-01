import mongoose from 'mongoose';

export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'];

const invitationSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['TeamLead'],
      default: 'TeamLead',
    },
    // Stored as SHA-256 hash — raw token is sent to the invitee via email only
    token: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: INVITATION_STATUSES,
      default: 'PENDING',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Soft-delete audit — set when an Admin revokes a pending invitation
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Fast lookup when a TeamLead clicks the link
invitationSchema.index({ token: 1 });

// Check for existing pending invites for a team
invitationSchema.index({ teamId: 1, status: 1 });

// TTL index — MongoDB auto-removes expired documents (cleanup)
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
