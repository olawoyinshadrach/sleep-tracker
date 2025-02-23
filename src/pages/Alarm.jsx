// Alarm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Alarm = () => {
  const [alarmTime, setAlarmTime] = useState('');
  const navigate = useNavigate();

  const handleAlarmSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd set the alarm via a backend or native functionality.
    alert(`Alarm set for ${alarmTime}. Starting sleep session...`);
    navigate('/sleep-session');
  };

  return (
    <div className="container">
      <h1>Set Your Alarm</h1>
      <form className="form" onSubmit={handleAlarmSubmit}>
        <label>
          Alarm Time:
          <input 
            type="time" 
            value={alarmTime} 
            onChange={(e) => setAlarmTime(e.target.value)}
            required
            className="input"
          />
        </label>
        <button type="submit" className="button button-blue">
          Set Alarm & Start Sleep Session
        </button>
      </form>
    </div>
  );
};

export default Alarm;
