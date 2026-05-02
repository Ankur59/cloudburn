import asyncHandler from "../middlewares/async.middleware.js";
import BillingSnapshot from "../models/billingSnapshot.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";

// ── GET /api/dashboard ────────────────────────────────────────────────────────
// Fetches the pre-formatted dashboard data from the latest BillingSnapshot.
export const getDashboardData = asyncHandler(async (req, res) => {
  const snapshot = await BillingSnapshot.findOne({ orgId: req.user.orgId });

  if (!snapshot) {
    throw new AppError(
      "No billing data found. Please connect AWS and fetch billing data first.",
      404
    );
  }

  const dashboardData = snapshot.dashboardData || {};

  return sendSuccess(res, 200, "Dashboard data fetched successfully", dashboardData);
});
