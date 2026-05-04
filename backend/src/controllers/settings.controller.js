import asyncHandler from '../middlewares/async.middleware.js';
import User from '../models/user.model.js';
import Organization from '../models/organization.model.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/responseHelper.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../config/cloudinary.js';

// ── GET /api/settings/profile ─────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const org  = await Organization.findById(req.user.orgId);
  return sendSuccess(res, 200, 'Profile fetched', {
    name:    user.name,
    email:   user.email,
    role:    user.role,
    avatar:  user.avatar || null,
    orgName: org?.name || null,
  });
});

// ── PATCH /api/settings/profile ───────────────────────────────────────────────
// Updates name (and avatar if file uploaded via multer-cloudinary)
export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const updates = {};

  if (name && name.trim()) updates.name = name.trim();

  // If a file was uploaded via multer-cloudinary, req.file.path = cloudinary URL
  if (req.file && req.file.path) {
    updates.avatar = req.file.path;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No update data provided', 400);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  return sendSuccess(res, 200, 'Profile updated', {
    name:   user.name,
    email:  user.email,
    avatar: user.avatar || null,
    role:   user.role,
  });
});

// ── DELETE /api/settings/avatar ───────────────────────────────────────────────────
export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.avatar) throw new AppError('No avatar to remove', 400);

  // Extract Cloudinary public_id from the URL
  // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<public_id>.<ext>
  try {
    const urlParts = user.avatar.split('/');
    const fileWithExt = urlParts[urlParts.length - 1];           // e.g. "abc123.webp"
    const fileName    = fileWithExt.split('.')[0];                // e.g. "abc123"
    const folderIndex = urlParts.indexOf('upload') + 2;          // skip the version segment
    const folder      = urlParts.slice(folderIndex, -1).join('/'); // e.g. "cloudburn/avatars"
    const publicId    = `${folder}/${fileName}`;                  // e.g. "cloudburn/avatars/abc123"

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Log but don't block DB update — Cloudinary cleanup is best-effort
    console.error('[removeAvatar] Cloudinary destroy failed:', err.message);
  }

  user.avatar = null;
  await user.save();

  return sendSuccess(res, 200, 'Avatar removed successfully', { avatar: null });
});

// ── PATCH /api/settings/password ──────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Both current and new password are required', 400);
  }
  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user.passwordHash) {
    throw new AppError('Password change is not available for Google OAuth accounts', 400);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return sendSuccess(res, 200, 'Password updated successfully');
});

// ── DELETE /api/settings/leave-org ───────────────────────────────────────────
// Only non-Admin users can leave. Admin must transfer or delete org.
export const leaveOrganization = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.role === 'Admin') {
    throw new AppError('Organization Admins cannot leave. Transfer ownership or delete the organization first.', 403);
  }

  user.orgId  = null;
  user.teamId = null;
  await user.save();

  return sendSuccess(res, 200, 'You have left the organization');
});
