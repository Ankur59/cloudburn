
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
