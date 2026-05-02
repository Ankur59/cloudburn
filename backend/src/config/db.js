import mongoose from 'mongoose';
import { config } from './config.js';

export const connectDB = async () => {
  const conn = await mongoose.connect(config.MONGO_URI);
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
};
