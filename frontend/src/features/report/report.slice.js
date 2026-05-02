import { createSlice } from "@reduxjs/toolkit";

const reportSlice = createSlice({
  name: "report",
  initialState: {
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    },
    loading: false,
    error: null,
  },
  reducers: {
    setReportsData: (state, action) => {
      state.data = action.payload.reports || [];
      state.pagination = action.payload.pagination || state.pagination;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setReportsData, setLoading, setError } = reportSlice.actions;

export default reportSlice.reducer;
