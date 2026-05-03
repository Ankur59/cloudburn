
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageWithResourcesCommand,
} from "@aws-sdk/client-cost-explorer";

const CE_REGION = "us-east-1";

export const makeCEClient = (accessKey, secretKey) =>
  new CostExplorerClient({
    region: CE_REGION,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

export const ceQuery = async (client, params) => {
  let hasNext = true;
  let nextToken = undefined;
  let aggregatedResponse = null;

  while (hasNext) {
    const commandParams = { ...params, NextPageToken: nextToken };
    const res = await client.send(new GetCostAndUsageCommand(commandParams));

    if (!aggregatedResponse) {
      aggregatedResponse = {
        GroupDefinitions: res.GroupDefinitions,
        DimensionValueAttributes: res.DimensionValueAttributes,
        ResultsByTime: res.ResultsByTime || [],
      };
    } else if (res.ResultsByTime) {
      res.ResultsByTime.forEach((period) => {
        const existing = aggregatedResponse.ResultsByTime.find(
          (p) =>
            p.TimePeriod?.Start === period.TimePeriod?.Start &&
            p.TimePeriod?.End === period.TimePeriod?.End,
        );
        if (existing) {
          if (period.Groups) {
            existing.Groups = (existing.Groups || []).concat(period.Groups);
          }
        } else {
          aggregatedResponse.ResultsByTime.push(period);
        }
      });
    }

    if (res.NextPageToken) {
      nextToken = res.NextPageToken;
    } else {
      hasNext = false;
    }
  }
  return aggregatedResponse;
};

export const ceQueryWithResources = async (client, params) => {
  let hasNext = true;
  let nextToken = undefined;
  let aggregatedResponse = null;

  while (hasNext) {
    const commandParams = { ...params, NextPageToken: nextToken };
    const res = await client.send(
      new GetCostAndUsageWithResourcesCommand(commandParams),
    );

    if (!aggregatedResponse) {
      aggregatedResponse = {
        GroupDefinitions: res.GroupDefinitions,
        DimensionValueAttributes: res.DimensionValueAttributes,
        ResultsByTime: res.ResultsByTime || [],
      };
    } else if (res.ResultsByTime) {
      res.ResultsByTime.forEach((period) => {
        const existing = aggregatedResponse.ResultsByTime.find(
          (p) =>
            p.TimePeriod?.Start === period.TimePeriod?.Start &&
            p.TimePeriod?.End === period.TimePeriod?.End,
        );
        if (existing) {
          if (period.Groups) {
            existing.Groups = (existing.Groups || []).concat(period.Groups);
          }
        } else {
          aggregatedResponse.ResultsByTime.push(period);
        }
      });
    }

    if (res.NextPageToken) {
      nextToken = res.NextPageToken;
    } else {
      hasNext = false;
    }
  }
  return aggregatedResponse;
};

export const verifyAwsCredentials = async (accessKey, secretKey, region) => {
  try {
    const client = new STSClient({
      region,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
    const response = await client.send(new GetCallerIdentityCommand({}));
    return {
      isValid: true,
      accountId: response.Account,
      arn: response.Arn,
      userId: response.UserId,
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};
