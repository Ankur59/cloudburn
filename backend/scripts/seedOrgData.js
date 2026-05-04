import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __rootDir  = path.resolve(path.dirname(__filename), '..');
const { config } = await import('dotenv');
config({ path: path.join(__rootDir, '.env') });

import ResourceSnapshot from '../src/models/resourceSnapshot.model.js';
import ZombieResource from '../src/models/zombieResource.model.js';
import SpikeAlert from '../src/models/spikeAlert.model.js';

const ORG_ID = '69f7953eeaa270960dc230c2';

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('❌ MONGO_URI not set'); process.exit(1); }

  console.log(`🔌 Connecting to MongoDB for Org ${ORG_ID}…`);
  await mongoose.connect(mongoUri);

  // 1. Clear existing data for this org to ensure clean relation seeding
  console.log('🧹 Cleaning old data for this org…');
  await ResourceSnapshot.deleteMany({ orgId: ORG_ID });
  await ZombieResource.deleteMany({ orgId: ORG_ID });
  await SpikeAlert.deleteMany({ orgId: ORG_ID, alertType: 'ZOMBIE' });

  const now = new Date();
  const resources = [
    { id: 'i-0a1b2c3d4e5f6g7h8', service: 'EC2', metric: 'CPUUtilization', region: 'us-east-1' },
    { id: 'db-prod-replica-01', service: 'RDS', metric: 'DatabaseConnections', region: 'us-east-1' },
    { id: 'cloudburn-logs-bucket', service: 'S3', metric: 'NumberOfRequests', region: 'global' }
  ];

  console.log('🌱 Seeding snapshots and zombies…');

  for (const res of resources) {
    // Create snapshots for the last 7 days (hourly)
    const snapshots = [];
    for (let i = 0; i < 7 * 24; i++) {
      const ts = new Date(now);
      ts.setHours(now.getHours() - i);
      
      snapshots.push({
        orgId: ORG_ID,
        resourceId: res.id,
        service: res.service,
        region: res.region,
        metricName: res.metric,
        value: Math.random() * 2, // Very low usage (0-2)
        unit: res.service === 'EC2' ? 'Percent' : 'Count',
        timestamp: ts
      });
    }
    await ResourceSnapshot.insertMany(snapshots);

    // Create the ZombieResource record
    const idleDays = 7;
    const aiSummary = `This ${res.service} resource (${res.id}) has shown near-zero ${res.metric} for over a week. It was likely a temporary test asset that was never decommissioned. Terminating it is safe and will reduce operational overhead.`;

    await ZombieResource.create({
      orgId: ORG_ID,
      resourceId: res.id,
      service: res.service,
      region: res.region,
      provider: 'aws',
      status: 'zombie',
      detectedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      lastSeenAt: now,
      idleDays,
      metrics: { [res.metric]: 0.5 },
      aiSummary,
      estimatedMonthlyCost: res.service === 'EC2' ? 45.00 : res.service === 'RDS' ? 82.00 : 5.00
    });

    // Create the SpikeAlert (Zombie Alert)
    await SpikeAlert.create({
      orgId: ORG_ID,
      alertType: 'ZOMBIE',
      service: res.service,
      resourceId: res.id,
      metricName: res.metric,
      currentValue: 0.5,
      previousValue: 85, // Showing a drop from 85% to 0.5%
      message: `${res.service} resource ${res.id} detected as idle for ${idleDays} days.`,
      aiExplanation: aiSummary,
      isRead: false
    });
  }

  console.log('✅ Seeding complete for Org 69f7953eeaa270960dc230c2');
  console.log('   - ResourceSnapshots: ' + (resources.length * 7 * 24));
  console.log('   - ZombieResources: ' + resources.length);
  console.log('   - SpikeAlerts (Zombie): ' + resources.length);

  await mongoose.disconnect();
};

run().catch(err => {
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
