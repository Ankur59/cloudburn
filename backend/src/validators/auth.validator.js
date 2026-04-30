import { body, validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

// Runs after validation rules — forwards a 422 AppError if any field fails
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 422, errors.array()));
  }
  next();
};

// ── Register ──────────────────────────────────────────────────────────────────
export const registerValidator = [
  body('orgName')
    .trim().notEmpty().withMessage('Organization name is required')
    .isLength({ max: 100 }).withMessage('Organization name cannot exceed 100 characters'),

  body('name')
    .trim().notEmpty().withMessage('Your full name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),

  validate,
];

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginValidator = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Provide a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ── Verify Email ──────────────────────────────────────────────────────────────
export const verifyEmailValidator = [
  body('token').trim().notEmpty().withMessage('Verification token is required'),
  validate,
];
