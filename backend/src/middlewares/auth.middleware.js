import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from './async.middleware.js';

export const protect = asyncHandler(async (req, res, next) => {
  // 1) Extract token from Authorization header
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // 2) Verify signature + expiry
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);

  // 3) Check user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Require verified email for all protected routes
  if (!currentUser.isEmailVerified) {
    return next(new AppError('Please verify your email before accessing this resource.', 403));
  }

  req.user = currentUser;
  next();
});
