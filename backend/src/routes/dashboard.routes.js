import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getDashboardData, getReportsData } from "../controllers/dashboard.controller.js";
import {
  getInsights,
  applyInsight,
  dismissInsight,
  refreshInsights,
} from "../controllers/insights.controller.js";

const router = express.Router();

router.use(protect()); // Apply auth protection to all dashboard routes

router.get("/", getDashboardData);
router.get("/reports", getReportsData);

// ── AI Insights ────────────────────────────────────────────────────────────────
router.get("/insights",                         getInsights);     // read from cache
router.post("/insights/refresh",                refreshInsights); // force regen via Groq
router.patch("/insights/:insightId/apply",      applyInsight);    // mark applied in DB
router.delete("/insights/:insightId",           dismissInsight);  // remove from DB

export default router;
