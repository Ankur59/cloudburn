import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/auth.slice";
import dashboardReducer from "./features/dashboard/dashboard.slice";
import reportReducer from "./features/report/report.slice";
import chatReducer from "./features/ask-ai/chat.slice";
import insightsReducer from "./features/ai-insights/insights.slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    report: reportReducer,
    chat: chatReducer,
    insights: insightsReducer,
  },
});

export default store;

