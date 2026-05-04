import asyncHandler from '../middlewares/async.middleware.js';
import { sendSuccess } from '../utils/responseHelper.js';
import SpikeAlert from '../models/spikeAlert.model.js';
import AppError from '../utils/AppError.js';

// ── GET /api/alerts
// Fetch all spike alerts for the current organization
export const getAlerts = asyncHandler(async (req, res) => {
  const orgId = req.user.orgId;

  if (!orgId) {
    throw new AppError('Organization not found for this user', 404);
  }

  const alerts = await SpikeAlert.find({ orgId })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 alerts for performance

  return sendSuccess(res, 200, 'Alerts fetched successfully', { alerts });
});

// ── PATCH /api/alerts/:id/resolve
// Mark an alert as read/resolved
export const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orgId = req.user.orgId;

  const alert = await SpikeAlert.findOneAndUpdate(
    { _id: id, orgId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!alert) {
    throw new AppError('Alert not found or access denied', 404);
  }

  return sendSuccess(res, 200, 'Alert resolved successfully', { alert });
});
