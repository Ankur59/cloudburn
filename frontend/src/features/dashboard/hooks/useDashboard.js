import { useDispatch, useSelector } from "react-redux";
import { getDashboardStatsApi } from "../service/dashboard.api";
import {
  setDashboardData,
  setDashboardLoading,
  setDashboardError,
} from "../dashboard.slice";

const useDashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.dashboard);

  const fetchDashboard = async () => {
    try {
      dispatch(setDashboardLoading(true));
      dispatch(setDashboardError(null));
      const response = await getDashboardStatsApi();
      // API returns { success, message, data: { kpis, dailyCostTrend, ... } }
      dispatch(setDashboardData(response.data));
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to load dashboard data";
      dispatch(setDashboardError(message));
    } finally {
      dispatch(setDashboardLoading(false));
    }
  };

  return { data, loading, error, fetchDashboard };
};

export default useDashboard;
