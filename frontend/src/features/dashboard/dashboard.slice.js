import { createSlice } from "@reduxjs/toolkit";

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    data: null,      // full dashboardData object from API
    loading: false,
    error: null,
  },
  reducers: {
    setDashboardData: (state, action) => {
      state.data = action.payload;
    },
    setDashboardLoading: (state, action) => {
      state.loading = action.payload;
    },
    setDashboardError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setDashboardData, setDashboardLoading, setDashboardError } =
  dashboardSlice.actions;

export default dashboardSlice.reducer;
