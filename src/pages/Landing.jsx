// src/pages/Landing.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase-config";
import ForgottenPasswordBtn from "./ForgottenPasswordBtn";

const Landing = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleShowLogin = () => setShowLogin(true);
  const handleCloseLogin = () => setShowLogin(false);

  const handleShowRegister = () => setShowRegister(true);
  const handleCloseRegister = () => setShowRegister(false);

  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Restful Sleep Tracker</h1>
      <p>Track your sleep patterns and improve your rest quality.</p>
      <div className="section">
        <button className="button button-blue" onClick={handleShowLogin}>
          Login
        </button>
        <button className="button button-green" onClick={handleShowRegister}>
          Register
        </button>

        {/* forget password button */}
        <Link to="/forgottenpasswordpage">
          <button className="button button-blue">Forgotten Password?</button>
        </Link>

      </div>
      {showLogin && <Login closeModal={handleCloseLogin} />}
      {showRegister && <Register closeModal={handleCloseRegister} />}
    </div>
  );
};

export default Landing;
