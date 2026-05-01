import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/config.js';

const startServer = async () => {
  await connectDB();
  app.listen(config.PORT, () => {
    console.log(
      `🚀 CloudBurn API running on port ${config.PORT} [${config.NODE_ENV}]`
    );
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
