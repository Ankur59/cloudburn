import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import CostRecord from '../models/costRecord.model.js';
import Team from '../models/team.model.js';
import Organization from '../models/organization.model.js';
import { decrypt } from '../utils/encryption.js';

// Cost Explorer is a global service — always us-east-1
const CE_REGION = 'us-east-1';

// ── Service name normalizer ───────────────────────────────────────────────────
const SERVICE_MAP = {
  'Amazon Elastic Compute Cloud - Compute': 'EC2',
  'Amazon Simple Storage Service':          'S3',
  'Amazon Relational Database Service':     'RDS',
  'Amazon CloudFront':                      'CloudFront',
  'AWS Lambda':                             'Lambda',
  'Amazon DynamoDB':                        'DynamoDB',
  'Amazon Route 53':                        'Route53',
  'Amazon Elastic Container Service':       'ECS',
  'Amazon Elastic Kubernetes Service':      'EKS',
  'Amazon ElastiCache':                     'ElastiCache',
  'Amazon SageMaker':                       'SageMaker',
  'AWS Key Management Service':             'KMS',
  'Amazon CloudWatch':                      'CloudWatch',
  'Amazon Simple Queue Service':            'SQS',
  'Amazon Simple Notification Service':     'SNS',
  'Amazon Cognito':                         'Cognito',
  'Amazon API Gateway':                     'API Gateway',
  'Amazon Elastic Block Store':             'EBS',
  'Amazon Virtual Private Cloud':           'VPC',
  'Amazon Glacier':                         'Glacier',
  'Amazon Athena':                          'Athena',
  'Amazon Redshift':                        'Redshift',
  'Amazon OpenSearch Service':              'OpenSearch',
  'AWS Secrets Manager':                    'Secrets Manager',
  'AWS CloudTrail':                         'CloudTrail',
  'Amazon Kinesis':                         'Kinesis',
  'AWS Support':                            'Support',
  'AWS Config':                             'Config',
  'Amazon Elastic Load Balancing':          'ELB',
};

const normalizeService = (raw) => SERVICE_MAP[raw] || raw;

// ── Parse team tag value from "team$team-key" format ─────────────────────────
// AWS returns tag values as "tagKey$tagValue"
const parseTagTeamKey = (raw) => {
  if (!raw) return null;
  const dollarIdx = raw.indexOf('$');
  if (dollarIdx === -1) return null;
  const val = raw.slice(dollarIdx + 1).trim();
  return val || null;
};

// ── Date helpers ──────────────────────────────────────────────────────────────
const fmt      = (d) => d.toISOString().split('T')[0];
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

// ── Number sanitiser ─────────────────────────────────────────────────────────
// AWS returns scientific notation for tiny amounts (e.g. -8.518e-7).
// We round to `places` decimal places and clamp anything whose absolute
// value is below 0.000001 to exactly 0 — those are floating-point noise.
const sanitizeAmount = (raw, places = 8) => {
  const n = parseFloat(raw || 0);
  if (!isFinite(n) || Math.abs(n) < 0.000001) return 0;
  return +n.toFixed(places);
};

// ── Dedicated CE query for the cron (UnblendedCost + team tag) ───────────────
const fetchCostForSync = (accessKey, secretKey) => {
  const client = new CostExplorerClient({
    region: CE_REGION,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  return client.send(new GetCostAndUsageCommand({
    TimePeriod: { Start: fmt(daysAgo(30)), End: fmt(new Date()) },
    Granularity: 'DAILY',
    Metrics: ['UnblendedCost', 'UsageQuantity'],
    GroupBy: [
      { Type: 'DIMENSION', Key: 'SERVICE' },
      { Type: 'TAG',       Key: 'team' },   // must match the tag key on AWS resources
    ],
  }));
};

// ── Build team lookup map  (teamKey → { teamId, teamName }) ──────────────────
// Called once per org — zero extra DB calls during record transformation.
const buildTeamMap = (teams) => {
  const map = {};
  teams.forEach((t) => { map[t.teamKey] = { teamId: t._id, teamName: t.name }; });
  return map;
};

// ── Core sync for a single org ────────────────────────────────────────────────
export const syncOrgCosts = async (org) => {
  const orgId = org._id;

  // 1) Decrypt credentials — skip org if not connected
  if (!org.awsAccessKey || !org.awsSecretKey || !org.awsRegion) return;
  const accessKey = decrypt(org.awsAccessKey);
  const secretKey = decrypt(org.awsSecretKey);

  // 2) Fetch all teams once → build in-memory map (no per-record DB calls)
  const teams  = await Team.find({ orgId }).lean();
  const teamMap = buildTeamMap(teams);

  // 3) Pull cost data from AWS
  const rawData = await fetchCostForSync(accessKey, secretKey);

  // 4) Group transformed records by date
  //    Map: date → CostRecord[]
  const byDate = {};

  for (const period of (rawData.ResultsByTime || [])) {
    const date = period.TimePeriod.Start; // "YYYY-MM-DD"

    if (!byDate[date]) byDate[date] = [];

    for (const group of (period.Groups || [])) {
      const rawService = group.Keys?.[0] || 'unknown';
      const tagRaw     = group.Keys?.[1];              // "team$team-key" or null
      const teamKey    = parseTagTeamKey(tagRaw);      // "team-key" or null

      const teamInfo   = teamKey ? (teamMap[teamKey] ?? null) : null;

      const cost        = sanitizeAmount(group.Metrics?.UnblendedCost?.Amount,  8); // e.g. 0.00123456
      const usageAmount = sanitizeAmount(group.Metrics?.UsageQuantity?.Amount,  4); // e.g. 24.0500
      const unit        = group.Metrics?.UnblendedCost?.Unit || 'USD';

      byDate[date].push({
        orgId,
        teamId:   teamInfo?.teamId   ?? null,
        teamName: teamInfo?.teamName ?? (teamKey || null),
        service:    normalizeService(rawService),
        rawService,
        provider: 'aws',
        region:   null,      // extend later if REGION is added to GroupBy
        cost,
        usageAmount,
        unit,
        date,
      });
    }
  }

  // 5) Upsert strategy:
  //    - teamId set   → deduplicate on (orgId, service, date, teamId)
  //    - teamId null  → deduplicate on (orgId, service, date, teamName)
  //    Same resource + team + date always updates the same document — never duplicates.
  let totalRecords = 0;
  let totalCost    = 0;
  const dates      = Object.keys(byDate).sort();

  for (const records of Object.values(byDate)) {
    if (!records.length) continue;

    const ops = records.map((record) => {
      const filter = record.teamId
        ? { orgId: record.orgId, service: record.service, date: record.date, teamId: record.teamId }
        : { orgId: record.orgId, service: record.service, date: record.date, teamId: null, teamName: record.teamName };

      return { updateOne: { filter, update: { $set: record }, upsert: true } };
    });

    const result  = await CostRecord.bulkWrite(ops, { ordered: false });
    totalRecords += result.upsertedCount + result.modifiedCount;
    totalCost    += records.reduce((sum, r) => sum + r.cost, 0);
  }

  return {
    orgId,
    datesProcessed:  dates.length,
    dateRange:       dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null,
    recordsInserted: totalRecords,
    totalCost:       +totalCost.toFixed(6),
  };
};

// ── Batch runner — called by the cron job ────────────────────────────────────
// Loads all connected orgs and processes them in batches of BATCH_SIZE.
const BATCH_SIZE = 5;

export const runFullSync = async () => {
  const orgs = await Organization
    .find({ awsAccessKey: { $exists: true, $ne: null } })
    .select('+awsAccessKey +awsSecretKey')
    .lean();

  console.log(`🔄 Cost sync started — ${orgs.length} org(s)`);

  const startedAt = new Date();
  const results   = [];

  for (let i = 0; i < orgs.length; i += BATCH_SIZE) {
    const batch = orgs.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map((org) =>
        syncOrgCosts(org)
          .then((stats) => {
            console.log(`  ✅ org ${org._id} — ${stats.recordsInserted} records | ${stats.datesProcessed} days`);
            return { status: 'ok', ...stats };
          })
          .catch((err) => {
            console.error(`  ❌ org ${org._id} — ${err.message}`);
            return { status: 'error', orgId: org._id, error: err.message };
          })
      )
    );

    results.push(...batchResults);
  }

  const finishedAt     = new Date();
  const durationMs     = finishedAt - startedAt;
  const totalRecords   = results.reduce((s, r) => s + (r.recordsInserted || 0), 0);
  const totalCost      = results.reduce((s, r) => s + (r.totalCost      || 0), 0);
  const successCount   = results.filter((r) => r.status === 'ok').length;
  const failCount      = results.filter((r) => r.status === 'error').length;

  console.log(`✅ Cost sync done — ${successCount} ok, ${failCount} failed, ${totalRecords} records in ${durationMs}ms`);

  return {
    summary: {
      orgsTotal:     orgs.length,
      orgsSucceeded: successCount,
      orgsFailed:    failCount,
      totalRecords,
      totalCost:     +totalCost.toFixed(6),
      durationMs,
      startedAt,
      finishedAt,
    },
    orgs: results,
  };
};
