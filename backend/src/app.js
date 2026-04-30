import express from 'express';
import { config } from './config/config.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import teamRoutes from './routes/team.routes.js';
import invitationRoutes from './routes/invitation.routes.js';

import { applyMiddlewares } from './loaders/middleware.js';

const app = express();

applyMiddlewares(app, config)

app.use('/api/auth',        authRoutes);
app.use('/api/teams',       teamRoutes);
app.use('/api/invitations', invitationRoutes);

app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorHandler);

export default app;
