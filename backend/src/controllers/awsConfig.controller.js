import asyncHandler from "../middlewares/async.middleware.js";
import Organization from "../models/organization.model.js";
import {
  aggregateByDate,
  aggregateByService,
  getAwsCost,
  getTotalCost,
  transformAwsCost,
  verifyAwsCredentials,
} from "../services/aws.service.js";
import { decrypt, encrypt } from "../utils/encryption.js";

// POST - /api/aws/connect
// require auth
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

// GET - /api/aws/cost
// require auth
export const getCost = asyncHandler(async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select(
      "+awsAccessKey +awsSecretKey",
    );

    if (!org.awsAccessKey || !org.awsSecretKey || !org.awsRegion) {
      return res.status(400).json({
        message: "AWS credentials not configured. Please connect AWS first.",
      });
    }

    const accessKey = decrypt(org.awsAccessKey);
    const secretKey = decrypt(org.awsSecretKey);

    const data = await getAwsCost(accessKey, secretKey, org.awsRegion);
    const result = transformAwsCost(data);
    const totalCost = getTotalCost(result);
    const serviceAggregate = aggregateByService(result);
    const dailyAggregate = aggregateByDate(result);

    res.json({
      message: "AWS cost fetched successfully",
      data: {
        result,
        totalCost,
        serviceAggregate,
        dailyAggregate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching cost" });
  }
});
