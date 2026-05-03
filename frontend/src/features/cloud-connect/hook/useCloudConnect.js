import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectAwsApi } from '../service/cloudConnect.api';
import { setLoading, setError, setSuccess, resetState } from '../cloudConnect.slice';
import useAuth from '../../auth/hook/useAuth';

export const useCloudConnect = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.cloudConnect);
  const { handleGetme } = useAuth(); // refresh user profile after connection

  const handleConnectAws = useCallback(async (credentials) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(false));
      
      const data = await connectAwsApi({ 
        accessKey: credentials.accessKey, 
        secretKey: credentials.secretKey, 
        region: 'us-east-1' // Using us-east-1 as default
      });
      
      // Update global user state so isCloudConnected becomes true
      await handleGetme();
      
      dispatch(setSuccess(true));
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to connect to AWS';
      dispatch(setError(message));
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, handleGetme]);

  const reset = useCallback(() => {
    dispatch(resetState());
  }, [dispatch]);

  return {
    handleConnectAws,
    loading,
    error,
    success,
    reset,
    setError: (err) => dispatch(setError(err))
  };
};

export default useCloudConnect;
