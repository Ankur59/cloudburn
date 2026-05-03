import axiosInstance from "../../../utils/axios";

// POST /api/auth/register  — { orgName, name, email, password }
export const registerApi = async (userData) => {
  const response = await axiosInstance.post("/auth/register", userData);
  return response;
};

// POST /api/auth/verify-email  — { token }
export const verifyEmailApi = async (token) => {
  const response = await axiosInstance.post("/auth/verify-email", { token });
  return response;
};

// POST /api/auth/login  — { email, password }
export const loginApi = async (userData) => {
  const response = await axiosInstance.post("/auth/login", userData);
  return response;
};

// POST /api/auth/refresh  — reads httpOnly cookie
export const refreshApi = async () => {
  const response = await axiosInstance.post("/auth/refresh");
  return response;
};

// POST /api/auth/logout  — protected
export const logoutApi = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response;
};

// GET /api/auth/me  — protected
export const getMeApi = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response;
};

export const updateProfileApi = async (formData) => {
  const response = await axiosInstance.patch("/auth/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

// PUT /api/auth/set-org
export const setOrgNameApi = async (orgName) => {
  const response = await axiosInstance.put("/auth/set-org", { orgName });
  return response;
};
