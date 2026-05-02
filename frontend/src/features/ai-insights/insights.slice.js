import { createSlice } from '@reduxjs/toolkit';

// ── AI Insights Redux Slice ────────────────────────────────────────────────────
// State shape:
//   insights     – array of insight objects from MongoDB InsightCache
//   fetchedAt    – ISO timestamp of when BillingSnapshot was last updated
//   generatedAt  – ISO timestamp of when Groq last generated these insights
//   summary      – { grossCost, topService, topServiceCost }
//   loading      – bool
//   error        – string | null

const insightsSlice = createSlice({
  name: 'insights',
  initialState: {
    insights: [],
    fetchedAt: null,
    generatedAt: null,
    summary: null,
    loading: false,
    error: null,
  },
  reducers: {
    setInsightsData: (state, action) => {
      state.insights     = action.payload.insights     ?? [];
      state.fetchedAt    = action.payload.fetchedAt    ?? null;
      state.generatedAt  = action.payload.generatedAt  ?? null;
      state.summary      = action.payload.summary      ?? null;
    },
    setInsightsLoading: (state, action) => {
      state.loading = action.payload;
    },
    setInsightsError: (state, action) => {
      state.error = action.payload;
    },
    // Local-only: update a single insight's status (applied)
    updateInsightStatus: (state, action) => {
      const { id, status } = action.payload;
      const insight = state.insights.find((ins) => ins.id === id);
      if (insight) {
        insight.status = status;
        insight.isNew  = false;
      }
    },
    // Remove an insight entirely (dismiss)
    removeInsight: (state, action) => {
      const id = action.payload;
      state.insights = state.insights.filter((ins) => ins.id !== id);
    },
  },
});

export const {
  setInsightsData,
  setInsightsLoading,
  setInsightsError,
  updateInsightStatus,
  removeInsight,
} = insightsSlice.actions;

export default insightsSlice.reducer;

