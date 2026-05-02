import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/config.js';
import { initCronJobs } from './src/jobs/costSync.job.js';
import { initRAG } from './src/loaders/rag.loader.js';
import { initSpikeJob } from './src/jobs/spike.job.js';

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

  // Start scheduled jobs only after DB is connected
  initCronJobs();
});

// ── Startup sequence ──────────────────────────────────────────────────────────
const startServer = async () => {
  // 1) MongoDB connection
  await connectDB();

  // 2) Build RAG vector store from persisted DailyCost records
  //    (no-op on first run when collection is still empty)
  await initRAG();

  // 3) Start hourly spike-detection cron (needs io to emit events)
  initSpikeJob(io);

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

