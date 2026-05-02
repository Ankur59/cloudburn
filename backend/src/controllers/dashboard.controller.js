import asyncHandler from "../middlewares/async.middleware.js";
import BillingSnapshot from "../models/billingSnapshot.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { buildReportsData } from "../services/dashboard.service.js";

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

// ── GET /api/dashboard/reports ───────────────────────────────────────────────
export const getReportsData = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;

  const result = await buildReportsData(req.user.orgId, page, limit);

  return sendSuccess(res, 200, "Reports fetched successfully", {
    reports: result.reports,
    pagination: result.pagination,
  });
});
