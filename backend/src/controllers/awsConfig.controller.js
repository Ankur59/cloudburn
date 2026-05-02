import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
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
    awsConnectedAt: new Date(),
  });

  return sendSuccess(res, 200, "AWS connected successfully", {
    accountId: result.accountId,
    arn: result.arn,
    userId: result.userId,
  });
});
