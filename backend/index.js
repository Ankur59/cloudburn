import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/config.js';
import { initRAG } from './src/loaders/rag.loader.js';
import { initSpikeJob } from './src/jobs/spike.job.js';
import { initCronJobs } from './src/jobs/costSync.job.js';
import { initResourceSyncJob } from './src/jobs/resourceSync.job.js';
import { initInsightRefreshJob } from './src/jobs/insightRefresh.job.js';
import { initZombieJob } from './src/jobs/zombie.job.js';
import { initTeamBudgetJob } from './src/jobs/teamBudget.job.js';

// ── HTTP server (wraps express — required for socket.io) ──────────────────────
const httpServer = createServer(app);

// ── Socket.io (attaches to the SAME HTTP server — no second port) ─────────────
const io = new Server(httpServer, {
  cors: {
    origin: config.CLIENT_URL,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ── Startup sequence ──────────────────────────────────────────────────────────
const startServer = async () => {
  // 1) MongoDB connection
  await connectDB();

  // 2) Build RAG vector store from persisted DailyCost records
  //    (no-op on first run when collection is still empty)
  await initRAG();

  // 3) Start cron jobs (needs io for WebSocket events)
  initSpikeJob(io);
  initCronJobs();               // daily cost sync  (00:01 UTC)
  initResourceSyncJob();        // resource monitor (every 5 min)
  initInsightRefreshJob();      // AI insights refresh (daily at midnight)
  initZombieJob(io);            // zombie detection  (every 12h)
  initTeamBudgetJob(io);        // team budget monitoring (daily at 1am)
  
  // 4) Begin accepting HTTP + WebSocket connections
  httpServer.listen(config.PORT, () => {
    console.log(
      `🚀 CloudBurn API running on port ${config.PORT} [${config.NODE_ENV}]`,
    );
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

