import asyncHandler from '../middlewares/async.middleware.js';
import { sendSuccess } from '../utils/responseHelper.js';
import AppError from '../utils/AppError.js';
import {
  runZombieScanForOrg,
  listZombiesForOrg,
  updateZombieStatus,
} from '../services/zombie.service.js';

// ── GET /api/zombie ───────────────────────────────────────────────────────────
// List zombie resources for the authenticated user's org.
// Query params: status, page, limit
export const getZombies = asyncHandler(async (req, res) => {
  const orgId = req.tokenOrgId;
  const { status, page = 1, limit = 50 } = req.query;

  const result = await listZombiesForOrg(orgId, {
    status,
    page: Number(page),
    limit: Number(limit),
  });

  return sendSuccess(res, 200, 'Zombie resources fetched.', result);
});

// ── POST /api/zombie/scan ─────────────────────────────────────────────────────
// Trigger an on-demand zombie scan for the authenticated user's org.
// Synchronous — returns results in the same request (scan is fast: 1 agg per service).
export const triggerScan = asyncHandler(async (req, res) => {
  const orgId = req.tokenOrgId;

  const scanResult = await runZombieScanForOrg(orgId);

  // Re-fetch fresh list after scan
  const listResult = await listZombiesForOrg(orgId, { page: 1, limit: 50 });

  return sendSuccess(res, 200, `Scan complete. ${scanResult.found} zombie(s) detected.`, {
    scan: scanResult,
    ...listResult,
    scannedAt: new Date().toISOString(),
  });
});

// ── PATCH /api/zombie/:id ─────────────────────────────────────────────────────
// Update a zombie resource's status (marked / cleaned).
export const patchZombieStatus = asyncHandler(async (req, res) => {
  const orgId = req.tokenOrgId;
  const { id } = req.params;
  const { status } = req.body;

  const ALLOWED = ['marked', 'cleaned', 'zombie'];
  if (!status || !ALLOWED.includes(status)) {
    throw new AppError(`Invalid status. Allowed: ${ALLOWED.join(', ')}`, 400);
  }

  const updated = await updateZombieStatus(id, orgId, status);
  if (!updated) throw new AppError('Zombie resource not found.', 404);

  return sendSuccess(res, 200, 'Status updated.', { resource: updated });
});
