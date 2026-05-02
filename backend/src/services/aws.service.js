import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";

// ── AWS Cost Explorer is a GLOBAL service — its API endpoint is exclusively
//    available at ce.us-east-1.amazonaws.com. Passing any other region to the
//    CostExplorerClient will cause a connection error. This is an AWS constraint,
//    not a choice. The user's saved region is only used for STS/EC2/RDS etc.
const CE_REGION = "us-east-1";

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeCEClient = (accessKey, secretKey) =>
  new CostExplorerClient({
    region: CE_REGION,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

const fmt = (date) => date.toISOString().split("T")[0];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d;
};

const today = () => new Date();

const ceQuery = async (client, params) => {
  let hasNext = true;
  let nextToken = undefined;
  let aggregatedResponse = null;

  while (hasNext) {
    const commandParams = { ...params, NextPageToken: nextToken };
    const res = await client.send(new GetCostAndUsageCommand(commandParams));

    if (!aggregatedResponse) {
      aggregatedResponse = {
        GroupDefinitions: res.GroupDefinitions,
        DimensionValueAttributes: res.DimensionValueAttributes,
        ResultsByTime: res.ResultsByTime || [],
      };
    } else if (res.ResultsByTime) {
      res.ResultsByTime.forEach((period) => {
        const existing = aggregatedResponse.ResultsByTime.find(
          (p) =>
            p.TimePeriod?.Start === period.TimePeriod?.Start &&
            p.TimePeriod?.End === period.TimePeriod?.End,
        );
        if (existing) {
          if (period.Groups) {
            existing.Groups = (existing.Groups || []).concat(period.Groups);
          }
        } else {
          aggregatedResponse.ResultsByTime.push(period);
        }
      });
    }

    if (res.NextPageToken) {
      nextToken = res.NextPageToken;
    } else {
      hasNext = false;
    }
  }
  return aggregatedResponse;
};

// AWS tag format is "tagKey$tagValue" — extract the value portion
const parseTagValue = (raw) => {
  if (raw && raw.includes("$")) {
    const val = raw.split("$")[1];
    if (val && val.trim()) return val.trim();
  }
  return "unassigned";
};

// ── Verify Credentials (STS) ──────────────────────────────────────────────────

export const verifyAwsCredentials = async (accessKey, secretKey, region) => {
  try {
    const client = new STSClient({
      region,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
    const response = await client.send(new GetCallerIdentityCommand({}));
    return {
      isValid: true,
      accountId: response.Account,
      arn: response.Arn,
      userId: response.UserId,
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

// ── Daily cost: last 30 days, grouped by SERVICE + Team tag ───────────────────
// This is the core query — used by /cost and /billing endpoints.

export const getAwsCost = (accessKey, secretKey) =>
  ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "DAILY",
    // AmortizedCost spreads Reserved Instance / Savings Plan upfront fees
    // across usage hours — this matches what the AWS Cost Explorer console shows.
    // UnblendedCost alone will show $0 for RI-covered instances.
    Metrics: [
      "UnblendedCost",
      "AmortizedCost",
      "NetAmortizedCost",
      "UsageQuantity",
    ],
    GroupBy: [
      { Type: "DIMENSION", Key: "SERVICE" },
      { Type: "TAG", Key: "Name" },
    ],
  });

// ── Monthly cost: last 12 months, grouped by SERVICE ─────────────────────────
// Shows month-over-month trend per service.

export const getMonthlyCostByService = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(monthsAgo(12)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
  });

  const rows = [];
  response.ResultsByTime?.forEach((period) => {
    const month = period.TimePeriod.Start.slice(0, 7); // "YYYY-MM"
    period.Groups?.forEach((g) => {
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      if (cost > 0)
        rows.push({ month, service: g.Keys?.[0] || "unknown", cost });
    });
  });
  return rows;
};

// ── Cost by AWS region: last 30 days ─────────────────────────────────────────
// Identifies which region is driving the most spend.

export const getCostByRegion = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
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

// ── Cost by usage type: last 30 days ─────────────────────────────────────────
// Most granular cost line item — e.g. "USW2-BoxUsage:t3.micro".

export const getCostByUsageType = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["UnblendedCost", "AmortizedCost", "UsageQuantity"],
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

// ── Cost by operation: last 30 days ──────────────────────────────────────────
// Shows specific AWS API operations costing money per service.
// e.g. "RunInstances", "PutObject", "CreateDBInstance"

export const getCostByOperation = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
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

// ── Cost by record type: last 30 days ────────────────────────────────────────
// Splits spend into: Usage | Tax | Credit | Refund | Fee

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

// ── Daily spend trend: last 90 days (no groupby) ─────────────────────────────
// Pure total per day — ideal for a spend trend line chart.

export const getDailySpendTrend = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(90)), End: fmt(today()) },
    Granularity: "DAILY",
    Metrics: ["AmortizedCost"],
    // Exclude Credits and Refunds so the trend shows actual usage spend,
    // not net-after-credits (which would show $0 for credit-covered accounts).
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

// ── Cost by Team tag: last 30 days ────────────────────────────────────────────
// Requires resources to be tagged with a "Team" key.

export const getCostByTeam = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    GroupBy: [{ Type: "TAG", Key: "Team" }],
  });

  const rows = [];
  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const team = parseTagValue(g.Keys?.[0]);
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      if (cost > 0) rows.push({ team, cost: +cost.toFixed(6) });
    });
  });
  return rows.sort((a, b) => b.cost - a.cost);
};

// ── This month vs last month comparison, per service ─────────────────────────
// Returns delta + % change for each service.

export const getMonthComparison = async (accessKey, secretKey) => {
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(lastMonthStart), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
  });

  const periods = response.ResultsByTime || [];
  const lastMonth = { services: {}, total: 0 };
  const thisMonth = { services: {}, total: 0 };

  periods.forEach((p, idx) => {
    const target = idx === 0 ? lastMonth : thisMonth;
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
        ? +(
          ((thisMonth.total - lastMonth.total) / lastMonth.total) *
          100
        ).toFixed(1)
        : null,
    byService: byService.sort((a, b) => b.thisMonthCost - a.thisMonthCost),
  };
};

// ── Transform / aggregate helpers ────────────────────────────────────────────
// Primary cost field = amortizedCost (matches the AWS Console view).
// unblendedCost is kept for reference but is $0 for RI/SP-covered resources.
// credits = negative unblendedCost entries (refunds, data-transfer credits, etc.)

export const transformAwsCost = (data) => {
  const results = [];
  data.ResultsByTime?.forEach((day) => {

    const date = day.TimePeriod.Start;

    day.Groups?.forEach((group) => {

      const service = group.Keys?.[0] || "unknown";

      const team = parseTagValue(group.Keys?.[1]);
      // AmortizedCost = true allocated cost (includes RI/SP amortization)

      const amortizedCost = parseFloat(
        group.Metrics?.AmortizedCost?.Amount || 0,
      );

      // NetAmortizedCost = amortizedCost minus discounts/credits
      const netAmortizedCost = parseFloat(
        group.Metrics?.NetAmortizedCost?.Amount || 0,
      );

      // UnblendedCost = on-demand price (0 for RI-covered resources)
      const unblendedCost = parseFloat(
        group.Metrics?.UnblendedCost?.Amount || 0,
      );

      const usageQty = parseFloat(group.Metrics?.UsageQuantity?.Amount || 0);
      const unit = group.Metrics?.AmortizedCost?.Unit || "USD";
      // cost = primary field used by all aggregation helpers
      results.push({
        service,
        team,
        amortizedCost: amortizedCost, // primary — matches AWS Console
        netAmortizedCost: netAmortizedCost, // after credits/discounts
        unblendedCost, // on-demand only (0 for RI resources)
        usageQty,
        unit,
        date,
      });
    });
  });
  return results;
};

export const getTotalCost = (data) => {
  let grossCost = 0; // sum of all positive amortized costs
  let totalCredit = 0; // sum of all negative values (refunds, credits)
  const serviceMap = {};

  data.forEach(({ service, cost }) => {
    if (cost >= 0) {
      grossCost += cost;
      serviceMap[service] = (serviceMap[service] || 0) + cost;
    } else {
      totalCredit += cost; // negative value
    }
  });

  const netTotal = grossCost + totalCredit;

  let topService = null;
  let topCost = -Infinity;
  for (const svc in serviceMap) {
    if (serviceMap[svc] > topCost) {
      topCost = serviceMap[svc];
      topService = svc;
    }
  }

  return {
    grossCost: +grossCost.toFixed(6), // total before credits
    totalCredit: +totalCredit.toFixed(6), // credits/refunds (negative)
    totalCost: +netTotal.toFixed(6), // net = grossCost + credits
    topService: { name: topService, cost: +topCost.toFixed(6) },
  };
};

export const aggregateByDate = (data) => {
  const map = {};
  data.forEach(({ date, cost }) => {
    if (!map[date]) map[date] = { gross: 0, credits: 0 };
    if (cost > 0) map[date].gross += cost;
    else map[date].credits += cost; // negative rakhna
  });
  return Object.entries(map)
    .map(([date, { gross, credits }]) => ({
      date,
      grossCost: +gross.toFixed(6),
      credits: +credits.toFixed(6),
      netCost: +(gross + credits).toFixed(6),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const aggregateByService = (data) => {
  const map = {};
  data.forEach(({ service, cost }) => {
    if (cost > 0) map[service] = (map[service] || 0) + cost;
  });
  return Object.entries(map)
    .map(([service, cost]) => ({ service, cost: +cost.toFixed(6) }))
    .sort((a, b) => b.cost - a.cost);
};

export const aggregateByTeam = (data) => {
  const map = {};
  data.forEach(({ team, cost }) => {
    if (cost > 0) map[team] = (map[team] || 0) + cost;
  });
  return Object.entries(map)
    .map(([team, cost]) => ({ team, cost: +cost.toFixed(6) }))
    .sort((a, b) => b.cost - a.cost);
};
