import { Router } from "express";
import { connectAWS } from "../controllers/awsConfig.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/connect", protect(), connectAWS);

export default router;
