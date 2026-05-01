import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from './async.middleware.js';

/**
 * protect(...roles)
 *
 * Usage:
 *   protect()              — any authenticated user (JWT verified, email verified)
 *   protect('Admin')       — Admin only
 *   protect('Admin', 'TeamLead') — Admin or TeamLead
 *
 * Role is read from the JWT payload (no extra DB call needed for role check).
 * A DB lookup is still done to ensure the user hasn't been deleted.
 */
export const protect = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) Extract Bearer token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify signature & expiry — decoded contains { id, role, orgId }
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);

    // 3) Role check (only when roles are specified)
    if (roles.length > 0 && !roles.includes(decoded.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${decoded.role}.`,
          403
        )
      );
    }

    // 4) Verify user still exists in DB
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 5) Require verified email
    if (!currentUser.isEmailVerified) {
      return next(new AppError('Please verify your email before accessing this resource.', 403));
    }

    // Attach full user + token claims to req
    req.user      = currentUser;
    req.tokenRole = decoded.role;   // from JWT (source of truth for role checks)
    req.tokenOrgId = decoded.orgId; // from JWT (avoids an extra org query)
    next();
  });
