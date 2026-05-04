import asyncHandler from '../middlewares/async.middleware.js';
import { sendSuccess } from '../utils/responseHelper.js';
import * as authService from '../services/auth.service.js';
import passport from 'passport';
import { config } from '../config/config.js';
import Organization from '../models/organization.model.js';
import AppError from '../utils/AppError.js';

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

  const org = await Organization.findById(user.orgId);
  
  return sendSuccess(res, 200, 'Logged in successfully.', {
    accessToken,
    user: { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      orgId: user.orgId,
      hasSetOrgName: !!user.hasSetOrgName,
      isCloudConnected: !!(org && org.awsConnectedAt),
      orgName: org ? org.name : null
    },
  });
});

// ── POST /api/auth/refresh 
export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  const { accessToken, user } = await authService.refreshAccessToken(rawRefreshToken, res);

  const org = await Organization.findById(user.orgId);

  return sendSuccess(res, 200, 'Access token refreshed.', {
    accessToken,
    user: { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      hasSetOrgName: !!user.hasSetOrgName,
      isCloudConnected: !!(org && org.awsConnectedAt),
      orgName: org ? org.name : null
    },
  });
});

// ── POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user._id, res);
  return sendSuccess(res, 200, 'Logged out successfully.');
});

// ── GET /api/auth/me 
export const getMe = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.user.orgId);
  const user = req.user.toObject();
  // Explicitly set derived fields — these drive frontend routing in ProtectedRoute
  user.isCloudConnected = !!(org && org.awsConnectedAt);
  user.hasSetOrgName    = !!req.user.hasSetOrgName;
  user.orgName          = org ? org.name : null;
  user.avatar           = req.user.avatar || null;
  return sendSuccess(res, 200, 'User profile fetched.', { user });
});

// ── PUT /api/auth/set-org
export const setOrgName = asyncHandler(async (req, res) => {
  const { orgName } = req.body;
  if (!orgName) throw new AppError('Organization name is required', 400);

  const user = req.user;
  user.hasSetOrgName = true;
  await user.save();

  await Organization.findByIdAndUpdate(user.orgId, { name: orgName });

  return sendSuccess(res, 200, 'Organization name updated successfully.');
});

// ── GET /api/auth/google
export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

// ── GET /api/auth/google/callback
export const googleCallback = [
  passport.authenticate('google', { session: false, failureRedirect: `${config.CLIENT_URL}/login?error=GoogleAuthFailed` }),
  asyncHandler(async (req, res) => {
    const { user, accessToken } = await authService.handleGoogleLogin(req.user, res);
    
    // Redirect to frontend with the access token so frontend can set it in Redux state.
    // Login page will catch this accessToken.
    res.redirect(`${config.CLIENT_URL}/login?accessToken=${accessToken}`);
  })
];
