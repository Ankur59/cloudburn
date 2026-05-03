import axiosInstance from "../../../utils/axios";

export const connectAwsApi = async ({
  accessKey,
  secretKey,
  region = "us-east-1",
}) => {
  const response = await axiosInstance.post("/aws/connect", {
    accessKey,
    secretKey,
    region,
  });
  return response.data;
};

export const syncAwsCostApi = async () => {
  try {
    const response = await axiosInstance.get("/aws/cost");
    return response.data;
  } catch (error) {
    console.log("Error syncing AWS cost data:", error);
  }
};

export const syncAwsBillingApi = async () => {
  try {
    const response = await axiosInstance.get("/aws/billing");
    return response.data;
  } catch (error) {
    console.log("Error syncing AWS billing data:", error);
  }
};
