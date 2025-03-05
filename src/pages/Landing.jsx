// src/pages/Landing.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";

const Landing = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleShowLogin = () => setShowLogin(true);
  const handleCloseLogin = () => setShowLogin(false);

  const handleShowRegister = () => setShowRegister(true);
  const handleCloseRegister = () => setShowRegister(false);

  return (
    <div className="container">
      <h1>Welcome to Our App</h1>
      <p>Please log in or sign up to continue.</p>
      <div className="section">
        <button className="button button-blue" onClick={handleShowLogin}>
          Login
        </button>
        <button className="button button-green" onClick={handleShowRegister}>
          Register
        </button>
      </div>
      {showLogin && <Login closeModal={handleCloseLogin} />}
      {showRegister && <Register closeModal={handleCloseRegister} />}
    </div>
  );
};

export default Landing;
