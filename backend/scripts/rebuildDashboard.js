import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import BillingSnapshot from "../src/models/billingSnapshot.model.js";
import { buildDashboardData } from "../src/services/dashboard.service.js";

async function run() {
  console.log("Connecting to Mongo...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");
  const snapshot = await BillingSnapshot.findOne({});
  if (!snapshot) {
    console.log("No snapshot found");
    process.exit(0);
  }

  const newDashboardData = buildDashboardData({
    summary: {
      grossCost: snapshot.grossCost,
      totalCost: snapshot.totalCost,
      savings: snapshot.credits * -1,
      totalCredit: snapshot.credits,
      topService: { name: snapshot.topService, cost: snapshot.topServiceCost }
    },
    monthComparison: snapshot.monthComparison,
    serviceBreakdown: snapshot.serviceBreakdown,
    dailyBreakdown: snapshot.dailyBreakdown,
    dailyTrend90: snapshot.dailyTrend90 || [],
    byTeam: snapshot.byTeam
  });

  snapshot.dashboardData = newDashboardData;
  await snapshot.save();
  console.log("Dashboard data rebuilt and saved!");
  process.exit(0);
}
run().catch(console.error);
