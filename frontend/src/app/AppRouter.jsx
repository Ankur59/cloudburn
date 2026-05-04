import { Routes, Route } from "react-router-dom";
import Login from "../features/auth/pages/Login.jsx";
import Register from "../features/auth/pages/Register.jsx";
import VerifyEmail from "../features/auth/pages/VerifyEmail.jsx";
import ForgotPassword from "../features/auth/pages/ForgotPassword.jsx";
import Onboarding from "../features/auth/pages/Onboarding.jsx";
import Dashboard from "../features/dashboard/pages/DashboardPage.jsx";
import Connect from "../features/cloud-connect/pages/Connect.jsx";
import Reports from "../features/report/pages/Reports.jsx";
import Alerts from "../features/alerts/pages/Alerts.jsx";
import Team from "../features/Team/pages/Team.jsx";
import Budget from "../features/budget/pages/Budget.jsx";
import AiInsights from "../features/ai-insights/pages/Aiinsights.jsx";
import ZombieDetector from "../features/zombie-detector/pages/ZombieDetector.jsx";
import CloudAccounts from "../features/cloud-accounts/pages/CloudAccounts.jsx";
import AskAIPage from "../features/ask-ai/pages/AskAIPage.jsx";
import SettingsPage from "../features/settings/pages/SettingsPage.jsx";
import UsageAnalyticsPage from "../features/dashboard/pages/UsageAnalyticsPage.jsx";
import AwsGuidePage from "../features/cloud-connect/pages/AwsGuidePage.jsx";
import ProtectedRoute from "../features/auth/components/Protected.jsx";
import PublicRoute from "../features/auth/components/PublicRoute.jsx";

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes - Only accessible if NOT logged in */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/ai-insights" element={<ProtectedRoute><AiInsights /></ProtectedRoute>} />
      <Route path="/ask-ai" element={<ProtectedRoute><AskAIPage /></ProtectedRoute>} />
      <Route path="/zombie-detector" element={<ProtectedRoute><ZombieDetector /></ProtectedRoute>} />
      <Route path="/cloud-accounts" element={<ProtectedRoute><CloudAccounts /></ProtectedRoute>} />
      <Route path="/usage-analytics" element={<ProtectedRoute><UsageAnalyticsPage /></ProtectedRoute>} />
      <Route path="/aws-guide" element={<ProtectedRoute><AwsGuidePage /></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRouter;








