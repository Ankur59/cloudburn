import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accounts: [],
  syncLog: [],
  loading: false,
};

const cloudAccountsSlice = createSlice({
  name: 'cloudAccounts',
  initialState,
  reducers: {
    setAccounts: (state, action) => { state.accounts = action.payload; },
    setSyncLog: (state, action) => { state.syncLog = action.payload; },
    updateAccount: (state, action) => {
      const updated = action.payload;
      state.accounts = state.accounts.map(a => a.id === updated.id ? updated : a);
    },
    removeAccount: (state, action) => {
      state.accounts = state.accounts.filter(a => a.id !== action.payload);
    },
    addSyncLog: (state, action) => {
      state.syncLog.unshift(action.payload);
    }
  },
});
export const { setAccounts, setSyncLog, updateAccount, removeAccount, addSyncLog } = cloudAccountsSlice.actions;
export default cloudAccountsSlice.reducer;
