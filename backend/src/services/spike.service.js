import SpikeAlert from "../models/spikeAlert.model.js";
import DailyCost from "../models/dailyCost.model.js";
import { getRecentCosts } from "./cost.service.js";
import { generateSpikeExplanation } from "./ai.service.js";

// ── detectSpikesForOrg ────────────────────────────────────────────────────────
// Detects spikes for a SINGLE org.
// 1. Fetches last 2 days of cost data for that org from MongoDB.
// 2. Groups cost per (date, service).
// 3. For each service where today / yesterday >= 2x, generates an AI explanation,
//    upserts a SpikeAlert (scoped to orgId), and returns the spike objects.

const detectSpikesForOrg = async (orgId) => {
  const records = await getRecentCosts(orgId, 2);

  if (records.length === 0) return [];

  const dates = [...new Set(records.map((r) => r.date))].sort((a, b) =>
    b.localeCompare(a),
  );

  if (dates.length < 2) return [];

  const [todayStr, yesterdayStr] = dates;

  const todayCosts = {};
  const yesterdayCosts = {};

  records.forEach(({ date, service, grossCost }) => {
    if (date === todayStr)
      todayCosts[service] = (todayCosts[service] || 0) + grossCost;
    if (date === yesterdayStr)
      yesterdayCosts[service] = (yesterdayCosts[service] || 0) + grossCost;
  });

  const spikes = [];

  for (const [service, currentCost] of Object.entries(todayCosts)) {
    const previousCost = yesterdayCosts[service] || 0;

    if (previousCost <= 0.000001) continue;

    const multiplier = currentCost / previousCost;

    if (multiplier >= 2) {
      console.log(
        `🚨 [${orgId}] Spike: ${service} — ${multiplier.toFixed(2)}x ($${previousCost.toFixed(6)} → $${currentCost.toFixed(6)})`,
      );

      const aiExplanation = await generateSpikeExplanation({
        service,
        previousCost,
        currentCost,
        multiplier,
        date: todayStr,
      });

      // Upsert SpikeAlert scoped to this org
      const alert = await SpikeAlert.findOneAndUpdate(
        { orgId, date: todayStr, service, alertType: 'SPIKE' },
        {
          $set: {
            previousCost: +previousCost.toFixed(8),
            currentCost: +currentCost.toFixed(8),
            multiplier: +multiplier.toFixed(4),
            aiExplanation,
          },
          $setOnInsert: { orgId, isRead: false, alertType: 'SPIKE' },
        },
        { upsert: true, returnDocument: "after" },
      );

      spikes.push({
        orgId,
        id: alert._id,
        date: todayStr,
        service,
        previousCost: +previousCost.toFixed(6),
        currentCost: +currentCost.toFixed(6),
        multiplier: +multiplier.toFixed(2),
        aiExplanation,
        isRead: alert.isRead,
        createdAt: alert.createdAt,
      });
    }
  }

  return spikes;
};

// ── detectSpikes ───────────────────────────────────────────────────────────────
// Called by the hourly cron job.
// Iterates over ALL distinct orgIds in DailyCost and runs spike detection
// for each one independently. Returns a flat array of all spikes found.

export const detectSpikes = async () => {
  console.log(
    `⏰ [${new Date().toISOString()}] Running spike detection for all orgs...`,
  );

  const orgIds = await DailyCost.distinct("orgId");

  if (orgIds.length === 0) {
    console.log("🔍 Spike detection: no orgs with cost data yet.");
    return [];
  }

  const results = await Promise.all(
    orgIds.map((orgId) => detectSpikesForOrg(orgId)),
  );
  const allSpikes = results.flat();

  console.log(
    `🔍 Spike detection complete: ${allSpikes.length} spike(s) across ${orgIds.length} org(s).`,
  );
  return allSpikes;
};
