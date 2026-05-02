import DailyCost from "../models/dailyCost.model.js";

// ── buildDashboardData ────────────────────────────────────────────────────────
// Converts raw billing aggregates into a pre-formatted payload consumed by
// the frontend dashboard.
//
// ⚠️  COST DISPLAY RULE:
//   All monetary values shown to the user are AmortizedCost (grossCost).
//   Credits / refunds are shown as a SEPARATE "savings" field and are NEVER
//   subtracted from the cost totals that the user sees.
//
// @param {Object} billingData
//   summary          – output of getTotalCost()  { grossCost, totalCredit, totalCost, topService }
//   monthComparison  – output of getMonthComparison()
//   serviceBreakdown – output of aggregateByService() + percentOfTotal added
//   dailyBreakdown   – output of aggregateByDate()    { date, grossCost, credits, netCost }
//   byTeam           – output of getCostByTeam() merged with getCostByTeamInstances()
//                      [{ team, cost, services[], instances[] }]

export const buildDashboardData = (billingData) => {
  const {
    summary,
    monthComparison,
    serviceBreakdown,
    dailyBreakdown,
    dailyTrend90,
    byTeam,
    byRegion,
    monthlyTrend,
    monthlyCostByService,
    byOperation,
    byRecordType,
  } = billingData;

  // ── 1. KPI Cards ─────────────────────────────────────────────────────────────
  const trendSource = (dailyTrend90 && dailyTrend90.length > 0) ? dailyTrend90 : (dailyBreakdown || []);
  const isFromTrend90 = (dailyTrend90 && dailyTrend90.length > 0);

  const now = new Date();
  const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  let computedMtdCost = 0;
  trendSource.forEach((d) => {
    if (d.date && d.date.startsWith(currentMonthStr)) {
      computedMtdCost += isFromTrend90 ? (d.cost || 0) : (d.grossCost || 0);
    }
  });

  const mtdCost = +computedMtdCost.toFixed(2);
  const lastMonthCost = +(monthComparison?.lastMonthTotal || 0).toFixed(2);
  const changePercent = monthComparison?.changePercent ?? 0;
  const mtdTrendStr = (changePercent > 0 ? "+" : "") + changePercent + "%";
  const mtdTrendDir = changePercent >= 0 ? "up" : "down";
  const savings = +Math.abs(summary?.savings ?? summary?.totalCredit ?? 0).toFixed(2);
  const daysElapsed = now.getUTCDate() || 1;
  const avgDaily = mtdCost / daysElapsed;
  const projected = +(avgDaily * new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate()).toFixed(2);
  const topSvc = summary?.topService?.name || "N/A";
  const topSvcCost = +(summary?.topService?.cost || 0).toFixed(2);

  const kpis = [
    {
      label: "Total Spend (MTD)",
      value: `$${mtdCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rawValue: mtdCost,
      trend: mtdTrendStr,
      trendDirection: mtdTrendDir,
      subtitle: "vs last month",
      icon: "dollar",
      budgetUsed: Math.min(100, Math.round((mtdCost / 5000) * 100)) || 0,
      note: "AmortizedCost — credits not deducted",
    },
    {
      label: "Savings This Month",
      value: `$${savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rawValue: savings,
      subtitle: "Credits & Refunds received",
      icon: "savings",
      valueColor: "success",
      note: "Shown separately — NOT deducted from Total Spend",
    },
    {
      label: "Projected Month-End",
      value: `$${projected.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rawValue: projected,
      trend: mtdTrendStr,
      trendDirection: mtdTrendDir,
      subtitle: "based on current daily rate",
      icon: "projection",
    },
    {
      label: "Top Service",
      value: topSvc,
      rawValue: topSvcCost,
      subtitle: `$${topSvcCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} this month`,
      icon: "service",
      valueColor: "primary",
    },
  ];

  // ── 2. Daily Cost Trend ───────────────────────────────────────────────────────
  // Prefer dailyTrend90 (clean 90-day data). Fall back to dailyBreakdown (30d).
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const dailyCostTrend = trendSource.map((d) => {
    const dateObj = new Date(d.date);
    const cost = isFromTrend90
      ? +d.cost.toFixed(4)
      : +(d.grossCost || 0).toFixed(4);
    return {
      date: `${MONTH_NAMES[dateObj.getMonth()]} ${dateObj.getDate()}`,
      fullDate: d.date,
      aws: {
        cost,
        credits: isFromTrend90 ? 0 : +(d.credits || 0).toFixed(4),
        netCost: isFromTrend90 ? cost : +(d.netCost || cost).toFixed(4),
      },
      gcp: 0,
      azure: 0,
    };
  });

  // ── 3. Cost By Service (top 10) ───────────────────────────────────────────────
  const maxServiceCost = Math.max(...(serviceBreakdown || []).map((s) => s.cost), 1);
  const services = (serviceBreakdown || []).slice(0, 10).map((s) => ({
    name: s.service,
    cost: +s.cost.toFixed(4),
    percentOfTotal: s.percentOfTotal ?? 0,
    barWidth: Math.round((s.cost / maxServiceCost) * 100),
  }));

  // ── 4. Top Spending Teams ─────────────────────────────────────────────────────
  const teams = (byTeam || []).slice(0, 5).map((t) => {
    const spent = +t.cost.toFixed(2);
    const budget = Math.round(spent * 1.2 + 50);
    const remaining = +(budget - spent).toFixed(2);
    let status = "on-track";
    if (remaining < budget * 0.1) status = "at-risk";
    if (remaining < 0) status = "over-budget";

    const teamServices = (t.services || []).slice(0, 5).map((s) => ({
      service: s.service,
      cost: +s.cost.toFixed(4),
      usageQty: +s.usageQty.toFixed(2),
      unit: s.unit || "",
    }));

    const teamInstances = (t.instances || []).slice(0, 5).map((i) => ({
      resourceId: i.resourceId,
      instanceName: i.instanceName,
      instanceType: i.instanceType,
      state: i.state,
      az: i.az,
      cost: +i.cost.toFixed(4),
      usageHours: +i.usageHours.toFixed(1),
    }));

    return {
      name: t.team === "unassigned" ? "Unallocated" : t.team,
      budget,
      spent,
      remaining,
      status,
      services: teamServices,
      instances: teamInstances,
    };
  });

  // ── 5. Monthly Trend (last 12 months) ────────────────────────────────────────
  const monthlyTrendFormatted = (monthlyTrend || []).map((m) => ({
    month: m.month, // "YYYY-MM"
    label: (() => {
      const [year, mon] = m.month.split("-");
      return `${MONTH_NAMES[parseInt(mon, 10) - 1]} '${year.slice(2)}`;
    })(),
    cost: +m.cost.toFixed(2),
  }));

  // ── 6. Month Comparison (this vs last) ───────────────────────────────────────
  const monthComparisonFormatted = {
    lastMonthTotal: lastMonthCost,
    thisMonthTotal: mtdCost,
    delta: +(mtdCost - lastMonthCost).toFixed(2),
    changePercent,
    trend: mtdTrendDir,
    byService: (monthComparison?.byService || []).slice(0, 8).map((s) => ({
      service: s.service,
      lastMonthCost: +s.lastMonthCost.toFixed(2),
      thisMonthCost: +s.thisMonthCost.toFixed(2),
      delta: +s.delta.toFixed(2),
      changePercent: s.changePercent,
      trend: s.trend,
    })),
  };

  // ── 7. Region Breakdown ───────────────────────────────────────────────────────
  const regionBreakdown = (byRegion || []).slice(0, 8).map((r) => ({
    region: r.region || "global",
    cost: +r.cost.toFixed(4),
  }));

  // ── 8. Top Operations ─────────────────────────────────────────────────────────
  const topOperations = (byOperation || []).slice(0, 8).map((op) => ({
    service: op.service,
    operation: op.operation,
    cost: +op.cost.toFixed(4),
  }));

  // ── 9. Record Type Breakdown ──────────────────────────────────────────────────
  const recordTypeBreakdown = (byRecordType || []).map((r) => ({
    recordType: r.recordType,
    cost: +r.cost.toFixed(4),
  }));

  // ── 10. Recent Alerts (static — replace with real anomaly detection later) ────
  const recentAlerts = [
    {
      id: 1,
      type: "anomaly",
      severity: "critical",
      title: "Cost Anomaly Detected",
      message: "Amazon EC2 spending spiked by 45% in the last 24 hours.",
      time: "2 hours ago",
      actionText: "View Details",
    },
    {
      id: 2,
      type: "budget",
      severity: "warning",
      title: "Budget Alert",
      message: "Frontend Apps team has consumed 90% of their monthly budget.",
      time: "5 hours ago",
      actionText: "Review Budget",
    },
  ];

  return {
    kpis,
    dailyCostTrend,
    services,
    teams,
    monthlyTrend: monthlyTrendFormatted,
    monthComparison: monthComparisonFormatted,
    regionBreakdown,
    topOperations,
    recordTypeBreakdown,
    recentAlerts,
  };
};




export const buildReportsData = async (orgId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  // Only include records where grossCost > 0 (AmortizedCost — credits not deducted)
  const query = { orgId, grossCost: { $gt: 0 } };

  // 1. Total count for pagination metadata
  const totalRows = await DailyCost.countDocuments(query);
  const totalPages = Math.ceil(totalRows / limit);

  if (totalRows === 0) {
    return {
      reports: [],
      pagination: { totalRows, totalPages, currentPage: page, pageSize: limit },
    };
  }

  // 2. Fetch current page, newest first
  const records = await DailyCost.find(query)
    .sort({ date: -1, service: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // 3. Enrich each record with day-over-day delta
  //    Cost used = grossCost (AmortizedCost — credits NOT subtracted)
  const reports = await Promise.all(
    records.map(async (r) => {
      // Find the most recent prior record for this service
      const prevRecord = await DailyCost.findOne({
        orgId,
        service: r.service,
        date: { $lt: r.date },
      })
        .sort({ date: -1 })
        .lean();

      // ⚠️  Use grossCost (AmortizedCost) — do NOT use netCost which deducts credits
      const cost = r.grossCost || 0;
      const prevCost = prevRecord?.grossCost || 0;

      // Day-over-day change % (null if no previous record)
      const delta =
        prevCost > 0
          ? +(((cost - prevCost) / prevCost) * 100).toFixed(1)
          : null;

      // Human-readable date: "May 1, 2025"
      const dateFormatted = new Date(r.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return {
        id: r._id,
        date: dateFormatted,
        rawDate: r.date, // "YYYY-MM-DD" — for sorting on frontend
        service: r.service,
        cloud: "AWS",
        cost: +cost.toFixed(4), // AmortizedCost — credits NOT deducted
        prev: +prevCost.toFixed(4),
        delta, // % change vs previous day (null if first record)
        // Credits for this service/day (kept for informational display only)
        credits: +(r.credits || 0).toFixed(4),
      };
    }),
  );

  return {
    reports,
    pagination: {
      totalRows,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
};
