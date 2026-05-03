import mongoose from 'mongoose';
import Organization from './organization.model.js';

// Role hierarchy:
//  Admin    → self-registers, owns the org, can invite TeamLeads
//  TeamLead → invited by Admin, manages a team
//  Member   → invited by TeamLead (future)
export const USER_ROLES = ['Admin', 'TeamLead'];

const userSchema = new mongoose.Schema(
  {
    // orgId is nullable at registration time — Admin registers first,
    // then creates/links an Organization afterwards.
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Organization,
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false, // Not required for Google OAuth
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    googleId: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: USER_ROLES,
    },

    // ── Email verification ───────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpiry: { type: Date, default: null },

    // ── Auth ─────────────────────────────────────────────────────────────────
    // Stored as SHA-256 hash — raw token lives in httpOnly cookie only
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.emailVerificationToken;
  delete obj.inviteToken;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
