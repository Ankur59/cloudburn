import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  teamBudgets: [],
  loading: false,
  error: null,
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setTeamBudgets: (state, action) => { state.teamBudgets = action.payload; },
    updateTeamBudget: (state, action) => {
      const { id, budget, alertThreshold } = action.payload;
      const team = state.teamBudgets.find(t => t.id === id);
      if (team) {
        team.budget = budget;
        team.alertThreshold = alertThreshold;
      }
    },
  },
});
export const { setTeamBudgets, updateTeamBudget } = budgetSlice.actions;
export default budgetSlice.reducer;
