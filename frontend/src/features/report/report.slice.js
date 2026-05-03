import { createSlice } from "@reduxjs/toolkit";

const reportSlice = createSlice({
  name: "report",
  initialState: {
    data: [],
    pagination: {
      totalRows: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 50,
    },
    loading: false,
    error: null,
  },
  reducers: {
    setReportsData: (state, action) => {
      state.data = action.payload.reports || [];
      // backend returns: { totalRows, totalPages, currentPage, pageSize }
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
