import asyncHandler from '../middlewares/async.middleware.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/responseHelper.js';
import {
  generateInsights,
  applyInsightInCache,
  dismissInsightFromCache,
  forceRefreshInsights,
} from '../services/insights.service.js';

// ── GET /api/dashboard/insights ───────────────────────────────────────────────
// Serves from InsightCache (fast — no Groq call when cache is warm).
export const getInsights = asyncHandler(async (req, res) => {
  const orgId = req.user.orgId;
  if (!orgId) throw new AppError('Organisation not identified.', 401);

  const result = await generateInsights(orgId);

  if (!result.fetchedAt && result.insights.length === 0) {
    throw new AppError(
      'No billing data found. Please connect AWS and fetch billing data first.',
      404,
    );
  }

  return sendSuccess(res, 200, 'AI insights fetched successfully', {
    insights:    result.insights,
    fetchedAt:   result.fetchedAt,
    generatedAt: result.generatedAt,
    summary:     result.summary,
  });
});

// ── PATCH /api/dashboard/insights/:insightId/apply ───────────────────────────
// Marks the insight as applied (status: 'applied') in InsightCache MongoDB doc.
export const applyInsight = asyncHandler(async (req, res) => {
  const { insightId } = req.params;
  const orgId = req.user.orgId;
  if (!orgId) throw new AppError('Organisation not identified.', 401);

  const updated = await applyInsightInCache(orgId, insightId);

  return sendSuccess(res, 200, 'Insight marked as applied', { insight: updated });
});

// ── DELETE /api/dashboard/insights/:insightId ─────────────────────────────────
// Removes the insight permanently from InsightCache (dismiss = delete from DB).
export const dismissInsight = asyncHandler(async (req, res) => {
  const { insightId } = req.params;
  const orgId = req.user.orgId;
  if (!orgId) throw new AppError('Organisation not identified.', 401);

  const result = await dismissInsightFromCache(orgId, insightId);

  return sendSuccess(res, 200, 'Insight dismissed successfully', result);
});

// ── POST /api/dashboard/insights/refresh ─────────────────────────────────────
// Force-regenerates insights via Groq (bypasses cache). Called by Run AI Scan.
export const refreshInsights = asyncHandler(async (req, res) => {
  const orgId = req.user.orgId;
  if (!orgId) throw new AppError('Organisation not identified.', 401);

  const result = await forceRefreshInsights(orgId);

  return sendSuccess(res, 200, 'AI insights refreshed successfully', {
    insights:    result.insights,
    fetchedAt:   result.fetchedAt,
    generatedAt: result.generatedAt,
    summary:     result.summary,
  });
});
