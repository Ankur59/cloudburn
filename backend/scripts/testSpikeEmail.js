/**
 * Test spike alert email without needing a real CloudWatch spike.
 *
 * Usage:
 *   node scripts/testSpikeEmail.js               # uses first org in DB
 *   node scripts/testSpikeEmail.js --orgId <id>  # specific org
 *
 * What it does:
 *   1. Picks a real org + its first team from DB
 *   2. Inserts a fake "2-3 hours ago" snapshot with LOW value
 *   3. Inserts a fake "now" snapshot with HIGH value (spike)
 *   4. Runs spike detection → triggers the email
 *   5. Saves the spike alert to DB
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __rootDir  = path.resolve(path.dirname(__filename), '..');
const { config } = await import('dotenv');
config({ path: path.join(__rootDir, '.env') });

import mongoose from 'mongoose';
import Organization from '../src/models/organization.model.js';
import Team         from '../src/models/team.model.js';
import User         from '../src/models/user.model.js';
import ResourceSnapshot from '../src/models/resourceSnapshot.model.js';
import SpikeAlert   from '../src/models/spikeAlert.model.js';
import { sendResourceSpikeAlert } from '../src/services/email.service.js';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const orgIdx = args.indexOf('--orgId');
const orgId  = orgIdx !== -1 ? args[orgIdx + 1] : null;

const hr = () => console.log('─'.repeat(60));

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('❌  MONGO_URI not set in .env'); process.exit(1); }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(mongoUri);
  console.log('✅  Connected\n');

  // 1) Pick org
  const org = orgId
    ? await Organization.findById(orgId).lean()
    : await Organization.findOne({}).lean();

  if (!org) { console.error('❌  No org found in DB'); process.exit(1); }
  console.log(`🏢  Org: ${org._id}`);

  // 2) Pick first team
  const team = await Team.findOne({ orgId: org._id }).lean();
  console.log(team
    ? `👥  Team: ${team.name} (teamKey: ${team.teamKey})`
    : '⚠️  No team found — teamId will be null in alert'
  );

  // 3) Define the test resource
  const testResource = {
    orgId:      org._id,
    teamId:     team?._id ?? null,
    resourceId: 'i-0fd5068e1516f8b6d',   // demo instance
    service:    'EC2',
    metricName: 'CPUUtilization',
    region:     org.awsRegion || 'ap-south-1',
  };

  // 4) Insert baseline snapshot (2.5 hours ago, LOW cpu)
  const now         = new Date();
  const baselineTs  = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
  const currentTs   = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago

  const baselineValue = 12.0;
  const currentValue  = 87.5;  // spike: 87.5 / 12 = 7.3×

  // Upsert-style: delete existing test snapshots for this resource first
  await ResourceSnapshot.deleteMany({
    orgId:      org._id,
    resourceId: testResource.resourceId,
    metricName: testResource.metricName,
    timestamp:  { $in: [baselineTs, currentTs] },
  });

  await ResourceSnapshot.insertMany([
    { ...testResource, value: baselineValue, timestamp: baselineTs },
    { ...testResource, value: currentValue,  timestamp: currentTs  },
  ]);

  console.log(`\n📸  Snapshots inserted:`);
  console.log(`    Baseline → CPU ${baselineValue}% @ ${baselineTs.toISOString()}`);
  console.log(`    Current  → CPU ${currentValue}% @ ${currentTs.toISOString()}`);

  // 5) Build the alert document
  const multiplier = +(currentValue / baselineValue).toFixed(2);
  const hoursAgo   = '2.5';

  const alertDoc = {
    orgId:         org._id,
    teamId:        team?._id ?? null,
    resourceId:    testResource.resourceId,
    service:       testResource.service,
    metricName:    testResource.metricName,
    region:        testResource.region,
    previousValue: baselineValue,
    currentValue,
    multiplier,
    message: `EC2 instance ${testResource.resourceId} CPUUtilization increased from ${baselineValue}% to ${currentValue}% in the last ${hoursAgo} hours`,
    alertType: 'SPIKE',
  };

  // 6) Resolve recipients — admin always, team lead if team exists
  const [admin, teamLead] = await Promise.all([
    User.findOne({ orgId: org._id, role: 'Admin' }, 'email name').lean(),
    team ? User.findOne({ orgId: org._id, teamId: team._id, role: 'TeamLead' }, 'email name').lean() : null,
  ]);

  const recipients = [];
  if (admin)   recipients.push({ email: admin.email,   name: admin.name });
  if (teamLead && teamLead.email !== admin?.email)
               recipients.push({ email: teamLead.email, name: teamLead.name });

  hr();
  console.log(`\n📧  Recipients:`);
  if (!recipients.length) {
    console.log('    ⚠️  No users found in DB — email skipped, alert saved to DB only');
  } else {
    recipients.forEach((r) => console.log(`    • ${r.name} <${r.email}>`));
  }

  // 7) Send email
  if (recipients.length) {
    try {
      await sendResourceSpikeAlert({
        recipients,
        service:       alertDoc.service,
        resourceId:    alertDoc.resourceId,
        metricName:    alertDoc.metricName,
        region:        alertDoc.region,
        teamId:        team?._id?.toString() ?? null,
        teamName:      team?.name ?? null,
        previousValue: alertDoc.previousValue,
        currentValue:  alertDoc.currentValue,
        multiplier:    alertDoc.multiplier,
        detectedAt:    now,
      });
      console.log(`\n✅  Spike alert email sent!`);
    } catch (err) {
      console.error(`\n❌  Email failed: ${err.message}`);
    }
  }

  // 8) Save alert to DB
  const saved = await SpikeAlert.create(alertDoc);
  hr();
  console.log(`\n💾  Alert saved to DB: ${saved._id}`);
  console.log(`    ${alertDoc.message}`);
  console.log(`    Multiplier: ${multiplier}×\n`);
};

run()
  .catch((err) => { console.error('\n💥  Test failed:', err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
