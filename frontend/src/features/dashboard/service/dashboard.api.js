import axiosInstance from "../../../utils/axios";


export const getDashboardStatsApi = async () => {
  const response = await axiosInstance.get("/dashboard");
  return response.data;
};