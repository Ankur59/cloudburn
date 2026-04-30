import asyncHandler from '../middlewares/async.middleware.js';
import { sendSuccess } from '../utils/responseHelper.js';
import * as authService from '../services/auth.service.js';

// ── POST /api/auth/register 
export const register = asyncHandler(async (req, res) => {
  const { orgName, name, email, password } = req.body;

  const { org, user, emailVerificationToken } =
    await authService.registerAdmin({ orgName, name, email, password });

  // TODO: in production, send emailVerificationToken via email service
  // and remove it from the response body.
  return sendSuccess(res, 201, 'Registered successfully. Please verify your email to activate your account.');
});

// ── POST /api/auth/verify-email 
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await authService.verifyEmail(token);

  return sendSuccess(res, 200, 'Email verified successfully. You can now log in.', {
    user: { id: user._id, name: user.name, email: user.email, isEmailVerified: true },
  });
});

// ── POST /api/auth/login 
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken } = await authService.loginUser({ email, password }, res);

  return sendSuccess(res, 200, 'Logged in successfully.', {
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, orgId: user.orgId },
  });
});

// ── POST /api/auth/refresh 
export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  const { accessToken, user } = await authService.refreshAccessToken(rawRefreshToken, res);

  return sendSuccess(res, 200, 'Access token refreshed.', {
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// ── POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user._id, res);
  return sendSuccess(res, 200, 'Logged out successfully.');
});

// ── GET /api/auth/me 
export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'User profile fetched.', { user: req.user });
});
