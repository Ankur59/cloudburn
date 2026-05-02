import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageWithResourcesCommand,
} from "@aws-sdk/client-cost-explorer";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

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

const ceQueryWithResources = async (client, params) => {
  let hasNext = true;
  let nextToken = undefined;
  let aggregatedResponse = null;

  while (hasNext) {
    const commandParams = { ...params, NextPageToken: nextToken };
    const res = await client.send(
      new GetCostAndUsageWithResourcesCommand(commandParams),
    );

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
//
// ⚠️  RECORD_TYPE filter = ["Usage", "Tax", "Fee"] is CRITICAL for accounts
//    with promotional credits (e.g. AWS Activate / Free Tier).
//    Without it, CE returns Credit line-items with NEGATIVE AmortizedCost that
//    net the usage cost to ~$0, hiding the actual resource spend.
//    By filtering to Usage only, we see the TRUE resource consumption cost
//    (e.g. $5.45) regardless of whether credits cover the bill.

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
    // Exclude Credit / Refund record types — show actual usage cost, not after-credit net
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

// ── Monthly cost: last 12 months, grouped by SERVICE ─────────────────────────
// Shows month-over-month trend per service.
// Credit/Refund rows excluded so values show actual usage cost.

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
// Credit rows excluded — shows actual usage cost per region.

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

// ── Cost by usage type: last 30 days ─────────────────────────────────────────
// Most granular cost line item — e.g. "USW2-BoxUsage:t3.micro".
// Credit rows excluded — shows actual usage cost per usage type.

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

// ── Cost by operation: last 30 days ──────────────────────────────────────────
// Shows specific AWS API operations costing money per service.
// e.g. "RunInstances", "PutObject", "CreateDBInstance"
// Credit rows excluded — shows actual usage cost per operation.

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

// ── Cost by Team tag: last 30 days ─────────────────────────────────────────────
// Groups by Team tag + SERVICE dimension so we get a per-service cost breakdown
// inside each team. Resources must be tagged with a "Team" key.

export const getCostByTeam = async (accessKey, secretKey) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost", "UsageQuantity"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [
      { Type: "TAG", Key: "Team" }, // e.g. "Team$backend"
      { Type: "DIMENSION", Key: "SERVICE" }, // e.g. "Amazon EC2"
    ],
  });

  // Build a map: teamName → { team, totalCost, services: { serviceName → {...} } }
  const teamMap = {};

  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const team = parseTagValue(g.Keys?.[0]); // strip "Team$" prefix
      const service = g.Keys?.[1] || "unknown";
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      const usage = parseFloat(g.Metrics?.UsageQuantity?.Amount || 0);
      const unit = g.Metrics?.UsageQuantity?.Unit || "";

      if (cost <= 0) return; // skip credits / zero rows

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

  // Convert to sorted array
  return Object.values(teamMap)
    .map((t) => ({
      team: t.team,
      cost: +t.totalCost.toFixed(6),
      // Top services sorted by cost descending
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

// ── EC2 instances per team: last 30 days ─────────────────────────────────────
// Strategy:
//   1. Query Cost Explorer with RESOURCE_ID dimension → actual instance IDs
//      (e.g. "i-0abc123def456789"). Requires resource-level data to be enabled
//      in AWS Billing settings (Billing → Cost Management preferences).
//   2. Call EC2 DescribeInstances to enrich each instance ID with its
//      Name tag, instance type, state, and availability zone.
//   3. Fall back to INSTANCE_TYPE if RESOURCE_ID returns no data.
//
// IAM needed: ce:GetCostAndUsage  + ec2:DescribeInstances

export const getCostByTeamInstances = async (
  accessKey,
  secretKey,
  region = "us-east-1",
) => {
  // ── Step 1: Cost Explorer — Team + RESOURCE_ID ──────────────────────────────
  let ceResponse;
  try {
    ceResponse = await ceQueryWithResources(
      makeCEClient(accessKey, secretKey),
      {
        TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
        Granularity: "MONTHLY",
        Metrics: ["AmortizedCost", "UsageQuantity"],
        Filter: {
          Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
        },
        GroupBy: [
          { Type: "TAG", Key: "Team" }, // e.g. "Team$backend"
          { Type: "DIMENSION", Key: "RESOURCE_ID" }, // actual instance ID e.g. "i-0abc123def"
        ],
      },
    );
  } catch (err) {
    // If account doesn't have "Hourly and Resource Level Data" enabled, or validation fails
    console.warn(
      "⚠️  Resource-level Cost Explorer data not available, falling back to INSTANCE_TYPE:",
      err.message,
    );
    return getCostByTeamInstanceTypes(accessKey, secretKey, region);
  }

  // ── Step 2: Parse CE results — collect resourceId + team + cost ──────────────
  const teamMap = {}; // team → { team, instances: { resourceId → {...} } }
  const resourceIds = new Set();

  ceResponse.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const team = parseTagValue(g.Keys?.[0]);
      const resourceId = g.Keys?.[1] || "";
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      const usageHours = parseFloat(g.Metrics?.UsageQuantity?.Amount || 0);

      // Only keep rows with a real resource ID (skip empty / NoResourceId)
      if (cost <= 0 || !resourceId || resourceId === "NoResourceId") return;

      if (!teamMap[team]) teamMap[team] = { team, instances: {} };
      if (!teamMap[team].instances[resourceId]) {
        teamMap[team].instances[resourceId] = {
          resourceId,
          cost: 0,
          usageHours: 0,
          // EC2 metadata — filled in Step 3
          instanceName: resourceId, // default = ID until we resolve the Name tag
          instanceType: "unknown",
          state: "unknown",
          az: "unknown",
        };
        resourceIds.add(resourceId);
      }
      teamMap[team].instances[resourceId].cost += cost;
      teamMap[team].instances[resourceId].usageHours += usageHours;
    });
  });

  // ── Step 3: EC2 DescribeInstances — get Name tag + metadata ─────────────────
  // Only run if we found at least one resource ID from Cost Explorer.
  if (resourceIds.size > 0) {
    try {
      const ec2 = new EC2Client({
        region,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });

      // DescribeInstances accepts up to 200 IDs per call
      const idChunks = [];
      const idArr = [...resourceIds];
      for (let i = 0; i < idArr.length; i += 200) {
        idChunks.push(idArr.slice(i, i + 200));
      }

      // Build a lookup map: instanceId → { name, type, state, az }
      const ec2Info = {};
      for (const chunk of idChunks) {
        const res = await ec2.send(
          new DescribeInstancesCommand({ InstanceIds: chunk }),
        );
        res.Reservations?.forEach((r) => {
          r.Instances?.forEach((inst) => {
            const nameTag = inst.Tags?.find((t) => t.Key === "Name");
            ec2Info[inst.InstanceId] = {
              instanceName: nameTag?.Value || inst.InstanceId, // Name tag or fallback to ID
              instanceType: inst.InstanceType || "unknown",
              state: inst.State?.Name || "unknown",
              az: inst.Placement?.AvailabilityZone || "unknown",
            };
          });
        });
      }

      // Merge EC2 metadata into teamMap
      Object.values(teamMap).forEach((t) => {
        Object.values(t.instances).forEach((inst) => {
          const info = ec2Info[inst.resourceId];
          if (info) Object.assign(inst, info);
        });
      });
    } catch (ec2Err) {
      // DescribeInstances failed (e.g. permission denied) — keep resourceId as name
      console.warn(
        "⚠️  getCostByTeamInstances: EC2 DescribeInstances failed:",
        ec2Err.message,
      );
    }
  }

  // ── Step 4: If CE returned no RESOURCE_IDs, fall back to INSTANCE_TYPE ───────
  const hasData = Object.keys(teamMap).length > 0;
  if (!hasData) {
    return getCostByTeamInstanceTypes(accessKey, secretKey);
  }

  // ── Step 5: Serialize and return ─────────────────────────────────────────────
  return Object.values(teamMap).map((t) => ({
    team: t.team,
    instances: Object.values(t.instances)
      .map((inst) => ({
        resourceId: inst.resourceId, // e.g. "i-0abc123def456789"
        instanceName: inst.instanceName, // Name tag or fallback to ID
        instanceType: inst.instanceType, // e.g. "t3.micro"
        state: inst.state, // "running" | "stopped" | "terminated"
        az: inst.az, // e.g. "us-east-1a"
        cost: +inst.cost.toFixed(6),
        usageHours: +inst.usageHours.toFixed(2),
      }))
      .sort((a, b) => b.cost - a.cost),
  }));
};

// ── Fallback: EC2 instance types per team (no RESOURCE_ID) ───────────────────
// Used when resource-level Cost Explorer data is not enabled.
// Returns instance type (e.g. "t3.micro") instead of individual instance IDs.

export const getCostByTeamInstanceTypes = async (
  accessKey,
  secretKey,
  region = "us-east-1",
) => {
  // 1. Get cost grouped by Team and INSTANCE_TYPE
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost", "UsageQuantity"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [
      { Type: "TAG", Key: "Team" }, // e.g. "Team$backend"
      { Type: "DIMENSION", Key: "INSTANCE_TYPE" }, // e.g. "t3.micro"
    ],
  });

  // 2. Fetch all EC2 instances to find their real names, states, and AZs
  const ec2Matches = {}; // Map: teamName -> instanceType -> [ array of instances ]
  try {
    const ec2 = new EC2Client({
      region,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
    const res = await ec2.send(new DescribeInstancesCommand({}));
    res.Reservations?.forEach((r) => {
      r.Instances?.forEach((inst) => {
        const teamTag =
          inst.Tags?.find((t) => t.Key === "Team")?.Value || "unassigned";
        const type = inst.InstanceType;
        if (!ec2Matches[teamTag]) ec2Matches[teamTag] = {};
        if (!ec2Matches[teamTag][type]) ec2Matches[teamTag][type] = [];

        const nameTag = inst.Tags?.find((t) => t.Key === "Name");
        ec2Matches[teamTag][type].push({
          resourceId: inst.InstanceId,
          instanceName: nameTag?.Value || inst.InstanceId,
          instanceType: type,
          state: inst.State?.Name || "unknown",
          az: inst.Placement?.AvailabilityZone || "unknown",
        });
      });
    });
  } catch (err) {
    console.warn("⚠️  Fallback EC2 DescribeInstances failed:", err.message);
  }

  // 3. Merge Cost Explorer data with active EC2 instances
  const teamMap = {};
  response.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const team = parseTagValue(g.Keys?.[0]);
      const instanceType = g.Keys?.[1] || "unknown";
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      const usageHours = parseFloat(g.Metrics?.UsageQuantity?.Amount || 0);

      if (cost <= 0 || !instanceType || instanceType === "NoInstanceType")
        return;
      if (!teamMap[team]) teamMap[team] = { team, instances: [] };

      const activeInstances = ec2Matches[team]?.[instanceType];

      if (activeInstances && activeInstances.length > 0) {
        // Distribute cost/usage across the running/stopped instances we found
        const costPerInst = cost / activeInstances.length;
        const usagePerInst = usageHours / activeInstances.length;

        activeInstances.forEach((inst) => {
          teamMap[team].instances.push({
            ...inst,
            cost: +costPerInst.toFixed(6),
            usageHours: +usagePerInst.toFixed(2),
          });
        });
      } else {
        // No matching active instances found (maybe they were terminated). Add the fallback row.
        teamMap[team].instances.push({
          resourceId: null,
          instanceName: instanceType, // use type as display name since we don't know the ID
          instanceType,
          state: "terminated/unknown",
          az: "unknown",
          cost: +cost.toFixed(6),
          usageHours: +usageHours.toFixed(2),
        });
      }
    });
  });

  return Object.values(teamMap).map((t) => ({
    team: t.team,
    instances: t.instances.sort((a, b) => b.cost - a.cost),
  }));
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
    // Credit rows excluded — thisMonthTotal shows actual usage cost, matching AWS console
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
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
      const team = parseTagValue(group.Keys?.[1]); // "Team$value" → "value"

      // ── Cost metrics ──────────────────────────────────────────────────────
      // AmortizedCost  = spreads RI/Savings-Plan upfront fees over usage hours.
      //                  Matches what the AWS Console shows. PRIMARY display cost.
      const amortizedCost = parseFloat(
        group.Metrics?.AmortizedCost?.Amount || 0,
      );

      // NetAmortizedCost = amortizedCost MINUS credits/discounts.
      //                    We store this but do NOT show it to the user as "total".
      const netAmortizedCost = parseFloat(
        group.Metrics?.NetAmortizedCost?.Amount || 0,
      );

      // UnblendedCost = on-demand rack price (shows $0 for RI-covered resources).
      const unblendedCost = parseFloat(
        group.Metrics?.UnblendedCost?.Amount || 0,
      );

      const usageQty = parseFloat(group.Metrics?.UsageQuantity?.Amount || 0);
      const unit = group.Metrics?.AmortizedCost?.Unit || "USD";

      results.push({
        service,
        team,
        date,
        // ─ Primary cost field used by all aggregation helpers ─────────────
        cost: amortizedCost, // AmortizedCost (display to user)
        amortizedCost, // alias — same as cost
        // ─ Internal-only fields (NOT deducted in UI totals) ───────────────
        netAmortizedCost, // amortized minus credits (internal)
        netCost: netAmortizedCost, // alias used by saveDailyCosts
        unblendedCost, // on-demand only
        // ─ Usage ─────────────────────────────────────────────────────────
        usageQty,
        unit,
      });
    });
  });

  return results;
};

export const getTotalCost = (data) => {
  let grossCost = 0; // sum of all positive AmortizedCost values
  let totalCredit = 0; // sum of all negative values (credits, refunds)
  const serviceMap = {};

  data.forEach(({ service, cost }) => {
    if (cost >= 0) {
      grossCost += cost;
      serviceMap[service] = (serviceMap[service] || 0) + cost;
    } else {
      totalCredit += cost; // keep negative so caller can display as "savings"
    }
  });

  // netCost = what you actually pay after credits (internal reference only)
  const netCost = grossCost + totalCredit;

  let topService = null;
  let topCost = -Infinity;
  for (const svc in serviceMap) {
    if (serviceMap[svc] > topCost) {
      topCost = serviceMap[svc];
      topService = svc;
    }
  }

  return {
    // ── Shown to user ─────────────────────────────────────────────────────
    grossCost: +grossCost.toFixed(6), // AmortizedCost total (PRIMARY — no credit deduction)
    totalCost: +grossCost.toFixed(6), // alias of grossCost — credits are NOT subtracted
    totalCredit: +totalCredit.toFixed(6), // credits / refunds (negative) — shown as "Savings"
    // ── Internal only ────────────────────────────────────────────────────
    netCost: +netCost.toFixed(6), // after-credit total — NOT shown in UI
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
