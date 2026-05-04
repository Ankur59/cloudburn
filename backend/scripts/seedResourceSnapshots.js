import mongoose from 'mongoose';
import ResourceSnapshot from '../src/models/resourceSnapshot.model.js';
import { connectDB } from '../src/config/db.js';

const ORG_ID = '69f7953eeaa270960dc230c2';

const seedSnapshots = async () => {
  try {
    await connectDB();
    
    // Clear existing snapshots for this org to avoid duplicates
    await ResourceSnapshot.deleteMany({ orgId: ORG_ID });
    
    const snapshots = [];
    const now = new Date();
    const region = 'us-east-1';

    // ── EC2 Resources ──────────────────────────────────────────────────────────
    const ec2Ids = ['i-0123abc456', 'i-0789def012', 'i-0abc123def', 'i-0987zyx654'];
    ec2Ids.forEach((id, idx) => {
      // Vary CPU between 5% and 95%
      const cpu = idx === 0 ? 92 : idx === 1 ? 45 : idx === 2 ? 12 : 65;
      
      snapshots.push({
        orgId: ORG_ID,
        resourceId: id,
        service: 'EC2',
        metricName: 'CPUUtilization',
        value: cpu,
        region,
        timestamp: now
      });
    });

    // ── RDS Resources ──────────────────────────────────────────────────────────
    const rdsIds = ['db-prod-cluster', 'db-staging-1'];
    rdsIds.forEach((id, idx) => {
      snapshots.push({
        orgId: ORG_ID,
        resourceId: id,
        service: 'RDS',
        metricName: 'CPUUtilization',
        value: idx === 0 ? 78 : 20,
        region,
        timestamp: now
      });
      
      snapshots.push({
        orgId: ORG_ID,
        resourceId: id,
        service: 'RDS',
        metricName: 'DatabaseConnections',
        value: idx === 0 ? 150 : 12,
        region,
        timestamp: now
      });
    });

    // ── S3 Resources ───────────────────────────────────────────────────────────
    const s3Buckets = ['media-assets-prod', 'backup-archives', 'logs-temp'];
    s3Buckets.forEach((id) => {
      snapshots.push({
        orgId: ORG_ID,
        resourceId: id,
        service: 'S3',
        metricName: 'BucketSize',
        value: Math.floor(Math.random() * 5000) + 100, // MB
        region,
        timestamp: now
      });
    });

    await ResourceSnapshot.insertMany(snapshots);
    console.log(`✅ Successfully seeded ${snapshots.length} resource snapshots for org: ${ORG_ID}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedSnapshots();
