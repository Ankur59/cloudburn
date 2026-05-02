import { body, param, query } from 'express-validator';
import AppError from '../utils/AppError.js';
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 422, errors.array()));
  }
  next();
};

// ── Create / Update shared field rules ───────────────────────────────────────
const nameRule = body('name')
  .trim()
  .notEmpty().withMessage('Team name is required')
  .isLength({ max: 100 }).withMessage('Team name cannot exceed 100 characters');

const budgetLimitRule = body('budgetLimit')
  .notEmpty().withMessage('Budget limit is required')
  .isFloat({ min: 0 }).withMessage('Budget limit must be a non-negative number');

const alertThresholdRule = body('alertThreshold')
  .notEmpty().withMessage('Alert threshold is required')
  .isFloat({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100');

const notesRule = body('notes')
  .optional({ nullable: true })
  .trim()
  .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters');

// ── Validators ────────────────────────────────────────────────────────────────
export const createTeamValidator = [
  nameRule, budgetLimitRule, alertThresholdRule, notesRule, validate,
];

// PATCH allows partial updates — all fields optional but validated if present
export const updateTeamValidator = [
  body('name')
    .optional().trim().notEmpty().withMessage('Team name cannot be empty')
    .isLength({ max: 100 }).withMessage('Team name cannot exceed 100 characters'),
  body('budgetLimit')
    .optional().isFloat({ min: 0 }).withMessage('Budget limit must be a non-negative number'),
  body('alertThreshold')
    .optional().isFloat({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100'),
  notesRule,
  validate,
];

export const teamIdValidator = [
  param('id').isMongoId().withMessage('Invalid team ID'),
  validate,
];

// ── List query params ─────────────────────────────────────────────────────────
export const listTeamsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  validate,
];
