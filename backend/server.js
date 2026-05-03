import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/config.js';

import Chat from './src/models/chat.model.js';

const startServer = async () => {
  await connectDB();
  
  // Drop the conflicting index
  try {
    await Chat.collection.dropIndex("shareSlug_1");
    console.log("✅ shareSlug_1 index dropped successfully.");
  } catch (err) {
    if (err.code === 27) {
      console.log("✅ shareSlug_1 index already removed.");
    } else {
      console.error("⚠️ Could not drop shareSlug_1 index:", err.message);
    }
  }

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


// Based on the provided AWS Cost Explorer data, the cost for Cost Explorer is $4.26 this month. However, there is no information available about the cost spike for one day. 
// 
// To investigate a potential cost spike, I would recommend using the AWS Cost Explorer's \"GetCostAndUsage\" API to retrieve detailed usage and cost data for the specific service (Cost Explorer) over a specific time period. This would allow us to identify any unusual or unexpected usage patterns that may have contributed to a cost spike.
// 
// Additionally, you can also use the \"GetReservationUtilization\" API to check the utilization of any reserved instances for the Cost Explorer service, which may have contributed to the cost spike.
// 
// However, without more detailed information about the cost spike, it's difficult to provide a specific answer. If you can provide more context or details about the cost spike, I would be happy to help investigate further.