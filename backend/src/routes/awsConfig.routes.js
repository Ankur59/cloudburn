import { Router } from "express";
import { connectAWS, getCost } from "../controllers/awsConfig.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/connect", protect(), connectAWS);
router.get("/cost", protect(), getCost);

export default router;
