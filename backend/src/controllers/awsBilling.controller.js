import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { decrypt } from "../utils/encryption.js";
import {
  getAwsCost,
  transformAwsCost,
  getTotalCost,
  aggregateByDate,
  aggregateByService,
  aggregateByTeam,
} from "../services/aws.service.js";
import { saveDailyCosts } from "../services/cost.service.js";
import { refreshRAGForOrg } from "../loaders/rag.loader.js";
import { refreshBillingSnapshotForOrg } from "../services/billingSnapshot.service.js";

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

  // 1) Save per-day per-service records (await so RAG gets fresh data)
  await saveDailyCosts(records, req.user.orgId);

  // 2) Trigger RAG re-index in background — does NOT block API response
  refreshRAGForOrg(req.user.orgId).catch((err) =>
    console.error("⚠️  refreshRAGForOrg failed (getCost):", err.message),
  );

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
// Full billing dashboard — fires 10 Cost Explorer queries in parallel.
// ⚠️  ALL costs shown to the user are AmortizedCost (grossCost).
//       Credits are stored as a separate "savings" field and are NEVER
//       subtracted from the totals displayed to the user.
export const getFullBilling = asyncHandler(async (req, res) => {
  try {
    const result = await refreshBillingSnapshotForOrg(req.user.orgId);
    return sendSuccess(res, 200, "Full billing data fetched successfully", result);
  } catch (err) {
    if (err.message.includes("AWS credentials not configured")) {
      throw new AppError(err.message, 400);
    }
    throw err;
  }
});
