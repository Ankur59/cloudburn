import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

export const verifyAwsCredentials = async (accessKey, secretKey, region) => {
  try {
    const client = new STSClient({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const command = new GetCallerIdentityCommand({});
    const response = await client.send(command);

    return {
      isValid: true,
      accountId: response.Account,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
    };
  }
};


export const getAwsCost = async (accessKey, secretKey, region) => {
  const client = new CostExplorerClient({
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  });

  // Dynamic window: last 30 days, dates zero-padded to YYYY-MM-DD
  const today  = new Date();
  const start  = new Date(today);
  start.setDate(today.getDate() - 30);

  const fmt = (d) => d.toISOString().split('T')[0]; // "YYYY-MM-DD"

  const command = new GetCostAndUsageCommand({
    TimePeriod: {
      Start: fmt(start),
      End:   fmt(today),
    },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"],
    GroupBy: [
      { Type: "DIMENSION", Key: "SERVICE" },
      // { Type: "DIMENSION", Key: "REGION" },
      { Type: "TAG",Key: "team" },
    ],
  });

  const response = await client.send(command);

  return response;
};