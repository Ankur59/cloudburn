import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    // Hydrate from localStorage so token survives page refresh
    accessToken: localStorage.getItem("accessToken") || null,
    loading: false,
    error: null,
    isAuthChecked: false,
  },

  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },

    setToken: (state, action) => {
      state.accessToken = action.payload;
      if (action.payload) {
        localStorage.setItem("accessToken", action.payload);
      } else {
        localStorage.removeItem("accessToken");
      }
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

    // Wipes everything on logout
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.removeItem("accessToken");
    },
  },
});

export const {
  setUser,
  setToken,
  setLoading,
  setError,
  setAuthChecked,
  clearError,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
