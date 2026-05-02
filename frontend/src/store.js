import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/auth.slice";
import dashboardReducer from "./features/dashboard/dashboard.slice";
import reportReducer from "./features/report/report.slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    report: reportReducer,
  },
});

export default store;
