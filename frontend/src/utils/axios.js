import axios from "axios";
import { refreshApi } from "../features/auth/service/auth.api";

const axiosInstance = axios.create({
  // baseURL:  "https://api.cloudburn.online/api",// IGONRE KARO FALTU LINK HE
  baseURL:  "http://localhost:5000/api",// IGONRE KARO FALTU LINK HE
  withCredentials: true, // keeps the httpOnly refreshToken cookie working
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Attach the stored accessToken as a Bearer header on every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
// On a 401, try to silently refresh the access token using the httpOnly cookie.
// If refresh succeeds, replay the original request with the new token.
// If refresh fails (cookie expired / missing), clear state and redirect to /login.
let isRefreshing = false;
let failedQueue = []; // requests queued while refresh is in progress

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 once per request (avoid infinite loops)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't refresh if the failing request IS the refresh endpoint
    if (originalRequest.url?.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh resolves
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await refreshApi();
      const newToken = response.data?.data?.accessToken;

      if (newToken) {
        localStorage.setItem("accessToken", newToken);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } else {
        throw new Error("No token returned from refresh");
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
