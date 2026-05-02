import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

// ── Client factories ──────────────────────────────────────────────────────────
const creds = (accessKey, secretKey) => ({
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

const makeCW  = (ak, sk, region) => new CloudWatchClient({ region, ...creds(ak, sk) });
const makeEC2 = (ak, sk, region) => new EC2Client({ region, ...creds(ak, sk) });
const makeRDS = (ak, sk, region) => new RDSClient({ region, ...creds(ak, sk) });
// S3 is a global service — region is set but endpoint resolves to us-east-1
const makeS3  = (ak, sk, region) => new S3Client({ region, ...creds(ak, sk) });
const makeDDB = (ak, sk, region) => new DynamoDBClient({ region, ...creds(ak, sk) });

// ── Shared: fetch ONE latest CloudWatch datapoint ─────────────────────────────
// Queries the last `windowMinutes`, sorts desc, returns only [0].
// One datapoint per resource per metric per run — no duplicates possible.
const fetchLatestDatapoint = async (cwClient, { namespace, metricName, dimensions, windowMinutes = 70 }) => {
  const now   = new Date();
  const start = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const res = await cwClient.send(new GetMetricStatisticsCommand({
    Namespace:  namespace,
    MetricName: metricName,
    Dimensions: dimensions,
    StartTime:  start,
    EndTime:    now,
    Period:     3600,           // 1-hour bucket (matches the hourly cron)
    Statistics: ['Average'],
  }));

  const sorted = (res.Datapoints || []).sort(
    (a, b) => new Date(b.Timestamp) - new Date(a.Timestamp)
  );

  if (!sorted.length) return null;

  return {
    value:     +sorted[0].Average.toFixed(4),
    timestamp: new Date(sorted[0].Timestamp),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// EC2
// ─────────────────────────────────────────────────────────────────────────────

// Returns deduplicated RUNNING instances: [{ instanceId, tags }]
export const fetchEC2Instances = async (ak, sk, region) => {
  const ec2  = makeEC2(ak, sk, region);
  const res  = await ec2.send(new DescribeInstancesCommand({ MaxResults: 100 }));
  const seen = new Map();

  for (const r of (res.Reservations || [])) {
    for (const i of (r.Instances || [])) {
      if (i.State?.Name !== 'running') continue;
      if (seen.has(i.InstanceId))      continue; // dedup
      const tags = {};
      (i.Tags || []).forEach((t) => { tags[t.Key] = t.Value; });
      seen.set(i.InstanceId, { instanceId: i.InstanceId, tags });
    }
  }

  const running = [...seen.values()];
  console.log(`  [EC2] ${running.length} running instance(s)`);
  return running;
};

// Returns: [{ resourceId, metricName, value, timestamp }]
export const fetchEC2Metrics = async (ak, sk, region, instances) => {
  if (!instances.length) return [];
  const cw      = makeCW(ak, sk, region);
  const results = [];

  await Promise.all(instances.map(async ({ instanceId }) => {
    const dp = await fetchLatestDatapoint(cw, {
      namespace:  'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensions: [{ Name: 'InstanceId', Value: instanceId }],
    });
    if (dp) {
      console.log(`    ✓ EC2 ${instanceId} CPU=${dp.value}%`);
      results.push({ resourceId: instanceId, metricName: 'CPUUtilization', ...dp });
    }
  }));

  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// RDS
// ─────────────────────────────────────────────────────────────────────────────

// Returns: [{ instanceId, tags }]
export const fetchRDSInstances = async (ak, sk, region) => {
  const rds = makeRDS(ak, sk, region);
  const res = await rds.send(new DescribeDBInstancesCommand({ MaxRecords: 100 }));

  return (res.DBInstances || [])
    .filter((db) => db.DBInstanceStatus === 'available')
    .map((db) => {
      const tags = {};
      (db.TagList || []).forEach((t) => { tags[t.Key] = t.Value; });
      return { instanceId: db.DBInstanceIdentifier, tags };
    });
};

// Returns: [{ resourceId, metricName, value, timestamp }]
export const fetchRDSMetrics = async (ak, sk, region, instances) => {
  if (!instances.length) return [];
  const cw      = makeCW(ak, sk, region);
  const results = [];

  await Promise.all(instances.map(async ({ instanceId }) => {
    const dp = await fetchLatestDatapoint(cw, {
      namespace:  'AWS/RDS',
      metricName: 'CPUUtilization',
      dimensions: [{ Name: 'DBInstanceIdentifier', Value: instanceId }],
    });
    if (dp) {
      console.log(`    ✓ RDS ${instanceId} CPU=${dp.value}%`);
      results.push({ resourceId: instanceId, metricName: 'CPUUtilization', ...dp });
    }
  }));

  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// S3
// ─────────────────────────────────────────────────────────────────────────────
// Note: NumberOfRequests requires request metrics enabled on each bucket.
// BucketSizeBytes and NumberOfObjects are available by default (daily granularity).
// We use NumberOfObjects as the default metric since it needs no extra config.

export const fetchS3Buckets = async (ak, sk, region) => {
  const s3  = makeS3(ak, sk, region);
  const res = await s3.send(new ListBucketsCommand({}));
  return (res.Buckets || []).map((b) => ({ bucketName: b.Name, tags: {} }));
};

// Returns: [{ resourceId, metricName, value, timestamp }]
export const fetchS3Metrics = async (ak, sk, buckets) => {
  if (!buckets.length) return [];
  // S3 CloudWatch metrics are always in us-east-1 regardless of bucket region
  const cw      = makeCW(ak, sk, 'us-east-1');
  const results = [];

  await Promise.all(buckets.map(async ({ bucketName }) => {
    const dp = await fetchLatestDatapoint(cw, {
      namespace:    'AWS/S3',
      metricName:   'NumberOfObjects',
      dimensions:   [
        { Name: 'BucketName',   Value: bucketName },
        { Name: 'StorageType',  Value: 'AllStorageTypes' },
      ],
      windowMinutes: 1500, // daily metric — look back 25h to always get one point
    });
    if (dp) {
      console.log(`    ✓ S3 ${bucketName} Objects=${dp.value}`);
      results.push({ resourceId: bucketName, metricName: 'NumberOfObjects', ...dp });
    }
  }));

  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// DynamoDB
// ─────────────────────────────────────────────────────────────────────────────

export const fetchDynamoDBTables = async (ak, sk, region) => {
  const ddb = makeDDB(ak, sk, region);
  const res = await ddb.send(new ListTablesCommand({ Limit: 100 }));
  return (res.TableNames || []).map((name) => ({ tableName: name, tags: {} }));
};

// Returns: [{ resourceId, metricName, value, timestamp }] — read + write capacity
export const fetchDynamoDBMetrics = async (ak, sk, region, tables) => {
  if (!tables.length) return [];
  const cw      = makeCW(ak, sk, region);
  const results = [];

  const metrics = ['ConsumedReadCapacityUnits', 'ConsumedWriteCapacityUnits'];

  await Promise.all(tables.flatMap(({ tableName }) =>
    metrics.map(async (metricName) => {
      const dp = await fetchLatestDatapoint(cw, {
        namespace:  'AWS/DynamoDB',
        metricName,
        dimensions: [{ Name: 'TableName', Value: tableName }],
      });
      if (dp) {
        console.log(`    ✓ DynamoDB ${tableName} ${metricName}=${dp.value}`);
        results.push({ resourceId: tableName, metricName, ...dp });
      }
    })
  ));

  return results;
};
