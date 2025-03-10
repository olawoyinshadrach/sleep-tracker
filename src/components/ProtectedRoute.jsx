// components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase-config";

const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  
  if (loading) {
    return <div>Loading authentication...</div>;
  }
  
  if (!user) {
    // Redirect to landing if not authenticated
    return <Navigate to="/landing" replace />;
  }

  return children;
};

export default ProtectedRoute;
