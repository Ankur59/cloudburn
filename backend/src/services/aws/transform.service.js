
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
