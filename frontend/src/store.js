import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/auth.slice";
import dashboardReducer from "./features/dashboard/dashboard.slice";
import reportReducer from "./features/report/report.slice";
import chatReducer from "./features/ask-ai/chat.slice";
import insightsReducer from "./features/ai-insights/insights.slice";
import cloudConnectReducer from "./features/cloud-connect/cloudConnect.slice";
import alertsReducer from "./features/alerts/alerts.slice";
import budgetReducer from "./features/budget/budget.slice";
import teamReducer from "./features/Team/team.slice";
import cloudAccountsReducer from "./features/cloud-accounts/cloudAccounts.slice";
import zombieDetectorReducer from "./features/zombie-detector/zombieDetector.slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    report: reportReducer,
    chat: chatReducer,
    insights: insightsReducer,
    cloudConnect: cloudConnectReducer,
    alerts: alertsReducer,
    budget: budgetReducer,
    team: teamReducer,
    cloudAccounts: cloudAccountsReducer,
    zombieDetector: zombieDetectorReducer,
  },
});

export default store;

