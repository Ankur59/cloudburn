import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { decrypt } from "../utils/encryption.js";
import {
  getAwsCost,
  getMonthlyCostByService,
  getCostByRegion,
  getCostByUsageType,
  getCostByOperation,
  getCostByRecordType,
  getDailySpendTrend,
  getCostByTeam,
  getCostByTeamInstances,
  getMonthComparison,
  transformAwsCost,
  getTotalCost,
  aggregateByDate,
  aggregateByService,
  aggregateByTeam,
} from "../services/aws.service.js";
import { buildDashboardData } from "../services/dashboard.service.js";
import { saveDailyCosts } from "../services/cost.service.js";
import BillingSnapshot from "../models/billingSnapshot.model.js";
import { refreshRAGForOrg } from "../loaders/rag.loader.js";
import { refreshInsightsForOrg } from "../services/insights.service.js";

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
  const creds = await getOrgCreds(req.user.orgId);
  if (!creds) {
    throw new AppError(
      "AWS credentials not configured. Please connect AWS first.",
      400,
    );
  }

  const { accessKey, secretKey, region = "us-east-1" } = creds;

  // ── Step 1: Fire all 10 Cost Explorer queries in parallel ───────────────────
  // Each query targets a different dimension. Running them in parallel keeps
  // total latency = slowest query (not sum of all queries).
  const [
    dailyRaw, // Daily cost: last 30 days, grouped by SERVICE + Team tag
    monthlyCostByService, // Monthly cost: last 12 months, grouped by SERVICE
    byRegion, // Cost by AWS region: last 30 days
    byUsageType, // Cost by usage type (e.g. "USW2-BoxUsage:t3.micro")
    byOperation, // Cost by API operation (e.g. "RunInstances", "PutObject")
    byRecordType, // Cost split: Usage | Tax | Credit | Refund | Fee
    dailyTrend90, // Daily total spend: last 90 days (no groupby) — trend line
    byTeamRaw, // Cost by Team tag + SERVICE: last 30 days
    teamInstances, // EC2 instance types per team: last 30 days
    monthComparison, // This month vs last month per service
  ] = await Promise.all([
    getAwsCost(accessKey, secretKey),
    getMonthlyCostByService(accessKey, secretKey),
    getCostByRegion(accessKey, secretKey),
    getCostByUsageType(accessKey, secretKey),
    getCostByOperation(accessKey, secretKey),
    getCostByRecordType(accessKey, secretKey),
    getDailySpendTrend(accessKey, secretKey),
    getCostByTeam(accessKey, secretKey),
    getCostByTeamInstances(accessKey, secretKey, region), // pass region for EC2 DescribeInstances
    getMonthComparison(accessKey, secretKey),
  ]);

  // ── Step 2: Transform + aggregate daily records ─────────────────────────────
  const records = transformAwsCost(dailyRaw);
  const summary = getTotalCost(records); // grossCost = AmortizedCost
  const serviceBreakdown = aggregateByService(records);
  const dailyBreakdown = aggregateByDate(records);

  // Attach % of total gross spend to each service row
  const serviceWithPercent = serviceBreakdown.map((s) => ({
    ...s,
    percentOfTotal:
      summary.grossCost > 0
        ? +((s.cost / summary.grossCost) * 100).toFixed(2)
        : 0,
  }));

  // ── Step 3: Build monthly trend aggregation ─────────────────────────────────
  // Roll up per-service monthly rows into a single total per month
  const monthlyTotalsMap = {};
  monthlyCostByService.forEach(({ month, cost }) => {
    monthlyTotalsMap[month] = (monthlyTotalsMap[month] || 0) + cost;
  });
  const monthlyTrend = Object.entries(monthlyTotalsMap)
    .map(([month, cost]) => ({ month, cost: +cost.toFixed(6) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ── Step 3b: Extract savings from byRecordType ──────────────────────────────
  // Since all cost queries now filter OUT credit record types, we read the
  // credit/refund amounts directly from byRecordType (which has NO filter).
  // This gives the true savings figure shown separately to the user.
  const creditRow = byRecordType.find((r) => r.recordType === "Credit");
  const refundRow = byRecordType.find((r) => r.recordType === "Refund");
  const totalSavings = Math.abs(
    (creditRow?.cost || 0) + (refundRow?.cost || 0),
  );
  const totalCreditsRaw = -totalSavings; // negative value (kept for reference)

  // ── Step 4: Merge instance-type data into team breakdown ────────────────────
  // byTeamRaw has { team, cost, services[] } from getCostByTeam.
  // Enrich each team entry with instance types from getCostByTeamInstances.
  const instancesByTeam = {};
  teamInstances.forEach((t) => {
    instancesByTeam[t.team] = t.instances || [];
  });

  const byTeam = byTeamRaw.map((t) => ({
    ...t,
    // instances: EC2 instance types this team is running + their cost/hours
    instances: instancesByTeam[t.team] || [],
  }));

  // ── Step 5: Build pre-formatted dashboard data ──────────────────────────────
  const dashboardData = buildDashboardData({
    summary,
    monthComparison,
    serviceBreakdown: serviceWithPercent,
    dailyBreakdown,
    dailyTrend90,
    byTeam,
    byRegion,
    monthlyTrend,
    byOperation,
    byRecordType,
  });

  // ── Step 6: Persist per-day per-service costs to DailyCost collection ───────
  await saveDailyCosts(records, req.user.orgId);

  // ── Step 7: Upsert BillingSnapshot (one doc per org, replaced on every fetch)
  // Stores ALL dimensions so the RAG engine has rich context for AI queries.
  await BillingSnapshot.findOneAndUpdate(
    { orgId: req.user.orgId },
    {
      $set: {
        fetchedAt: new Date(),

        // ─ Top-level cost summary (AmortizedCost — NO credit deduction)
        grossCost: summary.grossCost,
        totalCost: summary.grossCost, // same as grossCost — credits NOT subtracted
        credits: totalCreditsRaw, // from byRecordType: negative credit amount
        netCost: +(summary.grossCost - totalSavings).toFixed(6), // what you actually pay
        topService: summary.topService?.name || "",
        topServiceCost: summary.topService?.cost || 0,

        // ─ Breakdowns (arrays)
        serviceBreakdown, // [{ service, cost, percentOfTotal }]
        dailyBreakdown, // [{ date, grossCost, credits, netCost }]
        dailyTrend90, // [{ date, cost }] last 90 days
        monthlyTrend, // [{ month, cost }] last 12 months
        monthlyByService: monthlyCostByService, // [{ month, service, cost }]
        byRegion, // [{ region, cost }]
        byUsageType, // [{ usageType, cost, usageQuantity }]
        byOperation, // [{ service, operation, cost }]
        byRecordType, // [{ recordType, cost }]
        byTeam, // [{ team, cost, services[], instances[] }]
        monthComparison, // { lastMonthTotal, thisMonthTotal, byService[] }

        // ─ Pre-formatted data for the dashboard frontend
        dashboardData,
      },
      $setOnInsert: { orgId: req.user.orgId },
    },
    { upsert: true, returnDocument: "after" },
  );

  console.log(`💾 BillingSnapshot saved for org [${req.user.orgId}]`);

  // ── Step 8: Trigger RAG re-index in background (non-blocking) ───────────────
  refreshRAGForOrg(req.user.orgId).catch((err) =>
    console.error("⚠️  refreshRAGForOrg failed (getFullBilling):", err.message),
  );

  // ── Step 8b: Refresh AI insights cache in background (non-blocking) ─────────
  // Runs AFTER BillingSnapshot is already saved above (Step 7), so Groq gets fresh data.
  refreshInsightsForOrg(req.user.orgId).catch((err) =>
    console.error("⚠️  refreshInsightsForOrg failed (getFullBilling):", err.message),
  );

  // ── Step 9: Return full response ─────────────────────────────────────────────
  return sendSuccess(res, 200, "Full billing data fetched successfully", {
    // ─ Summary: top-level cost figures ───────────────────────────────────────
    // ⚠️  totalCost = grossCost = AmortizedCost. Credits are NOT subtracted.
    //     Show summary.savings separately as "Savings / Refunds".
    summary: {
      grossCost: summary.grossCost, // actual resource usage cost (Credits excluded from query)
      totalCost: summary.grossCost, // alias \u2014 same as grossCost
      savings: +totalSavings.toFixed(6), // credits/refunds from byRecordType (positive)
      credits: +totalCreditsRaw.toFixed(6), // same as savings but negative (raw value)
      topService: summary.topService,
      currency: "USD",
      period: {
        daily: "last_30_days",
        trend: "last_90_days",
        monthly: "last_12_months",
      },
    },

    // ─ Month-over-month comparison ────────────────────────────────────────────
    monthComparison, // { lastMonthTotal, thisMonthTotal, delta, changePercent, byService[] }

    // ─ Service-level breakdown (last 30 days) ─────────────────────────────────
    serviceBreakdown: serviceWithPercent, // [{ service, cost, percentOfTotal }]

    // ─ Daily totals (last 30 days) ────────────────────────────────────────────
    dailyBreakdown, // [{ date, grossCost, credits, netCost }]

    // ─ 90-day daily spend trend (no groupby — pure daily total) ───────────────
    dailyTrend90, // [{ date, cost }] — usage spend only (Credits/Refunds filtered out)

    // ─ Monthly aggregations ───────────────────────────────────────────────────
    monthly: {
      totalTrend: monthlyTrend, // [{ month, cost }] — aggregated across services
      byService: monthlyCostByService, // [{ month, service, cost }] — full detail
    },

    // ─ Dimension-level breakdowns ─────────────────────────────────────────────
    byRegion, // [{ region, cost }] — which AWS region is most expensive
    byUsageType, // [{ usageType, cost, usageQuantity }] — granular usage lines
    byOperation, // [{ service, operation, cost }] — which API calls cost money
    byRecordType, // [{ recordType, cost }] — Usage / Tax / Credit / Refund / Fee

    // ─ Team-level breakdown ───────────────────────────────────────────────────
    // Each team entry includes: cost, services[], instances[]
    byTeam,

    // ─ Pre-formatted dashboard payload (consumed directly by the frontend) ────
    dashboardData,

    // ─ Raw daily records (useful for debugging / custom frontend aggregations) ─
    rawDailyRecords: records,
  });
});
