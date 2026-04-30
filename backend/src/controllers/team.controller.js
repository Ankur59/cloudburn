import asyncHandler from "../middlewares/async.middleware.js";
import { sendSuccess } from "../utils/responseHelper.js";
import * as teamService from "../services/team.service.js";

// ── POST /api/teams ───────────────────────────────────────────────────────────
export const createTeam = asyncHandler(async (req, res) => {
  const { name, budgetLimit, alertThreshold, notes } = req.body;

  // orgId is taken from the verified JWT — never from req.body
  const team = await teamService.createTeam({
    orgId: req.tokenOrgId,
    name,
    budgetLimit,
    alertThreshold,
    notes,
  });

  return sendSuccess(res, 201, "Team created successfully.", { team });
});

// ── GET /api/teams ────────────────────────────────────────────────────────────
export const getTeams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const result = await teamService.getTeams({
    orgId: req.tokenOrgId,
    page,
    limit,
  });

  return sendSuccess(res, 200, "Teams fetched successfully.", result);
});

// ── GET /api/teams/:id ────────────────────────────────────────────────────────
export const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById({
    teamId: req.params.id,
    orgId: req.tokenOrgId,
  });

  return sendSuccess(res, 200, "Team fetched successfully.", { team });
});

// ── PATCH /api/teams/:id ──────────────────────────────────────────────────────
export const updateTeam = asyncHandler(async (req, res) => {
  const { name, budgetLimit, alertThreshold, notes } = req.body;

  // Build update object with only the fields that were sent
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (budgetLimit !== undefined) updates.budgetLimit = budgetLimit;
  if (alertThreshold !== undefined) updates.alertThreshold = alertThreshold;
  if (notes !== undefined) updates.notes = notes;

  const team = await teamService.updateTeam({
    teamId: req.params.id,
    orgId: req.tokenOrgId,
    updates,
  });

  return sendSuccess(res, 200, "Team updated successfully.", { team });
});

// ── DELETE /api/teams/:id ─────────────────────────────────────────────────────
export const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.deleteTeam({
    teamId: req.params.id,
    orgId: req.tokenOrgId,
  });
  return sendSuccess(res, 200, "Team deleted successfully.");
});
