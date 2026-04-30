import { Router } from 'express';
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/team.controller.js';
import {
  createTeamValidator,
  updateTeamValidator,
  teamIdValidator,
  listTeamsValidator,
} from '../validators/team.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// All team routes are Admin-only
router.use(protect('Admin'));

router.post(  '/',    createTeamValidator,              createTeam);
router.get(   '/',    listTeamsValidator,               getTeams);
router.get(   '/:id', teamIdValidator,                  getTeam);
router.patch( '/:id', teamIdValidator, updateTeamValidator, updateTeam);
router.delete('/:id', teamIdValidator,                  deleteTeam);

export default router;
