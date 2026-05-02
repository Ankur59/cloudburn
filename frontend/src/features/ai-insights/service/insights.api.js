import axiosInstance from '../../../utils/axios';

// GET /api/dashboard/insights — read from InsightCache (fast)
export const getInsightsApi = async () => {
  const response = await axiosInstance.get('/dashboard/insights');
  return response.data;
};

// POST /api/dashboard/insights/refresh — force regenerate via Groq (Run AI Scan)
export const refreshInsightsApi = async () => {
  const response = await axiosInstance.post('/dashboard/insights/refresh');
  return response.data;
};

// PATCH /api/dashboard/insights/:id/apply — mark as applied in MongoDB
export const applyInsightApi = async (insightId) => {
  const response = await axiosInstance.patch(`/dashboard/insights/${insightId}/apply`);
  return response.data;
};

// DELETE /api/dashboard/insights/:id — remove from MongoDB
export const dismissInsightApi = async (insightId) => {
  const response = await axiosInstance.delete(`/dashboard/insights/${insightId}`);
  return response.data;
};
