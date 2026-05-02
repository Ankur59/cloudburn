import asyncHandler from '../middlewares/async.middleware.js';
import { sendSuccess } from '../utils/responseHelper.js';
import { runFullSync, syncOrgCosts } from '../services/costSync.service.js';
import Organization from '../models/organization.model.js';
import CostRecord from '../models/costRecord.model.js';
import AppError from '../utils/AppError.js';

// ── POST /api/admin/sync ──────────────────────────────────────────────────────
// Manually trigger the cost sync (same logic the cron runs).
// Optional body: { orgId } — if provided, syncs that org only.
// Returns a full stats report of what was written to the DB.

export const triggerSync = asyncHandler(async (req, res) => {
  const { orgId } = req.body;

  let result;

  if (orgId) {
    // Single-org mode — useful for debugging a specific org
    const org = await Organization
      .findById(orgId)
      .select('+awsAccessKey +awsSecretKey')
      .lean();

    if (!org) throw new AppError('Organization not found.', 404);
    if (!org.awsAccessKey) throw new AppError('AWS credentials not configured for this org.', 400);

    const stats = await syncOrgCosts(org);
    result = { summary: { orgsTotal: 1, orgsSucceeded: 1, orgsFailed: 0, ...stats }, orgs: [{ status: 'ok', ...stats }] };
  } else {
    // Full sync — all connected orgs (same as cron)
    result = await runFullSync();
  }

  return sendSuccess(res, 200, 'Cost sync completed.', result);
});

// ── GET /api/admin/sync/preview ───────────────────────────────────────────────
// Shows what's currently in costRecords for a given org without running a sync.
// Query params: orgId (required), date (optional, YYYY-MM-DD)

export const previewCostRecords = asyncHandler(async (req, res) => {
  const { orgId, date } = req.query;
  if (!orgId) throw new AppError('orgId query param is required.', 400);

  const filter = { orgId };
  if (date) filter.date = date;

  const [records, total, summary] = await Promise.all([
    CostRecord.find(filter).sort({ date: -1, cost: -1 }).limit(200).lean(),
    CostRecord.countDocuments(filter),
    CostRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id:          null,
          totalCost:    { $sum: '$cost' },
          totalRecords: { $sum: 1 },
          dateMin:      { $min: '$date' },
          dateMax:      { $max: '$date' },
          services:     { $addToSet: '$service' },
          teams:        { $addToSet: '$teamName' },
        },
      },
    ]),
  ]);

  return sendSuccess(res, 200, 'Cost records fetched.', {
    total,
    summary: summary[0] ?? null,
    records,
  });
});
