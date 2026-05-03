import { Routes, Route } from "react-router-dom";

// Pages
import Login from "../features/auth/pages/Login.jsx";
import Register from "../features/auth/pages/Register.jsx";
import VerifyEmail from "../features/auth/pages/VerifyEmail.jsx";
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

// Route Wrappers
import ProtectedRoute from "../features/auth/components/Protected.jsx";
import PublicRoute from "../features/auth/components/PublicRoute.jsx";

const AppRouter = () => {

  const publicRoutes = [
    { path: "/login", element: <Login /> },
    { path: "/signup", element: <Register /> },
  ];

  const protectedRoutes = [
    { path: "/", element: <Dashboard /> },
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/onboarding", element: <Onboarding /> },
    { path: "/connect", element: <Connect /> },
    { path: "/reports", element: <Reports /> },
    { path: "/alerts", element: <Alerts /> },
    { path: "/teams", element: <Team /> },
    { path: "/budget", element: <Budget /> },
    { path: "/ai-insights", element: <AiInsights /> },
    { path: "/ask-ai", element: <AskAIPage /> },
    { path: "/zombie-detector", element: <ZombieDetector /> },
    { path: "/cloud-accounts", element: <CloudAccounts /> },
  ];

  return (
    <Routes>

      {/* Public Routes */}
      {publicRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<PublicRoute>{element}</PublicRoute>}
        />
      ))}

      {/* Special case (no wrapper) */}
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      {protectedRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<ProtectedRoute>{element}</ProtectedRoute>}
        />
      ))}

    </Routes>
  );
};

export default AppRouter;