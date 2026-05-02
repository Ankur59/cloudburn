import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { setLoading, setReportsData, setError } from "../report.slice";
import { getReportsApi } from "../service/report.api";

export const useReport = () => {
  const dispatch = useDispatch();

  /**
   * @param {number} page
   * @param {number} limit
   * @param {string|null} startDate "YYYY-MM-DD"
   * @param {string|null} endDate   "YYYY-MM-DD"
   * @param {string|null} provider
   * @param {string|null} team
   */
  const handleGetReports = useCallback(
    async (page = 1, limit = 50, startDate = null, endDate = null, provider = null, team = null) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const response = await getReportsApi(page, limit, startDate, endDate, provider, team);
        if (response.success && response.data) {
          dispatch(setReportsData(response.data));
        }
        return response.data;
      } catch (error) {
        dispatch(setError(error?.response?.data?.message || error?.message || "Failed to fetch reports"));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return { handleGetReports };
};