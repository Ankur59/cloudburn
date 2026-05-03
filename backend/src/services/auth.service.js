import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { config } from "../config/config.js";
import { sendVerificationEmail } from "./email.service.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateAccessToken = ({ id, role, orgId }) =>
  jwt.sign({ id, role, orgId }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });

// Crypto token (for email verification / invite links)
const generateCryptoToken = () => crypto.randomBytes(32).toString("hex");

// One-way hash stored in DB — original token goes to the user
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const setRefreshCookie = (res, rawRefreshToken) => {
  res.cookie("refreshToken", rawRefreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};

export const clearRefreshCookie = (res) =>
  res.clearCookie("refreshToken", { path: "/" });

// ── Register Admin ────────────────────────────────────────────────────────────
// Single call that:
//   1. Creates the Organization  (name + admin email — no password stored on org)
//   2. Creates the Admin User    (linked to the org via orgId)
//   3. Returns a raw email-verification token
//      → in production, email this to the user and remove it from the response.

export const registerAdmin = async ({ orgName, name, email, password }) => {
  // Email must be unique for users
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  // 1) Create the Organization (data store — no auth fields)
  const org = await Organization.create({ name: orgName, email });

  // 2) Hash password and generate email-verification token
  const passwordHash = await bcrypt.hash(password, 12);
  const rawToken = generateCryptoToken();

  // 3) Create the Admin User, linked to the org
  const user = await User.create({
    orgId: org._id,
    name,
    email,
    passwordHash,
    role: "Admin",
    inviteToken: null,
    inviteAccepted: true,
    isEmailVerified: false,
    emailVerificationToken: hashToken(rawToken),
    emailVerificationExpiry: new Date(
      Date.now() + config.EMAIL_VERIFICATION_TTL_MS,
    ),
  });

  // 4) Send verification email (fire-and-forget — don't block the response)
  sendVerificationEmail({
    to: email,
    name,
    emailVerificationToken: rawToken,
  }).catch((err) =>
    console.error("📧 Verification email failed:", err.message),
  );

  return { org, user };
};

// ── Verify Email ──────────────────────────────────────────────────────────────

export const verifyEmail = async (rawToken) => {
  const hashed = hashToken(rawToken);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Token is invalid or has expired.", 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiry = null;
  await user.save();

  return user;
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password }, res) => {
  const user = await User.findOne({ email }).select(
    "+passwordHash +refreshToken",
  );

  // Generic message to prevent email enumeration
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      "Your email is not verified. Please check your inbox for the verification link.",
      403,
    );
  }

  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
    orgId: user.orgId,
  });
  const rawRefresh = generateRefreshToken(user._id);

  // Store hashed refresh token — prevents DB leak from being useful
  user.refreshToken = hashToken(rawRefresh);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, rawRefresh);

  return { user, accessToken };
};

// ── Google Login ─────────────────────────────────────────────────────────────

export const handleGoogleLogin = async (user, res) => {
  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
    orgId: user.orgId,
  });
  const rawRefresh = generateRefreshToken(user._id);

  user.refreshToken = hashToken(rawRefresh);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, rawRefresh);

  return { user, accessToken };
};

// ── Refresh Access Token ──────────────────────────────────────────────────────

export const refreshAccessToken = async (rawRefreshToken, res) => {
  if (!rawRefreshToken) {
    throw new AppError("No refresh token. Please log in.", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(rawRefreshToken, config.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError(
      "Invalid or expired refresh token. Please log in again.",
      401,
    );
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== hashToken(rawRefreshToken)) {
    // Possible token reuse — invalidate stored token
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
    clearRefreshCookie(res);
    throw new AppError("Refresh token mismatch. Please log in again.", 401);
  }

  const newAccessToken = generateAccessToken({
    id: user._id,
    role: user.role,
    orgId: user.orgId,
  });

  // Rotate refresh token on every use (refresh token rotation)
  const newRawRefresh = generateRefreshToken(user._id);
  user.refreshToken = hashToken(newRawRefresh);
  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, newRawRefresh);

  return { accessToken: newAccessToken, user };
};

// ── Logout ────────────────────────────────────────────────────────────────────

export const logoutUser = async (userId, res) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
  clearRefreshCookie(res);
};
