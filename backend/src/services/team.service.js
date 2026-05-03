import Team from '../models/team.model.js';
import AppError from '../utils/AppError.js';

// ── Team Key Generator ────────────────────────────────────────────────────────
// Rules: lowercase → spaces to hyphens → strip non-alphanumeric (keep hyphens)
//        → collapse repeated hyphens → trim leading/trailing hyphens
// Example: "Frontend Team (v2)!" → "frontend-team-v2"
export const generateTeamKey = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '')   // remove everything except a-z, 0-9, hyphen
    .replace(/-+/g, '-')          // collapse consecutive hyphens
    .replace(/^-|-$/g, '');       // strip leading/trailing hyphens

// ── Create Team ───────────────────────────────────────────────────────────────
export const createTeam = async ({ orgId, name, budgetLimit, alertThreshold, notes }) => {
  const teamKey = generateTeamKey(name);
  const team = await Team.create({ orgId, name, teamKey, budgetLimit, alertThreshold, notes });
  return team;
};

// ── List Teams (org-scoped, paginated) ────────────────────────────────────────
export const getTeams = async ({ orgId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  // countDocuments + find run in parallel — single round-trip worth of latency
  const [total, teams] = await Promise.all([
    Team.countDocuments({ orgId }),
    Team.find({ orgId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(), // plain JS objects — faster for read-only use
  ]);

  return {
    teams,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

// ── Get Single Team ───────────────────────────────────────────────────────────
export const getTeamById = async ({ teamId, orgId }) => {
  const team = await Team.findOne({ _id: teamId, orgId }).lean();
  if (!team) throw new AppError('Team not found.', 404);
  return team;
};

// ── Update Team ───────────────────────────────────────────────────────────────
export const updateTeam = async ({ teamId, orgId, updates }) => {
  // Keep teamKey in sync if the name is being renamed
  if (updates.name) {
    updates.teamKey = generateTeamKey(updates.name);
  }

  const team = await Team.findOneAndUpdate(
    { _id: teamId, orgId },           // scoped to org — prevents cross-org tampering
    { $set: updates },
    { new: true, runValidators: true } // return updated doc, run schema validators
  );
  if (!team) throw new AppError('Team not found.', 404);
  return team;
};

// ── Delete Team ───────────────────────────────────────────────────────────────
export const deleteTeam = async ({ teamId, orgId }) => {
  const team = await Team.findOneAndDelete({ _id: teamId, orgId });
  if (!team) throw new AppError('Team not found.', 404);
};


