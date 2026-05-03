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
    if (!isAuthChecked) {
      handleGetme();
    }
  }, [isAuthChecked, handleGetme]);

  if (!isAuthChecked) {
    return (
      <div>
        <SkeletonLoader />
      </div>
    );
  }

  // If auth check is done and we still have no user OR no token, redirect to login
  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Auth checked, user exists, token exists -> allow access
  return children;
};

export default ProtectedRoute;
