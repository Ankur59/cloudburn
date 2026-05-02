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
