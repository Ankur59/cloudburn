import { Router } from "express";
import {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  getMe,
  setOrgName,
  googleLogin,
  googleCallback
} from "../controllers/auth.controller.js";
import {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
} from "../validators/auth.validator.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", registerValidator, register);
router.post("/verify-email", verifyEmailValidator, verifyEmail);
router.post("/login", loginValidator, login);
router.post("/refresh", refresh); // reads cookie

// Google OAuth routes
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

// Protected routes (valid JWT required)
router.post("/logout", protect(), logout);
router.get("/me", protect(), getMe);
router.put("/set-org", protect(), setOrgName);

export default router;
