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

  const command = new GetCostAndUsageCommand({
    TimePeriod: {
      Start: "2026-04-01",
      End: "2026-04-30"
    },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"],
    GroupBy: [
      { Type: "DIMENSION", Key: "SERVICE" }
    ]
  });

  const response = await client.send(command);

  return response;
};