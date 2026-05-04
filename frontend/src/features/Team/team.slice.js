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
    },
    addTeam: (state, action) => {
      const newTeam = {
        ...action.payload,
        id: action.payload.id || `team-${Date.now()}`,
        teamKey: action.payload.teamKey || action.payload.name.toLowerCase().replace(/\s+/g, '-'),
        memberCount: 0,
        members: [],
        totalSpend: '$0',
        trend: 0,
        currentSpend: 0,
        provider: 'AWS'
      };
      state.teams.unshift(newTeam);
    }
  },
});
export const { setTeams, addPendingInvite, removeMember, addTeam } = teamSlice.actions;
export default teamSlice.reducer;
