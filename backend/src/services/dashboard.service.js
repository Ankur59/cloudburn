import DailyCost from '../models/dailyCost.model.js';

export const buildDashboardData = (billingData) => {
  const { summary, monthComparison, serviceBreakdown, dailyBreakdown, byTeam } =
    billingData;

  // 1. KPIs
  const mtdCost = monthComparison?.thisMonthTotal || 0;
  const mtdTrendStr = monthComparison?.changePercent
    ? (monthComparison.changePercent > 0 ? "+" : "") +
      monthComparison.changePercent +
      "%"
    : "0%";
  const mtdTrendDir = monthComparison?.changePercent > 0 ? "up" : "down";

  const savings = Math.abs(summary?.credits || 0);
  // Projected cost = average daily * 30
  const daysInMonth = new Date().getDate();
  const avgDaily = mtdCost / (daysInMonth || 1);
  const projected = avgDaily * 30;

  const kpis = [
    {
      label: "Total Spend (MTD)",
      value: `$${mtdCost}`,
      trend: mtdTrendStr,
      trendDirection: mtdTrendDir,
      subtitle: "from last month",
      icon: "dollar",
      budgetUsed: Math.min(100, Math.round((mtdCost / 5000) * 100)) || 0,
    },
    {
      label: "Savings This Month",
      value: `$${savings}`,
      subtitle: "Credits & Refunds",
      icon: "savings",
      valueColor: "success",
    },
    {
      label: "Projected Month-End Cost",
      value: `$${projected}`,
      trend: "+0%",
      trendDirection: "up",
      subtitle: "vs last month projection",
      icon: "projection",
    },
    {
      label: "Active Alerts",
      value: "2",
      subtitle: "1 critical",
      subtitleHighlight: "1 warning",
      icon: "alert",
      valueColor: "danger",
    },
  ];

  // 2. Daily Cost Trend
  const months = [
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
      date: `${months[dateObj.getMonth()]} ${dateObj.getDate()}`,
      aws: {
        cost: d.netCost,
        credits: d.credits,
        grossCost: d.grossCost,
      },

      gcp: 0,
      azure: 0,
    };
  });

  // 3. Cost By Service
  const maxServiceCost = Math.max(
    ...(serviceBreakdown || []).map((s) => s.cost),
    1,
  );
  const services = (serviceBreakdown || []).slice(0, 6).map((s) => ({
    name: s.service,
    cost: s.cost,
    percentage: Math.round((s.cost / maxServiceCost) * 100),
  }));

  // 4. Top Spending Teams
  const teams = (byTeam || []).slice(0, 5).map((t) => {
    const spent = t.cost;
    const budget = Math.round(spent * 1.2 + 50);
    const remaining = budget - spent;
    let status = "on-track";
    if (remaining < budget * 0.1) status = "at-risk";
    if (remaining < 0) status = "over-budget";

    return {
      name: t.team === "unassigned" ? "Unallocated" : t.team,
      budget,
      spent,
      remaining,
      status,
    };
  });

  // 5. Recent Alerts
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

  // Filter query: only include data where cost is greater than 0
  const query = { orgId, netCost: { $gt: 0 } };

  // 1. Get total count for pagination metadata
  const totalRows = await DailyCost.countDocuments(query);
  const totalPages = Math.ceil(totalRows / limit);

  // 2. Fetch the current page of records
  const records = await DailyCost.find(query)
    .sort({ date: -1, service: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (!records || records.length === 0) {
    return {
      reports: [],
      pagination: { totalRows, totalPages, currentPage: page, pageSize: limit }
    };
  }

  // 3. For each record, find the "previous" day's cost to calculate delta
  const reports = await Promise.all(
    records.map(async (r) => {
      // Find the most recent record for this service before this record's date
      const prevRecord = await DailyCost.findOne({
        orgId,
        service: r.service,
        date: { $lt: r.date }
      })
        .sort({ date: -1 })
        .lean();

      const prevCost = prevRecord ? prevRecord.netCost : 0;
      const cost = r.netCost;
      let delta = 0;
      console.log(r);
      
      if (prevCost > 0) {
        delta = +(((cost - prevCost) / prevCost) * 100).toFixed(1);
      }

      // Format date as "Mar 1, 2024"
      const dateObj = new Date(r.date);
      const dateFormatted = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return {
        id: r._id,
        date: dateFormatted,
        service: r.service,
        team: "Unassigned", // DailyCost doesn't have team tags currently
        cloud: "AWS",
        cost: +cost.toFixed(2),
        prev: +prevCost.toFixed(2),
        delta: delta,
      };
    })
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
