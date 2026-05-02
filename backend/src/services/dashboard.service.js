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
  const { summary, monthComparison, serviceBreakdown, dailyBreakdown, byTeam } =
    billingData;

  // ── 1. KPI Cards ─────────────────────────────────────────────────────────────
  // All cost figures = AmortizedCost (grossCost). Credits shown as savings only.

  // Month-to-date spend: sum of AmortizedCost for the current calendar month
  const mtdCost = +(monthComparison?.thisMonthTotal || 0).toFixed(2);

  // Month-over-month trend string, e.g. "+12.5%" or "-3.2%"
  const changePercent = monthComparison?.changePercent ?? 0;
  const mtdTrendStr = (changePercent > 0 ? "+" : "") + changePercent + "%";
  const mtdTrendDir = changePercent >= 0 ? "up" : "down";

  // Credits / refunds — read from summary.savings which is populated from byRecordType
  // (NOT from totalCredit, which is now ~0 since cost queries filter out credit rows)
  const savings = +Math.abs(
    summary?.savings ?? summary?.totalCredit ?? 0,
  ).toFixed(2);

  // Projected month-end cost = average daily spend × 30
  const daysElapsed = new Date().getDate() || 1;
  const avgDaily = mtdCost / daysElapsed;
  const projected = +(avgDaily * 30).toFixed(2);

  // Top service this month
  const topSvc = summary?.topService?.name || "N/A";
  const topSvcCost = +(summary?.topService?.cost || 0).toFixed(2);

  const kpis = [
    {
      // Primary KPI: total AmortizedCost spend month-to-date
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
      // Savings KPI: show credits / refunds as positive "savings" figure
      label: "Savings This Month",
      value: `$${savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rawValue: savings,
      subtitle: "Credits & Refunds received",
      icon: "savings",
      valueColor: "success",
      note: "Shown separately — NOT deducted from Total Spend",
    },
    {
      // Projection KPI
      label: "Projected Month-End",
      value: `$${projected.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      rawValue: projected,
      trend: mtdTrendStr,
      trendDirection: mtdTrendDir,
      subtitle: "based on current daily rate",
      icon: "projection",
    },
    {
      // Top-spending service
      label: "Top Service",
      value: topSvc,
      rawValue: topSvcCost,
      subtitle: `$${topSvcCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} this month`,
      icon: "service",
      valueColor: "primary",
    },
  ];

  log;

  // ── 2. Daily Cost Trend (last 30 days) ────────────────────────────────────────
  // cost field = grossCost (AmortizedCost). Credits shown as separate field.
  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dailyCostTrend = (dailyBreakdown || []).map((d) => {
    const dateObj = new Date(d.date);
    return {
      date: `${MONTH_NAMES[dateObj.getMonth()]} ${dateObj.getDate()}`,
      fullDate: d.date, // "YYYY-MM-DD" — useful for tooltip labels
      aws: {
        cost: +d.grossCost.toFixed(4), // AmortizedCost — PRIMARY display value
        credits: +d.credits.toFixed(4), // credits this day (negative value)
        netCost: +d.netCost.toFixed(4), // after-credit cost — internal only
      },
      gcp: 0, // placeholder for future multi-cloud support
      azure: 0,
    };
  });

  // ── 3. Cost By Service (top 8 services) ───────────────────────────────────────
  // Relative bar width = cost / maxCost × 100 (visual only, not % of total)
  const maxServiceCost = Math.max(
    ...(serviceBreakdown || []).map((s) => s.cost),
    1,
  );
  const services = (serviceBreakdown || []).slice(0, 8).map((s) => ({
    name: s.service,
    cost: +s.cost.toFixed(4),
    percentOfTotal: s.percentOfTotal ?? 0, // % of org's total gross spend
    barWidth: Math.round((s.cost / maxServiceCost) * 100), // relative bar width
  }));

  // ── 4. Top Spending Teams ─────────────────────────────────────────────────────
  // Each team card shows: spent, estimated budget, services breakdown,
  // and EC2 instance types running in that team.
  const teams = (byTeam || []).slice(0, 5).map((t) => {
    const spent = +t.cost.toFixed(2);
    // Estimated budget heuristic: 20 % headroom above current spend (min $50)
    const budget = Math.round(spent * 1.2 + 50);
    const remaining = +(budget - spent).toFixed(2);

    let status = "on-track";
    if (remaining < budget * 0.1) status = "at-risk";
    if (remaining < 0) status = "over-budget";

    // Top 5 services for this team, sorted by cost
    const teamServices = (t.services || []).slice(0, 5).map((s) => ({
      service: s.service,
      cost: +s.cost.toFixed(4),
      usageQty: +s.usageQty.toFixed(2),
      unit: s.unit || "",
    }));

    // EC2 instances running in this team (from getCostByTeamInstances)
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
      services: teamServices, // which AWS services this team is spending on
      instances: teamInstances, // which EC2 instance types this team is running
    };
  });

  // ── 5. Recent Alerts (static — replace with real anomaly detection later) ─────
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
