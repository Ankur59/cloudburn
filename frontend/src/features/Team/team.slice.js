import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  teams: [],
  loading: false,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeams: (state, action) => { state.teams = action.payload; },
    addPendingInvite: (state, action) => {
      const { teamId, member } = action.payload;
      const team = state.teams.find(t => t.id === teamId);
      if (team) team.members.push(member);
    },
    removeMember: (state, action) => {
      const { teamId, memberId } = action.payload;
      const team = state.teams.find(t => t.id === teamId);
      if (team) {
        team.members = team.members.filter(m => m.id !== memberId);
        team.memberCount = team.members.filter(m => m.status === 'active').length;
      }
    }
  },
});
export const { setTeams, addPendingInvite, removeMember } = teamSlice.actions;
export default teamSlice.reducer;
