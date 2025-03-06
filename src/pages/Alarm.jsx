// Alarm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlarm } from '../contexts/AlarmContext';

const Alarm = () => {
  const navigate = useNavigate();
  const { 
    alarmTime, 
    setAlarmTime, 
    isAlarmSet, 
    isAlarmActive,
    bedtime,
    sleepStarted,
    startSleepTracking, 
    stopSleepTracking,
    resetAlarm
  } = useAlarm();
  
  const [currentTime, setCurrentTime] = useState('');
  const [sleepDuration, setSleepDuration] = useState(0);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.getHours().toString().padStart(2, '0') + ':' + 
        now.getMinutes().toString().padStart(2, '0') + ':' + 
        now.getSeconds().toString().padStart(2, '0')
      );
      
      // Calculate sleep duration if sleep is being tracked
      if (sleepStarted && bedtime) {
        const bedtimeParts = bedtime.split(':').map(Number);
        const nowHours = now.getHours();
        const nowMinutes = now.getMinutes();
        
        let durationMinutes = 0;
        
        // Calculate minutes since bedtime
        if (nowHours < bedtimeParts[0] || (nowHours === bedtimeParts[0] && nowMinutes < bedtimeParts[1])) {
          // Next day case
          durationMinutes = ((nowHours + 24) * 60 + nowMinutes) - (bedtimeParts[0] * 60 + bedtimeParts[1]);
        } else {
          // Same day case
          durationMinutes = (nowHours * 60 + nowMinutes) - (bedtimeParts[0] * 60 + bedtimeParts[1]);
        }
        
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        setSleepDuration(`${hours}h ${minutes}m`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sleepStarted, bedtime]);
  
  // Handle alarm triggering
  useEffect(() => {
    if (isAlarmActive) {
      handleAlarmTriggered();
    }
  }, [isAlarmActive]);
  
  const handleSetAlarm = (e) => {
    e.preventDefault();
    startSleepTracking();
  };
  
  const handleStopTracking = () => {
    const sleepData = stopSleepTracking();
    navigate('/sleep-session', { state: { sleepData } });
  };
  
  const handleAlarmTriggered = () => {
    const sleepData = stopSleepTracking(true);
    navigate('/sleep-session', { state: { sleepData } });
  };
  
  return (
    <div className="container">
      <h1>Sleep Alarm</h1>
      
      {!sleepStarted ? (
        // Alarm setting form
        <div className="alarm-setup">
          <div className="current-time-display">
            <h2>Current Time: {currentTime}</h2>
          </div>
          
          <form className="form" onSubmit={handleSetAlarm}>
            <div className="form-group">
              <label htmlFor="alarmTime">Set Wake-up Time:</label>
              <input 
                type="time" 
                id="alarmTime"
                value={alarmTime} 
                onChange={(e) => setAlarmTime(e.target.value)}
                required
                className="input"
              />
            </div>
            
            <div className="instruction-text">
              <p>Set your alarm time and go to sleep. We'll track your sleep duration 
              and wake you up at the specified time.</p>
            </div>
            
            <button type="submit" className="button button-blue">
              Set Alarm & Start Sleep Tracking
            </button>
            
            <button 
              type="button" 
              className="button button-red"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </form>
        </div>
      ) : (
        // Sleep tracking in progress
        <div className="sleep-tracking">
          <div className="tracking-info">
            <h2>Sleep Tracking Active</h2>
            <div className="time-display">
              <p><strong>Current Time:</strong> {currentTime}</p>
              <p><strong>Bedtime:</strong> {bedtime}</p>
              <p><strong>Wake-up Time:</strong> {alarmTime}</p>
              <p><strong>Sleep Duration:</strong> {sleepDuration}</p>
            </div>
          </div>
          
          <div className="alarm-status">
            <div className="status-indicator">
              {isAlarmActive ? (
                <div className="alarm-active">
                  <h3>WAKE UP! 🔔</h3>
                  <p>Your alarm is ringing!</p>
                </div>
              ) : (
                <div className="alarm-waiting">
                  <h3>Sleep Well 💤</h3>
                  <p>Your alarm is set for {alarmTime}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="button button-red"
              onClick={handleStopTracking}
            >
              {isAlarmActive ? 'Stop Alarm' : 'End Sleep Early'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alarm;
