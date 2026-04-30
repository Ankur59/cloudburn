import mongoose from 'mongoose';
import { config } from './config.js';

import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

export const connectDB = async () => {
  const conn = await mongoose.connect(config.MONGO_URI);
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
};
