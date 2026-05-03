const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/services/aws.service.js');
const rawContent = fs.readFileSync(srcPath, 'utf8');

// The lines are exactly what we got from view_file.
const lines = rawContent.split('\n');

const utilsContent = `
export const fmt = (date) => date.toISOString().split("T")[0];

export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d;
};

export const today = () => new Date();

// AWS tag format is "tagKey$tagValue" — extract the value portion
export const parseTagValue = (raw) => {
  if (raw && raw.includes("$")) {
    const val = raw.split("$")[1];
    if (val && val.trim()) return val.trim();
  }
  return "unassigned";
};
`;

const clientContent = `
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageWithResourcesCommand,
} from "@aws-sdk/client-cost-explorer";

const CE_REGION = "us-east-1";

export const makeCEClient = (accessKey, secretKey) =>
  new CostExplorerClient({
    region: CE_REGION,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

export const ceQuery = async (client, params) => {
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

export const ceQueryWithResources = async (client, params) => {
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
`;

const ec2Content = `
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { makeCEClient, ceQueryWithResources, ceQuery } from "./client.service.js";
import { fmt, daysAgo, today, parseTagValue } from "./utils.service.js";

// ── EC2 instances per team: last 30 days ─────────────────────────────────────
export const getCostByTeamInstances = async (
  accessKey,
  secretKey,
  region = "us-east-1",
) => {
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
          { Type: "TAG", Key: "Team" },
          { Type: "DIMENSION", Key: "RESOURCE_ID" },
        ],
      },
    );
  } catch (err) {
    console.warn(
      "⚠️  Resource-level Cost Explorer data not available, falling back to INSTANCE_TYPE:",
      err.message,
    );
    return getCostByTeamInstanceTypes(accessKey, secretKey, region);
  }

  const teamMap = {}; 
  const resourceIds = new Set();

  ceResponse.ResultsByTime?.forEach((period) => {
    period.Groups?.forEach((g) => {
      const team = parseTagValue(g.Keys?.[0]);
      const resourceId = g.Keys?.[1] || "";
      const cost = parseFloat(g.Metrics?.AmortizedCost?.Amount || 0);
      const usageHours = parseFloat(g.Metrics?.UsageQuantity?.Amount || 0);

      if (cost <= 0 || !resourceId || resourceId === "NoResourceId") return;

      if (!teamMap[team]) teamMap[team] = { team, instances: {} };
      if (!teamMap[team].instances[resourceId]) {
        teamMap[team].instances[resourceId] = {
          resourceId,
          cost: 0,
          usageHours: 0,
          instanceName: resourceId, 
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

  if (resourceIds.size > 0) {
    try {
      const ec2 = new EC2Client({
        region,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });

      const idChunks = [];
      const idArr = [...resourceIds];
      for (let i = 0; i < idArr.length; i += 200) {
        idChunks.push(idArr.slice(i, i + 200));
      }

      const ec2Info = {};
      for (const chunk of idChunks) {
        const res = await ec2.send(
          new DescribeInstancesCommand({ InstanceIds: chunk }),
        );
        res.Reservations?.forEach((r) => {
          r.Instances?.forEach((inst) => {
            const nameTag = inst.Tags?.find((t) => t.Key === "Name");
            ec2Info[inst.InstanceId] = {
              instanceName: nameTag?.Value || inst.InstanceId, 
              instanceType: inst.InstanceType || "unknown",
              state: inst.State?.Name || "unknown",
              az: inst.Placement?.AvailabilityZone || "unknown",
            };
          });
        });
      }

      Object.values(teamMap).forEach((t) => {
        Object.values(t.instances).forEach((inst) => {
          const info = ec2Info[inst.resourceId];
          if (info) Object.assign(inst, info);
        });
      });
    } catch (ec2Err) {
      console.warn(
        "⚠️  getCostByTeamInstances: EC2 DescribeInstances failed:",
        ec2Err.message,
      );
    }
  }

  const hasData = Object.keys(teamMap).length > 0;
  if (!hasData) {
    return getCostByTeamInstanceTypes(accessKey, secretKey);
  }

  return Object.values(teamMap).map((t) => ({
    team: t.team,
    instances: Object.values(t.instances)
      .map((inst) => ({
        resourceId: inst.resourceId, 
        instanceName: inst.instanceName, 
        instanceType: inst.instanceType, 
        state: inst.state, 
        az: inst.az, 
        cost: +inst.cost.toFixed(6),
        usageHours: +inst.usageHours.toFixed(2),
      }))
      .sort((a, b) => b.cost - a.cost),
  }));
};

export const getCostByTeamInstanceTypes = async (
  accessKey,
  secretKey,
  region = "us-east-1",
) => {
  const response = await ceQuery(makeCEClient(accessKey, secretKey), {
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(today()) },
    Granularity: "MONTHLY",
    Metrics: ["AmortizedCost", "UsageQuantity"],
    Filter: {
      Dimensions: { Key: "RECORD_TYPE", Values: ["Usage", "Tax", "Fee"] },
    },
    GroupBy: [
      { Type: "TAG", Key: "Team" }, 
      { Type: "DIMENSION", Key: "INSTANCE_TYPE" }, 
    ],
  });

  const ec2Matches = {}; 
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
        teamMap[team].instances.push({
          resourceId: null,
          instanceName: instanceType, 
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
`;

const costContent = `
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
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

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
`;

const transformContent = `
import { parseTagValue } from "./utils.service.js";

export const transformAwsCost = (data) => {
  const results = [];

  data.ResultsByTime?.forEach((day) => {
    const date = day.TimePeriod.Start;

    day.Groups?.forEach((group) => {
      const service = group.Keys?.[0] || "unknown";
      const team = parseTagValue(group.Keys?.[1]); 

      const amortizedCost = parseFloat(
        group.Metrics?.AmortizedCost?.Amount || 0,
      );
      const netAmortizedCost = parseFloat(
        group.Metrics?.NetAmortizedCost?.Amount || 0,
      );
      const unblendedCost = parseFloat(
        group.Metrics?.UnblendedCost?.Amount || 0,
      );

      const usageQty = parseFloat(group.Metrics?.UsageQuantity?.Amount || 0);
      const unit = group.Metrics?.AmortizedCost?.Unit || "USD";

      results.push({
        service,
        team,
        date,
        cost: amortizedCost, 
        amortizedCost, 
        netAmortizedCost, 
        netCost: netAmortizedCost, 
        unblendedCost, 
        usageQty,
        unit,
      });
    });
  });

  return results;
};

export const getTotalCost = (data) => {
  let grossCost = 0; 
  let totalCredit = 0; 
  const serviceMap = {};

  data.forEach(({ service, cost }) => {
    if (cost >= 0) {
      grossCost += cost;
      serviceMap[service] = (serviceMap[service] || 0) + cost;
    } else {
      totalCredit += cost; 
    }
  });

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
    grossCost: +grossCost.toFixed(6), 
    totalCost: +grossCost.toFixed(6), 
    totalCredit: +totalCredit.toFixed(6), 
    netCost: +netCost.toFixed(6), 
    topService: { name: topService, cost: +topCost.toFixed(6) },
  };
};

export const aggregateByDate = (data) => {
  const map = {};
  data.forEach(({ date, cost }) => {
    if (!map[date]) map[date] = { gross: 0, credits: 0 };
    if (cost > 0) map[date].gross += cost;
    else map[date].credits += cost; 
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
`;

const indexContent = `
export * from "./client.service.js";
export * from "./cost.service.js";
export * from "./ec2.service.js";
export * from "./transform.service.js";
export * from "./utils.service.js";
`;

fs.mkdirSync(path.join(__dirname, '../src/services/aws'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../src/services/aws/utils.service.js'), utilsContent);
fs.writeFileSync(path.join(__dirname, '../src/services/aws/client.service.js'), clientContent);
fs.writeFileSync(path.join(__dirname, '../src/services/aws/ec2.service.js'), ec2Content);
fs.writeFileSync(path.join(__dirname, '../src/services/aws/cost.service.js'), costContent);
fs.writeFileSync(path.join(__dirname, '../src/services/aws/transform.service.js'), transformContent);
fs.writeFileSync(path.join(__dirname, '../src/services/aws.service.js'), indexContent);

console.log('Successfully split aws.service.js into smaller files inside src/services/aws/');
