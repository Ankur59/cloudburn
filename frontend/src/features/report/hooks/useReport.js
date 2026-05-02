import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { setLoading, setReportsData, setError } from "../report.slice";
import { getReportsApi } from "../service/report.api";

export const useReport = () => {
    const dispatch = useDispatch();

    const handleGetReports = useCallback(async (page = 1, limit = 50) => {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));
            const response = await getReportsApi(page, limit);
            // The backend returns: { success, message, data: { reports, pagination } }
            if (response.success && response.data) {
              dispatch(setReportsData(response.data));
            }
            return response.data;
        } catch (error) {
            dispatch(setError(error?.message || "Failed to fetch reports"));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    return {
        handleGetReports,
    };
};