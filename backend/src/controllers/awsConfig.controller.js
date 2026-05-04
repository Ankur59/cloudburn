import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
import BillingSnapshot from "../models/billingSnapshot.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { decrypt, encrypt } from "../utils/encryption.js";
import { verifyAwsCredentials } from "../services/aws.service.js";

// ── Helper: load and decrypt org AWS credentials ──────────────────────────────
const getOrgCreds = async (orgId) => {
  const org = await Organization.findById(orgId).select(
    "+awsAccessKey +awsSecretKey",
  );
  if (!org?.awsAccessKey || !org?.awsSecretKey || !org?.awsRegion) return null;
  return {
    accessKey: decrypt(org.awsAccessKey),
    secretKey: decrypt(org.awsSecretKey),
    region: org.awsRegion,
  };
};

// ── POST /api/aws/connect ─────────────────────────────────────────────────────
export const connectAWS = asyncHandler(async (req, res) => {
  const { accessKey, secretKey, region } = req.body;

  const result = await verifyAwsCredentials(accessKey, secretKey, region);
  if (!result.isValid) {
    throw new AppError("Invalid AWS credentials", 400);
  }

  await Organization.findByIdAndUpdate(req.user.orgId, {
    awsAccessKey: encrypt(accessKey),
    awsSecretKey: encrypt(secretKey),
    awsRegion: region,
    awsAccountId: result.accountId,
    awsConnectedAt: new Date(),
  });

  return sendSuccess(res, 200, "AWS connected successfully", {
    accountId: result.accountId,
    arn: result.arn,
    userId: result.userId,
  });
});

// ── GET /api/aws/accounts ─────────────────────────────────────────────────────
export const getCloudAccounts = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.user.orgId);
  const snapshot = await BillingSnapshot.findOne({ orgId: req.user.orgId }).select("monthComparison");
  
  const accounts = [];
  
  if (org && org.awsConnectedAt) {
    let mtdSpend = "$0";
    if (snapshot?.monthComparison?.thisMonthTotal !== undefined) {
      mtdSpend = `$${snapshot.monthComparison.thisMonthTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    accounts.push({
      id: `aws-${org._id}`,
      name: 'Production AWS',
      provider: 'AWS',
      accountId: org.awsAccountId || 'Connected', 
      regions: org.awsRegion ? [org.awsRegion] : ['us-east-1'],
      mtdSpend,
      lastSynced: org.lastSyncedAt ? new Date(org.lastSyncedAt).toLocaleString() : 'just now',
      status: 'Active',
      credHealth: { status: 'healthy', label: 'Healthy', pct: 100 },
    });
  }

  // Add mock entries for coming soon
  accounts.push({
    id: 'gcp-coming-soon',
    name: 'GCP Account',
    provider: 'GCP',
    accountId: 'Coming Soon',
    regions: [],
    mtdSpend: '$0',
    lastSynced: '-',
    status: 'Coming Soon',
    credHealth: { status: 'expiring', label: 'Coming Soon', pct: 0 },
  });

  accounts.push({
    id: 'azure-coming-soon',
    name: 'Azure Account',
    provider: 'Azure',
    accountId: 'Coming Soon',
    regions: [],
    mtdSpend: '$0',
    lastSynced: '-',
    status: 'Coming Soon',
    credHealth: { status: 'expiring', label: 'Coming Soon', pct: 0 },
  });

  return sendSuccess(res, 200, "Cloud accounts fetched successfully", { accounts });
});
