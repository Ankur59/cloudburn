import axiosInstance from "../../utils/axios.js";

export const getCloudAccountsApi = () => {
  return axiosInstance.get("/aws/accounts");
};
