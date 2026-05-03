import axiosInstance from "../../../utils/axios";

export const connectAwsApi = async ({ accessKey, secretKey, region = 'us-east-1' }) => {
  const response = await axiosInstance.post("/aws/connect", { accessKey, secretKey, region });
  return response.data;
};
