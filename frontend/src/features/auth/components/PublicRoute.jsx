import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import SkeletonLoader from "../../shared/SkeletonLoader";
import useAuth from "../hook/useAuth";

const PublicRoute = ({ children }) => {
  const { user, isAuthChecked, accessToken } = useSelector(
    (state) => state.auth,
  );
  const { handleGetme } = useAuth();

  useEffect(() => {
    // If auth state is unknown, fetch it so we know if they should be redirected
    if (!isAuthChecked) {
      handleGetme();
    }
  }, [isAuthChecked]);

  // Wait for the auth check to finish before deciding
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

  // If the user is already authenticated (has user data AND a token), redirect to the dashboard
  if (user && accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, allow them to view the page (login/signup)
  return children;
};

export default PublicRoute;
