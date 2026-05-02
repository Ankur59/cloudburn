import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthChecked: false,
  },

  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    setAuthChecked: (state, action) => {
      state.isAuthChecked = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, setAuthChecked, clearError } =
  authSlice.actions;

export default authSlice.reducer;
