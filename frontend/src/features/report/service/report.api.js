import axiosInstance from "../../../utils/axios";

/**
 * Fetch paginated reports.
 * @param {number} page
 * @param {number} limit
 * @param {string|null} startDate  "YYYY-MM-DD"
 * @param {string|null} endDate    "YYYY-MM-DD"
 * @param {string|null} provider
 * @param {string|null} team
 */
export const getReportsApi = async (page = 1, limit = 50, startDate = null, endDate = null, provider = null, team = null) => {
  const params = new URLSearchParams({ page, limit });
  if (startDate) params.append("startDate", startDate);
  if (endDate)   params.append("endDate", endDate);
  if (provider && provider !== "All Providers") params.append("provider", provider);
  if (team && team !== "All Teams") params.append("team", team);

  const response = await axiosInstance.get(`/dashboard/reports?${params.toString()}`);
  return response.data;
};
