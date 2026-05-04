import axiosInstance from '../../utils/axios';

// GET /api/zombie — list zombie resources for the current org
// Optional query params: status, page, limit
export const getZombiesApi = (params = {}) => {
  return axiosInstance.get('/zombie', { params });
};

// POST /api/zombie/scan — trigger an on-demand scan, returns fresh results
export const triggerScanApi = () => {
  return axiosInstance.post('/zombie/scan');
};

// PATCH /api/zombie/:id — update status (zombie | marked | cleaned)
export const updateZombieStatusApi = (id, status) => {
  return axiosInstance.patch(`/zombie/${id}`, { status });
};
