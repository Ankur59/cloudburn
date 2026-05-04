import Organization from "../models/organization.model.js";
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
} from "./aws.service.js";
import { buildDashboardData } from "./dashboard.service.js";
import { saveDailyCosts } from "./cost.service.js";
import BillingSnapshot from "../models/billingSnapshot.model.js";
import { refreshRAGForOrg } from "../loaders/rag.loader.js";
import { refreshInsightsForOrg } from "./insights.service.js";

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

export const refreshBillingSnapshotForOrg = async (orgId) => {
  const creds = await getOrgCreds(orgId);
  if (!creds) {
    throw new Error("AWS credentials not configured. Please connect AWS first.");
  }

  const { accessKey, secretKey, region = "us-east-1" } = creds;

  const [
    dailyRaw,
    monthlyCostByService,
    byRegion,
    byUsageType,
    byOperation,
    byRecordType,
    dailyTrend90,
    byTeamRaw,
    teamInstances,
    monthComparison,
  ] = await Promise.all([
    getAwsCost(accessKey, secretKey),
    getMonthlyCostByService(accessKey, secretKey),
    getCostByRegion(accessKey, secretKey),
    getCostByUsageType(accessKey, secretKey),
    getCostByOperation(accessKey, secretKey),
    getCostByRecordType(accessKey, secretKey),
    getDailySpendTrend(accessKey, secretKey),
    getCostByTeam(accessKey, secretKey),
    getCostByTeamInstances(accessKey, secretKey, region),
    getMonthComparison(accessKey, secretKey),
  ]);

  const records = transformAwsCost(dailyRaw);
  const summary = getTotalCost(records);
  const serviceBreakdown = aggregateByService(records);
  const dailyBreakdown = aggregateByDate(records);

  const serviceWithPercent = serviceBreakdown.map((s) => ({
    ...s,
    percentOfTotal:
      summary.grossCost > 0
        ? +((s.cost / summary.grossCost) * 100).toFixed(2)
        : 0,
  }));

  const monthlyTotalsMap = {};
  monthlyCostByService.forEach(({ month, cost }) => {
    monthlyTotalsMap[month] = (monthlyTotalsMap[month] || 0) + cost;
  });
  const monthlyTrend = Object.entries(monthlyTotalsMap)
    .map(([month, cost]) => ({ month, cost: +cost.toFixed(6) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const creditRow = byRecordType.find((r) => r.recordType === "Credit");
  const refundRow = byRecordType.find((r) => r.recordType === "Refund");
  const totalSavings = Math.abs(
    (creditRow?.cost || 0) + (refundRow?.cost || 0),
  );
  const totalCreditsRaw = -totalSavings;

  const instancesByTeam = {};
  teamInstances.forEach((t) => {
    instancesByTeam[t.team] = t.instances || [];
  });

  const byTeam = byTeamRaw.map((t) => ({
    ...t,
    instances: instancesByTeam[t.team] || [],
  }));

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

  await saveDailyCosts(records, orgId);

  await BillingSnapshot.findOneAndUpdate(
    { orgId },
    {
      $set: {
        fetchedAt: new Date(),
        grossCost: summary.grossCost,
        totalCost: summary.grossCost,
        credits: totalCreditsRaw,
        netCost: +(summary.grossCost - totalSavings).toFixed(6),
        topService: summary.topService?.name || "",
        topServiceCost: summary.topService?.cost || 0,
        serviceBreakdown: serviceWithPercent,
        dailyBreakdown,
        dailyTrend90,
        monthlyTrend,
        monthlyByService: monthlyCostByService,
        byRegion,
        byUsageType,
        byOperation,
        byRecordType,
        byTeam,
        monthComparison,
        dashboardData,
      },
      $setOnInsert: { orgId },
    },
    { upsert: true, returnDocument: "after" },
  );

  console.log(`💾 BillingSnapshot saved for org [${orgId}]`);

  refreshRAGForOrg(orgId).catch((err) =>
    console.error("⚠️  refreshRAGForOrg failed:", err.message),
  );

  refreshInsightsForOrg(orgId).catch((err) =>
    console.error("⚠️  refreshInsightsForOrg failed:", err.message),
  );

  return {
    summary: {
      grossCost: summary.grossCost,
      totalCost: summary.grossCost,
      savings: +totalSavings.toFixed(6),
      credits: +totalCreditsRaw.toFixed(6),
      topService: summary.topService,
      currency: "USD",
      period: {
        daily: "last_30_days",
        trend: "last_90_days",
        monthly: "last_12_months",
      },
    },
    monthComparison,
    serviceBreakdown: serviceWithPercent,
    dailyBreakdown,
    dailyTrend90,
    monthly: {
      totalTrend: monthlyTrend,
      byService: monthlyCostByService,
    },
    byRegion,
    byUsageType,
    byOperation,
    byRecordType,
    byTeam,
    dashboardData,
    rawDailyRecords: records,
  };
};
