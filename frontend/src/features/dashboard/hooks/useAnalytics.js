import { useState, useCallback } from 'react';
import axiosInstance from '../../../utils/axios';

const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usageData, setUsageData] = useState([]);

  const fetchResourceUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/analytics/resource-usage');
      setUsageData(response.data?.data?.usage || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch resource usage');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    usageData,
    fetchResourceUsage
  };
};

export default useAnalytics;
