// src/pages/Register.jsx
import React, { useState } from "react";
import { auth } from "../firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Register = ({ closeModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Redirect to home after successful registration
      navigate("/");
      if (closeModal) closeModal();
    } catch (err) {
      let errorMessage = "";
      switch (err.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already in use.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        default:
          errorMessage = "Registration failed. Please try again.";
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="form section">
            <label>Email:</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form section">
            <label>Password:</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="section">
            <button className="button button-green" type="submit">
              Register
            </button>
            {closeModal && (
              <button
                className="button button-red"
                type="button"
                onClick={closeModal}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
