import { useDispatch, useSelector } from 'react-redux';
import {
  getInsightsApi,
  refreshInsightsApi,
  applyInsightApi,
  dismissInsightApi,
} from '../service/insights.api';
import {
  setInsightsData,
  setInsightsLoading,
  setInsightsError,
  updateInsightStatus,
  removeInsight,
} from '../insights.slice';

// ── useInsights ────────────────────────────────────────────────────────────────
// Custom hook for the AI Insights feature.
// Exposes:
//   insights     – array of insight objects
//   fetchedAt    – ISO timestamp of last BillingSnapshot update
//   generatedAt  – ISO timestamp of last Groq generation
//   summary      – { grossCost, topService, topServiceCost }
//   loading      – bool
//   error        – string | null
//   fetchInsights    – triggers GET API call
//   refreshInsights  – triggers POST force refresh API call
//   applyInsight     – triggers PATCH API call & updates Redux
//   dismissInsight   – triggers DELETE API call & updates Redux

const useInsights = () => {
  const dispatch = useDispatch();
  const { insights, fetchedAt, generatedAt, summary, loading, error } = useSelector(
    (state) => state.insights,
  );

  // Fetch from backend — uses MongoDB InsightCache
  const fetchInsights = async () => {
    try {
      dispatch(setInsightsLoading(true));
      dispatch(setInsightsError(null));
      const response = await getInsightsApi();
      dispatch(setInsightsData(response.data));
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Failed to load AI insights';
      dispatch(setInsightsError(message));
    } finally {
      dispatch(setInsightsLoading(false));
    }
  };

  // Force regenerate via Groq (Run AI Scan)
  const refreshInsights = async () => {
    try {
      dispatch(setInsightsLoading(true));
      dispatch(setInsightsError(null));
      const response = await refreshInsightsApi();
      dispatch(setInsightsData(response.data));
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Failed to refresh AI insights';
      dispatch(setInsightsError(message));
    } finally {
      dispatch(setInsightsLoading(false));
    }
  };

  // Mark insight as applied in DB and local Redux state
  const applyInsight = async (id) => {
    try {
      // Optimistic update
      dispatch(updateInsightStatus({ id, status: 'applied' }));
      await applyInsightApi(id);
    } catch (err) {
      console.error('Failed to apply insight:', err);
      // Revert optimistic update on failure could be handled here
    }
  };

  // Remove insight from DB and local Redux state
  const dismissInsight = async (id) => {
    try {
      // Optimistic update
      dispatch(removeInsight(id));
      await dismissInsightApi(id);
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  };

  return {
    insights,
    fetchedAt,
    generatedAt,
    summary,
    loading,
    error,
    fetchInsights,
    refreshInsights,
    applyInsight,
    dismissInsight,
  };
};

export default useInsights;
