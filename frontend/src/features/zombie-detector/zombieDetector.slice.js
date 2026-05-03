import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  resources: [],
  lastScan: '5 minutes ago',
  loading: false,
};

const zombieDetectorSlice = createSlice({
  name: 'zombieDetector',
  initialState,
  reducers: {
    setResources: (state, action) => { state.resources = action.payload; },
    setLastScan: (state, action) => { state.lastScan = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    markResource: (state, action) => {
      const r = state.resources.find(res => res.id === action.payload);
      if (r) r.status = 'Marked';
    },
    markResourcesBulk: (state, action) => {
      const ids = action.payload;
      state.resources = state.resources.map(r => ids.includes(r.id) ? { ...r, status: 'Marked' } : r);
    },
    terminateResource: (state, action) => {
      const r = state.resources.find(res => res.id === action.payload);
      if (r) r.status = 'Cleaned';
    },
    removeResource: (state, action) => {
      state.resources = state.resources.filter(r => r.id !== action.payload);
    }
  },
});
export const { setResources, setLastScan, setLoading, markResource, markResourcesBulk, terminateResource, removeResource } = zombieDetectorSlice.actions;
export default zombieDetectorSlice.reducer;
