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
    recentAlerts: rawAlerts,
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

  // ── 10. Recent Alerts (Real data from SpikeAlert) ─────────────────────────
  const formatTimeAgo = (date) => {
    if (!date) return "Just now";
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const recentAlerts = (rawAlerts || []).map((alert) => {
    let type = "anomaly";
    let severity = "warning";
    let title = "Alert Detected";
    let actionText = "View Details";

    if (alert.alertType === "SPIKE") {
      type = "anomaly";
      severity = "critical";
      title = "Cost Anomaly Detected";
    } else if (alert.alertType === "ZOMBIE") {
      type = "zombie";
      severity = "warning";
      title = "Zombie Resource Detected";
      actionText = "Review Resource";
    } else if (alert.alertType === "BUDGET") {
      type = "budget";
      severity = "warning";
      title = "Budget Alert";
      actionText = "Review Budget";
    }

    return {
      id: alert._id,
      type,
      severity,
      title,
      message: alert.message || `Unusual behavior detected in ${alert.service}.`,
      time: formatTimeAgo(alert.createdAt),
      actionText,
    };
  });

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




export const buildReportsData = async (orgId, page = 1, limit = 50, startDate = null, endDate = null, provider = null, team = null) => {
  const skip = (page - 1) * limit;

  // Only include records where grossCost > 0 (AmortizedCost — credits not deducted)
  const query = { orgId, grossCost: { $gt: 0 } };

  // Apply optional date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate)   query.date.$lte = endDate;
  }
  
  if (provider && provider !== "All Providers") {
    // We don't have a 'cloud' field in DailyCost yet. 
    // Since everything is AWS currently, if they select AWS, do nothing.
    // If they select GCP/Azure, return nothing.
    if (provider !== "AWS") {
      query.cloud = provider; // will naturally return 0 results
    }
  }
  
  if (team && team !== "All Teams") {
    // We don't have a 'team' field in DailyCost yet (it's aggregated in memory).
    // So if they filter by team, it will return nothing until we add that field.
    query.team = team;
  }

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

import BillingSnapshot from "../models/billingSnapshot.model.js";

// ── buildHistoricalData ───────────────────────────────────────────────────────
export const buildHistoricalData = async (orgId, year, month) => {
  console.log(`[buildHistoricalData] Incoming params -> year: "${year}", month: "${month}"`);
  
  let snapshot = await BillingSnapshot.findOne({ orgId });
  
  if (!snapshot) {
    throw new Error("No billing data found. Please connect AWS and fetch billing data first.");
  }

  let parsedMonth = null;
  if (month && String(month).trim() !== "" && String(month) !== "undefined" && String(month) !== "null" && String(month).toLowerCase() !== "all time") {
    if (isNaN(month)) {
      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const monthNamesShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const monthLower = month.toString().trim().toLowerCase();
      
      let monthIndex = monthNames.indexOf(monthLower);
      if (monthIndex === -1) {
        monthIndex = monthNamesShort.indexOf(monthLower);
      }
      
      if (monthIndex !== -1) {
        parsedMonth = String(monthIndex + 1).padStart(2, '0');
      }
    } else {
      const m = parseInt(month, 10);
      if (m >= 1 && m <= 12) {
        parsedMonth = String(m).padStart(2, '0');
      }
    }
  }

  let parsedYear = year ? String(year).trim() : null;
  // Ignore invalid years like "undefined" or "All Time"
  if (parsedYear && (parsedYear === "undefined" || parsedYear === "null" || parsedYear === "" || parsedYear.toLowerCase() === "all time")) {
    parsedYear = null;
  }
  // If only month is given, default to current year
  if (parsedMonth && !parsedYear) {
    parsedYear = new Date().getFullYear().toString();
  }

  const isSpecificMonth = parsedYear && parsedMonth;
  const prefix = isSpecificMonth ? `${parsedYear}-${parsedMonth}` : (parsedYear ? `${parsedYear}` : null);
  
  console.log(`[buildHistoricalData] Parsed -> parsedYear: ${parsedYear}, parsedMonth: ${parsedMonth}, prefix: ${prefix}`);
  
  let trend = [];
  let byServiceMap = {};
  
  // Extra details for the frontend
  let detailedMonthly = [];

  if (isSpecificMonth) {
    // Return daily trend for that specific month
    const days = snapshot.dailyTrend90 || [];
    trend = days.filter(d => d.date.startsWith(prefix)).map(d => ({
      date: d.date,
      cost: d.cost || 0,
      netCost: d.cost || 0,
      credits: 0
    }));

    // Service breakdown for that specific month
    const monthlySvc = snapshot.monthlyByService || [];
    monthlySvc.filter(s => s.month === prefix).forEach(s => {
      byServiceMap[s.service] = (byServiceMap[s.service] || 0) + (s.cost || 0);
    });

    // Provide the year's context as detail
    detailedMonthly = (snapshot.monthlyTrend || []).filter(m => m.month.startsWith(parsedYear));

  } else if (parsedYear) {
    // Return monthly trend for that year
    const months = snapshot.monthlyTrend || [];
    trend = months.filter(m => m.month.startsWith(prefix)).map(m => ({
      date: m.month,
      cost: m.cost || 0,
      netCost: m.cost || 0,
      credits: 0
    }));

    detailedMonthly = trend;

    // Service breakdown for that year
    const monthlySvc = snapshot.monthlyByService || [];
    monthlySvc.filter(s => s.month.startsWith(prefix)).forEach(s => {
      byServiceMap[s.service] = (byServiceMap[s.service] || 0) + (s.cost || 0);
    });
  } else {
    // Return all-time monthly trend
    const months = snapshot.monthlyTrend || [];
    trend = months.map(m => ({
      date: m.month,
      cost: m.cost || 0,
      netCost: m.cost || 0,
      credits: 0
    }));

    detailedMonthly = trend;

    // Service breakdown all-time
    const monthlySvc = snapshot.monthlyByService || [];
    monthlySvc.forEach(s => {
      byServiceMap[s.service] = (byServiceMap[s.service] || 0) + (s.cost || 0);
    });
  }

  const byService = Object.entries(byServiceMap)
    .map(([service, cost]) => ({ service, cost: +cost.toFixed(4), netCost: +cost.toFixed(4), credits: 0 }))
    .sort((a, b) => b.cost - a.cost);

  const totalCost = trend.reduce((acc, curr) => acc + curr.cost, 0);

  return {
    period: prefix || "All Time",
    summary: {
      totalCost: +totalCost.toFixed(4),
      totalNetCost: +totalCost.toFixed(4),
      totalCredits: 0,
    },
    trend: trend.map(t => ({...t, cost: +t.cost.toFixed(4), netCost: +t.netCost.toFixed(4)})),
    byService,
    // Add extra rich details so frontend can show a richer UI
    details: {
      monthlyOverview: detailedMonthly.map(m => ({
        month: m.date || m.month,
        cost: +(m.cost || 0).toFixed(4)
      })),
      recentDailyTrend: snapshot.dailyTrend90 ? snapshot.dailyTrend90.slice(-14) : [], // Last 14 days
      topServiceOverall: snapshot.topService,
      topServiceCostOverall: snapshot.topServiceCost
    }
  };
};

