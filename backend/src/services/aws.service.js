import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

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
