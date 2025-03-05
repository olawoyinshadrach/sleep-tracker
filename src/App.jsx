// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase-config";

import Home from "./pages/Home";
import Alarm from "./pages/Alarm";
import SleepSession from "./pages/SleepSession";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  // Retrieve authentication state using a hook
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <div className="container">Loading...</div>;
  }
  
  if (error) {
    return <div className="container">Error: {error.message}</div>;
  }

  return (
    <Routes>
      {/* Root landing page: if logged in, show Home; otherwise, show Landing */}
      <Route
        path="/"
        element={
          user ? (
            <ProtectedRoute user={user}>
              <Home />
            </ProtectedRoute>
          ) : (
            <Landing />
          )
        }
      />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Other Protected Routes */}
      <Route
        path="/alarm"
        element={
          <ProtectedRoute user={user}>
            <Alarm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sleep-session"
        element={
          <ProtectedRoute user={user}>
            <SleepSession />
          </ProtectedRoute>
        }
      />

      {/* Catch-all: Redirect unknown routes to the landing page */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
