import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  success: false,
};

const cloudConnectSlice = createSlice({
  name: 'cloudConnect',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSuccess: (state, action) => {
      state.success = action.payload;
    },
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
});

export const { setLoading, setError, setSuccess, resetState } = cloudConnectSlice.actions;
export default cloudConnectSlice.reducer;
