import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  resources: [],
  total: 0,
  lastScan: null,       // ISO string from backend
  loading: false,       // initial fetch loading
  scanLoading: false,   // on-demand scan in progress
  error: null,
};

const zombieDetectorSlice = createSlice({
  name: 'zombieDetector',
  initialState,
  reducers: {
    setResources:   (state, action) => { state.resources = action.payload; },
    setTotal:       (state, action) => { state.total = action.payload; },
    setLastScan:    (state, action) => { state.lastScan = action.payload; },
    setLoading:     (state, action) => { state.loading = action.payload; },
    setScanLoading: (state, action) => { state.scanLoading = action.payload; },
    setError:       (state, action) => { state.error = action.payload; },

    // Optimistic local status update (reflected instantly in UI)
    updateResourceStatus: (state, action) => {
      const { id, status } = action.payload;
      const r = state.resources.find(res => res._id === id || res.id === id);
      if (r) r.status = status;
    },

    removeResource: (state, action) => {
      state.resources = state.resources.filter(
        r => r._id !== action.payload && r.id !== action.payload
      );
    },

    // Legacy actions kept for backward compat with existing components
    markResource: (state, action) => {
      const r = state.resources.find(res => res._id === action.payload || res.id === action.payload);
      if (r) r.status = 'marked';
    },
    markResourcesBulk: (state, action) => {
      const ids = new Set(action.payload);
      state.resources = state.resources.map(r =>
        ids.has(r._id) || ids.has(r.id) ? { ...r, status: 'marked' } : r
      );
    },
    terminateResource: (state, action) => {
      const r = state.resources.find(res => res._id === action.payload || res.id === action.payload);
      if (r) r.status = 'cleaned';
    },
  },
});

export const {
  setResources, setTotal, setLastScan, setLoading, setScanLoading, setError,
  updateResourceStatus, removeResource,
  markResource, markResourcesBulk, terminateResource,
} = zombieDetectorSlice.actions;

export default zombieDetectorSlice.reducer;
