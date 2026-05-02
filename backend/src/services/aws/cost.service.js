
import { makeCEClient, ceQuery } from "./client.service.js";
import { fmt, daysAgo, monthsAgo, today, parseTagValue } from "./utils.service.js";

export const getAwsCost = (accessKey, secretKey) =>
  ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "DAILY",
    Metrics: [
      "UnblendedCost",
      "AmortizedCost",
      "NetAmortizedCost",
      "UsageQuantity",
    ],
    Filter: {
      Dimensions: {
        Key: "RECORD_TYPE",
        Values: ["Usage", "Tax", "Fee"],
      },
    },
    GroupBy: [
      { Type: "DIMENSION", Key: "SERVICE" },
      { Type: "TAG", Key: "Team" },
    ],
  });

export const getMonthlyCostByService = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(monthsAgo(12)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
  });

  const rows = [];
  response.ResultsByTime?.forEach((period) => {
    const month = period.TimePeriod.Start.slice(0, 7); 
    period.Groups?.forEach((g) => {
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      if (cost > 0)
        rows.push({ month, service: g.Keys?.[0] || "unknown", cost });
    });
  });
  return rows;
};

export const getCostByRegion = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [{ Type: "DIMENSION", Key: "REGION" }],
  });

  const map = {};
  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const region = g.Keys?.[0] || "global";
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      if (cost > 0) map[region] = (map[region] || 0) + cost;
    });
  });

  return Object.entries(map)
    .map(([region, cost]) => ({ region, cost: +cost.toFixed(6) }))
    .sort((a, b) => b.cost - a.cost);
};

export const getCostByUsageType = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["UnblendedCost", "AmortizedCost", "UsageQuantity"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [{ Type: "DIMENSION", Key: "USAGE_TYPE" }],
  });

  const rows = [];
  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const usageType = g.Keys?.[0] || "unknown";
      const cost = parseFloat(g.Metrics?.UnblendedCost?.Amount || 0);
      const amortized = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      const usageQuantity = parseFloat(g.Metrics?.UsageQuantity?.Amount || 0);
      const unit = g.Metrics?.UsageQuantity?.Unit || "";
      if (usageQuantity > 0 || cost !== 0)
        rows.push({
          usageType,
          cost: +Math.abs(cost).toFixed(6),
          amortized: +amortized.toFixed(6),
          usageQuantity: +usageQuantity.toFixed(4),
          unit,
        });
    });
  });
  return rows.sort((a, b) => b.cost - a.cost);
};

export const getCostByOperation = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [
      { Type: "DIMENSION", Key: "SERVICE" },
      { Type: "DIMENSION", Key: "OPERATION" },
    ],
  });

  const rows = [];
  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      if (cost > 0)
        rows.push({
          service: g.Keys?.[0] || "unknown",
          operation: g.Keys?.[1] || "unknown",
          cost: +cost.toFixed(6),
        });
    });
  });
  return rows.sort((a, b) => b.cost - a.cost);
};

export const getCostByRecordType = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "RECORD_TYPE" }],
  });

  const rows = [];
  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      rows.push({
        recordType: g.Keys?.[0] || "unknown",
        cost: +cost.toFixed(6),
      });
    });
  });
  return rows.sort((a, b) => b.cost - a.cost);
};

export const getDailySpendTrend = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(90)), End: fmt(today()) },
    Granularity: "DAILY",
    Metrics: ["AmortizedCost"],
    Filter: {
      Dimensions: {
        Key: "RECORD_TYPE",
        Values: ["Usage", "Tax", "Fee"],
      },
    },
  });

  return (response.ResultsByTime || [])
    .map((period) => ({
      date: period.TimePeriod.Start,
      cost: +parseFloat(period.Total?.AmortizedCost?.Amount || 0).toFixed(6),
    }))
    .filter((d) => d.cost > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const getCostByTeam = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost", "UsageQuantity"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [
      { Type: "TAG", Key: "Team" }, 
      { Type: "DIMENSION", Key: "SERVICE" }, 
    ],
  });

  const teamMap = {};

  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const team = parseTagValue(g.Keys?.[0]); 
      const service = g.Keys?.[1] || "unknown";
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      const usage = parseFloat(g.Metrics?.UsageQuantity?.Amount || 0);
      const unit = g.Metrics?.UsageQuantity?.Unit || "";

      if (cost <= 0) return; 

      if (!teamMap[team]) {
        teamMap[team] = { team, totalCost: 0, services: {} };
      }
      teamMap[team].totalCost += cost;

      if (!teamMap[team].services[service]) {
        teamMap[team].services[service] = {
          service,
          cost: 0,
          usageQty: 0,
          unit,
        };
      }
      teamMap[team].services[service].cost += cost;
      teamMap[team].services[service].usageQty += usage;
    });
  });

  return Object.values(teamMap)
    .map((t) => ({
      team: t.team,
      cost: +t.totalCost.toFixed(6),
      services: Object.values(t.services)
        .map((s) => ({
          service: s.service,
          cost: +s.cost.toFixed(6),
          usageQty: +s.usageQty.toFixed(4),
          unit: s.unit,
        }))
        .sort((a, b) => b.cost - a.cost),
    }))
    .sort((a, b) => b.cost - a.cost);
};

export const getMonthComparison = async (accessKey, secretKey) => {
  const now = new Date();

  // This month's first day (UTC midnight)
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // Last month's first day
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const thisMonthStartStr = fmt(thisMonthStart); // "YYYY-MM-01"

  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(lastMonthStart), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
  });

  const periods = response.ResultsByTime || [];
  const lastMonth = { services: {}, total: 0 };
  const thisMonth = { services: {}, total: 0 };

  periods.forEach((p) => {
    // Identify period by its start date — NOT by array index
    const periodStart = p.TimePeriod?.Start || "";
    // If period starts on or after the 1st of the current month → this month
    const target = periodStart >= thisMonthStartStr ? thisMonth : lastMonth;

    p.Groups?.forEach((g) => {
      const svc = g.Keys?.[0] || "unknown";
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      if (cost > 0) {
        target.services[svc] = (target.services[svc] || 0) + cost;
        target.total += cost;
      }
    });
  });

  const allServices = new Set([
    ...Object.keys(lastMonth.services),
    ...Object.keys(thisMonth.services),
  ]);

  const byService = [];
  allServices.forEach((svc) => {
    const last = lastMonth.services[svc] || 0;
    const curr = thisMonth.services[svc] || 0;
    const delta = curr - last;
    byService.push({
      service: svc,
      lastMonthCost: +last.toFixed(6),
      thisMonthCost: +curr.toFixed(6),
      delta: +delta.toFixed(6),
      changePercent: last > 0 ? +((delta / last) * 100).toFixed(1) : null,
      trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    });
  });

  return {
    lastMonthTotal: +lastMonth.total.toFixed(6),
    thisMonthTotal: +thisMonth.total.toFixed(6),
    delta: +(thisMonth.total - lastMonth.total).toFixed(6),
    changePercent:
      lastMonth.total > 0
        ? +(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100).toFixed(1)
        : null,
    byService: byService.sort((a, b) => b.thisMonthCost - a.thisMonthCost),
  };
};



