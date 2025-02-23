// SleepSession.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SleepSession = () => {
  const navigate = useNavigate();

  const handleEndSession = () => {
    // In a real app, you'd record session data and update the UI accordingly.
    alert('Sleep session ended. Data recorded (dummy).');
    navigate('/');
  };

  return (
    <div className="container">
      <h1>Sleep Session</h1>
      <p>Your sleep session has started. Relax and enjoy your sleep!</p>
      <button onClick={handleEndSession} className="button button-red">
        End Sleep Session
      </button>
    </div>
  );
};

export default SleepSession;
