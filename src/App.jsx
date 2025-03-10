// src/App.jsx
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import SleepSession from "./pages/SleepSession";
import Alarm from "./pages/Alarm";
import { AlarmProvider } from "./contexts/AlarmContext";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase-config";

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <AlarmProvider>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sleep-session" 
            element={
              <ProtectedRoute>
                <SleepSession />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alarm" 
            element={
              <ProtectedRoute>
                <Alarm />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect root to home if authenticated, otherwise to landing */}
          <Route 
            path="*" 
            element={user ? <Navigate to="/" /> : <Navigate to="/landing" />} 
          />
        </Routes>
      </div>
    </AlarmProvider>
  );
}

export default App;
