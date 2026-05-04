import { Router } from "express";
import {
  connectAWS,
  getCloudAccounts,
} from "../controllers/awsConfig.controller.js";
import { getCost, getFullBilling } from "../controllers/awsBilling.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Connection ──────────────────────────────────────────────────────────────
router.post("/connect", protect(), connectAWS);
router.get("/accounts", protect(), getCloudAccounts);

// ── Cost (original, backward compat — daily last 30d by service + team) ─────
router.get("/cost", protect(), getCost);

// ── Full Billing Dashboard (all dimensions, parallel CE queries) ─────────────
router.get("/billing", protect(), getFullBilling);

export default router;
