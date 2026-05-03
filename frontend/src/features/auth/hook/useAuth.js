import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  registerApi,
  loginApi,
  logoutApi,
  getMeApi,
  updateProfileApi,
  verifyEmailApi,
  setOrgNameApi,
} from "../service/auth.api";
import {
  setUser,
  setToken,
  setLoading,
  setError,
  setAuthChecked,
  clearAuth,
} from "../auth.slice";
import axiosInstance from "../../../utils/axios";

const useAuth = () => {
  const dispatch = useDispatch();

  const handleRegister = useCallback(
    async (data) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        await registerApi(data);
        return { success: true };
      } catch (error) {
        const message = error?.response?.data?.message || "Registration failed";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const handleLogin = useCallback(
    async (data) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const response = await loginApi(data);
        // Backend returns: { success, message, data: { accessToken, user } }
        const { accessToken, user } = response.data?.data ?? {};
        if (accessToken) dispatch(setToken(accessToken));
        if (user) dispatch(setUser(user));
        return { success: true };
      } catch (error) {
        const message = error?.response?.data?.message || "Login failed";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const handleGetme = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await getMeApi();
      // Backend returns: { success, message, data: { user } }
      const user = response.data?.data?.user ?? response.data?.data ?? null;
      dispatch(setUser(user));
    } catch (error) {
      dispatch(setUser(null));
    } finally {
      dispatch(setAuthChecked(true));
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleVerifyEmail = useCallback(
    async (token) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const response = await verifyEmailApi(token);
        dispatch(setUser(response.data?.data?.user || null));
        return { success: true };
      } catch (error) {
        const message = error?.response?.data?.message || "Verification failed";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const handleLogout = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      await logoutApi();
      dispatch(clearAuth()); // clears user + token + localStorage
      return { success: true };
    } catch (error) {
      // Even if API fails, clear local state so user can't stay logged in
      dispatch(clearAuth());
      return { success: false, message: "Logout failed" };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleUpdateProfile = useCallback(
    async (file) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const formData = new FormData();
        formData.append("avatar", file);

        const response = await updateProfileApi(formData);

        dispatch(setUser(response.data));

        return { success: true };
      } catch (error) {
        const message =
          error?.response?.data?.message || "Profile update failed";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const handleSetOrgName = useCallback(
    async (orgName) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        await setOrgNameApi(orgName);
        await handleGetme(); // refresh user profile to get hasSetOrgName = true
        return { success: true };
      } catch (error) {
        const message = error?.response?.data?.message || "Failed to set organization name";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, handleGetme]
  );

  const handleGoogleLoginRedirect = useCallback(() => {
    // Use VITE_API_URL if it exists, otherwise assume running on same domain or default to localhost:5000
    const apiUrl = axiosInstance.defaults.baseURL;
    window.location.href = `${apiUrl}/auth/google`;
  }, []);

  const handleGoogleCallback = useCallback(
    async (accessToken) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // 1. Set the token in Redux
        dispatch(setToken(accessToken));

        // 2. Fetch the user profile using the new token
        const response = await getMeApi();
        const user = response.data?.data?.user ?? response.data?.data ?? null;
        dispatch(setUser(user));

        return { success: true };
      } catch (error) {
        dispatch(setUser(null));
        dispatch(setError("Google authentication failed during profile fetch"));
        return { success: false, message: "Profile fetch failed" };
      } finally {
        dispatch(setAuthChecked(true));
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  return {
    handleRegister,
    handleLogin,
    handleVerifyEmail,
    handleGetme,
    handleLogout,
    handleUpdateProfile,
    handleGoogleLoginRedirect,
    handleGoogleCallback,
    handleSetOrgName,
  };
};

export default useAuth;
