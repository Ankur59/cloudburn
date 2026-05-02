import axiosInstance from "../../../utils/axios";

export const getReportsApi = async (page = 1, limit = 50) => {
    try {
        const response = await axiosInstance.get(`/dashboard/reports?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
