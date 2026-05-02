import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/auth.slice";
import dashboardReducer from "./features/dashboard/dashboard.slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
