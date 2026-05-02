import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(protect()); // Apply auth protection to all dashboard routes

router.get("/", getDashboardData);

export default router;
