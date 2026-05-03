import express from "express";
import morgan from "morgan";
import passport from "passport";

import "./config/passport.js"; // Initialize passport config

import authRoutes       from "./routes/auth.routes.js";
import teamRoutes       from "./routes/team.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import awsConfigRoutes  from "./routes/awsConfig.routes.js";
import adminRoutes      from "./routes/admin.routes.js";
import chatRoutes       from "./routes/chat.routes.js";
import dashboardRoutes  from "./routes/dashboard.routes.js";
import zombieRoutes     from "./routes/zombie.routes.js";
import alertRoutes      from "./routes/alert.routes.js";

import { config }            from "./config/config.js";
import { applyMiddlewares }  from "./loaders/middleware.js";
import { errorHandler }      from "./middlewares/error.middleware.js";

const app = express();

applyMiddlewares(app, config);
app.use(morgan("dev"));
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/teams",       teamRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/aws",         awsConfigRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/chat",        chatRoutes);
app.use("/api/dashboard",   dashboardRoutes);
app.use("/api/zombie",      zombieRoutes);
app.use("/api/alerts",      alertRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
