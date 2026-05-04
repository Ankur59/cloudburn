import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hook/useAuth";
import SkeletonLoader from "../../shared/SkeletonLoader";

const ProtectedRoute = ({ children }) => {
  const { user, accessToken, isAuthChecked } = useSelector(
    (state) => state.auth,
  );
  const location = useLocation();
  const { handleGetme } = useAuth();

  useEffect(() => {
    // Re-fetch user profile whenever auth state is unchecked OR a new token arrives.
    // This ensures hasSetOrgName and isCloudConnected are always up-to-date
    // before routing decisions are made.
    if (!isAuthChecked || (accessToken && !user)) {
      handleGetme();
    }
  }, [isAuthChecked, accessToken]);

  if (!isAuthChecked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <SkeletonLoader />
      </div>
    );
  }

  // If auth check is done and we still have no user OR no token, redirect to login
  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle onboarding (organization name setup)
  // Use falsy check — login response may not include hasSetOrgName (undefined),
  // so strict `=== false` would miss new users before getme() resolves.
  if (!user.hasSetOrgName && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Handle cloud connection check
  // Note: we let them access /onboarding without cloud connected
  if (
    user.hasSetOrgName &&
    !user.isCloudConnected &&
    location.pathname !== '/connect' &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/connect" replace />;
  }

  // Auth checked, user exists, token exists -> allow access
  return children;
};

export default ProtectedRoute;
