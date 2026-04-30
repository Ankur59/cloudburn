import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 422, errors.array()));
  }
  next();
};

// ── Send Invite ───────────────────────────────────────────────────────────────
export const sendInviteValidator = [
  body('email')
    .trim().notEmpty().withMessage('Invitee email is required')
    .isEmail().withMessage('Provide a valid email address')
    .normalizeEmail(),

  body('teamId')
    .notEmpty().withMessage('Team ID is required')
    .isMongoId().withMessage('Invalid team ID'),

  validate,
];

// ── Accept Invite ─────────────────────────────────────────────────────────────
export const acceptInviteValidator = [
  body('token')
    .trim().notEmpty().withMessage('Invite token is required'),

  body('name')
    .trim().notEmpty().withMessage('Your full name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),

  validate,
];

// ── Revoke Invite ─────────────────────────────────────────────────────────────
export const invitationIdValidator = [
  param('id').isMongoId().withMessage('Invalid invitation ID'),
  validate,
];
