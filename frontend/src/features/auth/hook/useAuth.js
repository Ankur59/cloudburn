import { useDispatch } from "react-redux";
import {
  registerApi,
  loginApi,
  logoutApi,
  getMeApi,
  updateProfileApi,
  verifyEmailApi,
} from "../service/auth.api";
import {
  setUser,
  setToken,
  setLoading,
  setError,
  setAuthChecked,
  clearAuth,
} from "../auth.slice";

const useAuth = () => {
  const dispatch = useDispatch();

  const handleRegister = async (data) => {
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
  };

  const handleLogin = async (data) => {
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
  };

  const handleGetme = async () => {
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
  };

  const handleVerifyEmail = async (token) => {
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
  };

  const handleLogout = async () => {
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
  };

  const handleUpdateProfile = async (file) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await updateProfileApi(formData);

      dispatch(setUser(response.data));

      return { success: true };
    } catch (error) {
      const message = error?.response?.data?.message || "Profile update failed";
      dispatch(setError(message));
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    handleRegister,
    handleLogin,
    handleVerifyEmail,
    handleGetme,
    handleLogout,
    handleUpdateProfile,
  };
};

export default useAuth;
