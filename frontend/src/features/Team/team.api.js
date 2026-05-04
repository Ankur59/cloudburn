import axiosInstance from "../../utils/axios.js";

export const getTeamsApi = () => {
  return axiosInstance.get("/teams");
};

export const createTeamApi = (teamData) => {
  return axiosInstance.post("/teams", teamData);
};

export const updateTeamApi = (teamId, updates) => {
  return axiosInstance.patch(`/teams/${teamId}`, updates);
};

export const deleteTeamApi = (teamId) => {
  return axiosInstance.delete(`/teams/${teamId}`);
};
