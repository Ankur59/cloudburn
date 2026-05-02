import express from "express";
import morgan from "morgan";

import authRoutes       from "./routes/auth.routes.js";
import teamRoutes       from "./routes/team.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import awsConfigRoutes  from "./routes/awsConfig.routes.js";
import adminRoutes      from "./routes/admin.routes.js";

import { config }            from "./config/config.js";
import { applyMiddlewares }  from "./loaders/middleware.js";
import { errorHandler }      from "./middlewares/error.middleware.js";

const app = express();

applyMiddlewares(app, config);
app.use(morgan("dev"));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/teams",       teamRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/aws",         awsConfigRoutes);
app.use("/api/admin",       adminRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
