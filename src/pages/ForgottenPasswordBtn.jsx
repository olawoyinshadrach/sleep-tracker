import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ForgottenPasswordPage from './ForgottenPasswordPage';

const ForgottenPasswordBtn = () => {
  const navigate = useNavigate();

  const handleForgotPassword = () => {
    navigate('/forgot-password'); 
  };

  return (
    <>
        <Router>
            <Routes>
              <Route exact path="/forgottenpwdpage" element={<ForgottenPasswordPage />} />
            </Routes>
        </Router>
    </>
);

  return (
    <div>
      <button onClick={handleForgotPassword}>Forgotten Password?</button>
    </div>
  );
};

export default ForgottenPasswordBtn;