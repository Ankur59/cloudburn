import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";

export const verifyAwsCredentials = async (accessKey, secretKey, region) => {
  try {
    const client = new STSClient({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const command = new GetCallerIdentityCommand({});
    const response = await client.send(command);

    return {
      isValid: true,
      accountId: response.Account,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
    };
  }
};

export const getAwsCost = async (accessKey, secretKey, region) => {
  const client = new CostExplorerClient({
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const formatDate = (date) => date.toISOString().split("T")[0];

  const command = new GetCostAndUsageCommand({
    TimePeriod: {
      Start: formatDate(startDate),
      End: formatDate(endDate),
    },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"],
    GroupBy: [
      { Type: "DIMENSION", Key: "SERVICE" },
      { Type: "TAG",Key: "team" },

    ],
  });

  const response = await client.send(command);

  return response;
};

export const transformAwsCost = (data) => {
  const results = [];

  // Helper to safely parse AWS tag value (format: "key$value")
  const parseTag = (raw) => {
    if (raw && raw.includes("$")) {
      const value = raw.split("$")[1];
      if (value && value.trim() !== "") return value.trim();
    }
    return "unassigned";
  };

  data.ResultsByTime.forEach((day) => {
    const date = day.TimePeriod.Start;

    day.Groups.forEach((group) => {
      const service = group.Keys?.[0] || "unknown";
      const team = parseTag(group.Keys?.[1]); // Team tag
      const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || 0);

      results.push({
        service,
        cost,
        date,
        team,
      });
    });
  });

  return results;
};

export const getTotalCost = (data) => {
  let totalCost = 0;
  const serviceMap = {};

  data.forEach((item) => {
    totalCost += item.cost;

    if (!serviceMap[item.service]) {
      serviceMap[item.service] = 0;
    }

    serviceMap[item.service] += item.cost;
  });

  // find max cost service
  let maxService = null;
  let maxCost = -Infinity;

  for (const service in serviceMap) {
    if (serviceMap[service] > maxCost) {
      maxCost = serviceMap[service];
      maxService = service;
    }
  }

  return {
    totalCost,
    topService: {
      name: maxService,
      cost: maxCost,
    },
  };
};

export const aggregateByDate = (data) => {
  const map = {};

  data.forEach((item) => {
    const date = item.date;
    const cost = item.cost;

    if (!map[date]) {
      map[date] = 0;
    }

    map[date] += cost;
  });

  return Object.entries(map).map(([date, cost]) => ({
    date,
    cost: parseFloat(cost.toFixed(5)),
  }));
};

export const aggregateByService = (data) => {
  const map = {};

  data.forEach((item) => {
    const service = item.service;
    const cost = item.cost;

    if (!map[service]) {
      map[service] = 0;
    }

    map[service] += cost;
  });

  return Object.entries(map).map(([service, cost]) => ({
    service,
    cost: parseFloat(cost.toFixed(5)),
  }));
};
