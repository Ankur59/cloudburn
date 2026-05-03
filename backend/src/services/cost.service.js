import DailyCost from "../models/dailyCost.model.js";

// ── saveDailyCosts ─────────────────────────────────────────────────────────────
// Accepts the output of transformAwsCost() + the orgId of the calling user.
// Upserts one document per (orgId, date, service) pair using bulkWrite.
//
// orgId is REQUIRED — ensures each org's data is fully isolated.

export const saveDailyCosts = async (records, orgId) => {
  if (!records || records.length === 0) return;
  if (!orgId) {
    console.error("⚠️  saveDailyCosts: orgId is missing — data not saved");
    return;
  }

  // Aggregate: sum grossCost, netCost, credits per (date, service)
  const map = new Map();

  records.forEach(({ date, service, cost, netCost }) => {
    const key = `${date}::${service}`;
    if (!map.has(key)) {
      map.set(key, { date, service, grossCost: 0, netCost: 0, credits: 0 });
    }
    const entry = map.get(key);
    if (cost >= 0) {
      entry.grossCost += cost;
    } else {
      entry.credits += cost; // negative — keep it negative
    }
    entry.netCost += netCost;
  });

  const ops = Array.from(map.values()).map(
    ({ date, service, grossCost, netCost, credits }) => ({
      updateOne: {
        filter: { orgId, date, service }, // ← orgId in filter
        update: {
          $set: {
            grossCost: +grossCost.toFixed(8),
            netCost: +netCost.toFixed(8),
            credits: +credits.toFixed(8),
            fetchedAt: new Date(),
          },
          $setOnInsert: { orgId }, // ← orgId set on insert
        },
        upsert: true,
      },
    }),
  );

  const result = await DailyCost.bulkWrite(ops, { ordered: false });
  console.log(
    `💾 [${orgId}] DailyCost upserted: ${result.upsertedCount} new, ${result.modifiedCount} updated`,
  );
  return result;
};

// ── getRecentCosts ─────────────────────────────────────────────────────────────
// Returns DailyCost documents for the last N days for a SPECIFIC org only.
// Used by spike detection and RAG indexing.

export const getRecentCosts = async (orgId, days = 30) => {
  if (!orgId) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0]; // "YYYY-MM-DD"

  return DailyCost.find({ orgId, date: { $gte: cutoffStr } })
    .sort({ date: -1, service: 1 })
    .lean();
};
