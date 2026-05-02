import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { decrypt, encrypt } from "../utils/encryption.js";
import {
  verifyAwsCredentials,
  getAwsCost,
  getMonthlyCostByService,
  getCostByRegion,
  getCostByUsageType,
  getCostByOperation,
  getCostByRecordType,
  getDailySpendTrend,
  getCostByTeam,
  getMonthComparison,
  transformAwsCost,
  getTotalCost,
  aggregateByDate,
  aggregateByService,
  aggregateByTeam,
} from "../services/aws.service.js";

// ── Helper: load and decrypt org AWS credentials ──────────────────────────────
const getOrgCreds = async (orgId) => {
  const org = await Organization.findById(orgId).select(
    "+awsAccessKey +awsSecretKey",
  );
  if (!org?.awsAccessKey || !org?.awsSecretKey || !org?.awsRegion) return null;
  return {
    accessKey: decrypt(org.awsAccessKey),
    secretKey: decrypt(org.awsSecretKey),
    region: org.awsRegion,
  };
};

// ── POST /api/aws/connect ─────────────────────────────────────────────────────
export const connectAWS = asyncHandler(async (req, res) => {
  const { accessKey, secretKey, region } = req.body;

  const result = await verifyAwsCredentials(accessKey, secretKey, region);
  if (!result.isValid) {
    throw new AppError("Invalid AWS credentials", 400);
  }

  await Organization.findByIdAndUpdate(req.user.orgId, {
    awsAccessKey: encrypt(accessKey),
    awsSecretKey: encrypt(secretKey),
    awsRegion: region,
    awsConnectedAt: new Date(),
  });

  return sendSuccess(res, 200, "AWS connected successfully", {
    accountId: result.accountId,
    arn: result.arn,
    userId: result.userId,
  });
});

// ── GET /api/aws/cost ─────────────────────────────────────────────────────────
// Daily cost — last 30 days, by service + Team tag.
export const getCost = asyncHandler(async (req, res) => {
  const creds = await getOrgCreds(req.user.orgId);
  if (!creds) {
    throw new AppError(
      "AWS credentials not configured. Please connect AWS first.",
      400,
    );
  }

  const { accessKey, secretKey } = creds;

  const raw = await getAwsCost(accessKey, secretKey);
  const records = transformAwsCost(raw);
  const summary = getTotalCost(records);
  const serviceBreakdown = aggregateByService(records);
  const dailyBreakdown = aggregateByDate(records);
  const teamBreakdown = aggregateByTeam(records);

  // Percent of gross spend per service (gross = before credits, always positive)
  const serviceWithPercent = serviceBreakdown.map((s) => ({
    ...s,
    percent:
      summary.grossCost > 0
        ? +((s.cost / summary.grossCost) * 100).toFixed(2)
        : 0,
  }));

  return sendSuccess(res, 200, "AWS cost fetched successfully", {
    summary: { ...summary, period: "last_30_days", currency: "USD" },
    serviceBreakdown: serviceWithPercent,
    dailyBreakdown,
    teamBreakdown,
    rawRecords: records,
  });
});

// ── GET /api/aws/billing ──────────────────────────────────────────────────────
// Full billing dashboard — all Cost Explorer dimensions in one call.
// Uses only ce:GetCostAndUsage — no other IAM permissions required.
export const getFullBilling = asyncHandler(async (req, res) => {
  const creds = await getOrgCreds(req.user.orgId);
  if (!creds) {
    throw new AppError(
      "AWS credentials not configured. Please connect AWS first.",
      400,
    );
  }

  const { accessKey, secretKey } = creds;

  // Fire all 9 Cost Explorer queries in parallel
  const [
    dailyRaw,
    // monthlyCostByService,
    // byRegion,
    // byUsageType,
    // byOperation,
    // byRecordType,
    // dailyTrend90,
    // byTeam,
    // monthComparison,
  ] = await Promise.all([
    getAwsCost(accessKey, secretKey),
    
    // getMonthlyCostByService(accessKey, secretKey),
    // getCostByRegion(accessKey, secretKey),
    // getCostByUsageType(accessKey, secretKey),
    // getCostByOperation(accessKey, secretKey),
    // getCostByRecordType(accessKey, secretKey),
    // getDailySpendTrend(accessKey, secretKey),
    // getCostByTeam(accessKey, secretKey),
    // getMonthComparison(accessKey, secretKey),
  ]);

  const records = transformAwsCost(dailyRaw);
  // const summary = getTotalCost(records);
  // const serviceBreakdown = aggregateByService(records);
  // const dailyBreakdown = aggregateByDate(records);

  // Percent of gross spend per service (gross = before credits, always positive)
  // const serviceWithPercent = serviceBreakdown.map((s) => ({
  //   ...s,
  //   percent:
  //     summary.grossCost > 0
  //       ? +((s.cost / summary.grossCost) * 100).toFixed(2)
  //       : 0,
  // }));

  // Build monthly total trend from per-service monthly rows
  const monthlyTotalsMap = {};
  // monthlyCostByService.forEach(({ month, cost }) => {
  //   monthlyTotalsMap[month] = (monthlyTotalsMap[month] || 0) + cost;
  // });
  // const monthlyTrend = Object.entries(monthlyTotalsMap)
  //   .map(([month, cost]) => ({ month, cost: +cost.toFixed(6) }))
  //   .sort((a, b) => a.month.localeCompare(b.month));

  return sendSuccess(res, 200, "Full billing data fetched successfully", {
    // summary: {
    //   // last30DaysTotal: summary.totalCost,
    //   // topService: summary.topService,
    //   currency: "USD",
    //   period: {
    //     daily: "last_30_days",
    //     trend: "last_90_days",
    //     monthly: "last_12_months",
    //   },
    // },
    // monthly: {
    //   // totalTrend: monthlyTrend,
    //   // byService: monthlyCostByService,
    // },
    // byRegion,
    // byUsageType,
    // byOperation,
    // byRecordType,
    // byTeam,
    rawDailyRecords: records,
  });
});
