import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
import { verifyAwsCredentials } from "../services/aws.service.js";
import { encrypt } from "../utils/encryption.js";

export const connectAWS = asyncHandler(async (req, res) => {
  const { accessKey, secretKey, region } = req.body;

  // 1. verify credentials
  const result = await verifyAwsCredentials(accessKey, secretKey, region);

  if (!result.isValid) {
    return res.status(400).json({
      message: "Invalid AWS credentials",
    });
  }

  // 2. encrypt + save
  await Organization.findByIdAndUpdate(req.user.orgId, {
    awsAccessKey: encrypt(accessKey),
    awsSecretKey: encrypt(secretKey),
    awsRegion: region,
    awsConnectedAt: new Date(),
  });

  res.json({
    message: "AWS connected successfully",
    data: result,
  });
});
