import axiosInstance from '../../utils/axios';

// GET /api/alerts — list spike alerts for the current org
export const getAlertsApi = () => {
  return axiosInstance.get('/alerts');
};

// PATCH /api/alerts/:id/resolve — mark an alert as resolved
export const resolveAlertApi = (id) => {
  return axiosInstance.patch(`/alerts/${id}/resolve`);
};
