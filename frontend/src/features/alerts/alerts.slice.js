import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  alerts: [],
  loading: true,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlerts: (state, action) => { state.alerts = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    resolveAlert: (state, action) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert) alert.status = 'Resolved';
    }
  },
});
export const { setAlerts, setLoading, setError, resolveAlert } = alertsSlice.actions;
export default alertsSlice.reducer;
