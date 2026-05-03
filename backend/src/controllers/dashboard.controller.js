import asyncHandler from "../middlewares/async.middleware.js";
import BillingSnapshot from "../models/billingSnapshot.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { buildReportsData, buildDashboardData } from "../services/dashboard.service.js";

// ── GET /api/dashboard ────────────────────────────────────────────────────────
// Fetches the pre-formatted dashboard data from the latest BillingSnapshot.
// Always rebuilds from raw snapshot fields so new dashboard sections are included
// even if the snapshot was saved before those sections were added.
export const getDashboardData = asyncHandler(async (req, res) => {
  const snapshot = await BillingSnapshot.findOne({ orgId: req.user.orgId });

  if (!snapshot) {
    throw new AppError(
      "No billing data found. Please connect AWS and fetch billing data first.",
      404
    );
  }

  // Rebuild dashboard from raw snapshot fields every time — this ensures new
  // sections (monthlyTrend, regionBreakdown, topOperations, etc.) are always
  // returned even if the snapshot was persisted before those sections existed.
  const dashboardData = buildDashboardData({
    summary: {
      grossCost: snapshot.grossCost,
      totalCost: snapshot.totalCost,
      savings: Math.abs(snapshot.credits || 0),
      totalCredit: snapshot.credits || 0,
      topService: { name: snapshot.topService, cost: snapshot.topServiceCost },
    },
    monthComparison: snapshot.monthComparison,
    serviceBreakdown: snapshot.serviceBreakdown,
    dailyBreakdown: snapshot.dailyBreakdown,
    dailyTrend90: snapshot.dailyTrend90,
    byTeam: snapshot.byTeam,
    byRegion: snapshot.byRegion,
    monthlyTrend: snapshot.monthlyTrend,
    byOperation: snapshot.byOperation,
    byRecordType: snapshot.byRecordType,
  });

  return sendSuccess(res, 200, "Dashboard data fetched successfully", dashboardData);
});

// ── GET /api/dashboard/reports ───────────────────────────────────────────────
export const getReportsData = asyncHandler(async (req, res) => {
  const page      = parseInt(req.query.page,  10) || 1;
  const limit     = parseInt(req.query.limit, 10) || 50;
  const startDate = req.query.startDate || null;   // "YYYY-MM-DD"
  const endDate   = req.query.endDate   || null;   // "YYYY-MM-DD"
  const provider  = req.query.provider  || null;
  const team      = req.query.team      || null;

  const result = await buildReportsData(req.user.orgId, page, limit, startDate, endDate, provider, team);

  return sendSuccess(res, 200, "Reports fetched successfully", {
    reports:    result.reports,
    pagination: result.pagination,
  });
});

// ── GET /api/dashboard/historical ────────────────────────────────────────────
// Fetches historical data grouped by month or year based on query parameters
export const getHistoricalData = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  // Need to import buildHistoricalData from dashboard.service.js
  const { buildHistoricalData } = await import("../services/dashboard.service.js");
  const historicalData = await buildHistoricalData(req.user.orgId, year, month);

  return sendSuccess(res, 200, "Historical data fetched successfully", historicalData);
});
