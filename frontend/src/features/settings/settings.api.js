import axiosInstance from '../../utils/axios.js';

// GET /api/settings/profile
export const getProfileApi = () =>
  axiosInstance.get('/settings/profile');

// PATCH /api/settings/profile — supports both name update and avatar upload
export const updateProfileApi = (formData) =>
  axiosInstance.patch('/settings/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// PATCH /api/settings/password
export const changePasswordApi = (payload) =>
  axiosInstance.patch('/settings/password', payload);

// DELETE /api/settings/avatar — removes avatar from Cloudinary + DB
export const removeAvatarApi = () =>
  axiosInstance.delete('/settings/avatar');

// DELETE /api/settings/leave-org
export const leaveOrgApi = () =>
  axiosInstance.delete('/settings/leave-org');
