import express from 'express';

import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import teamRoutes from './routes/team.routes.js';


import { config } from './config/config.js';
import { applyMiddlewares } from './loaders/middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

import awsConfigRoutes from './routes/awsConfig.routes.js';

const app = express();

applyMiddlewares(app, config)
app.use(express.json());
app.use(morgan('dev'));


/**
 * all api routes here
 */
app.use('/api/aws', awsConfigRoutes);
app.use('/api/auth',  authRoutes);
app.use('/api/teams', teamRoutes);


app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorHandler);

export default app;
