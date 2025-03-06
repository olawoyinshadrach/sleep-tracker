import React, { createContext, useState, useContext, useEffect } from 'react';

const AlarmContext = createContext();

export const useAlarm = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }) => {
  const [alarmTime, setAlarmTime] = useState('');
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepStarted, setSleepStarted] = useState(false);
  
  // Load state from localStorage on component mount
  useEffect(() => {
    const savedAlarmState = localStorage.getItem('alarmState');
    if (savedAlarmState) {
      try {
        const parsedState = JSON.parse(savedAlarmState);
        setAlarmTime(parsedState.alarmTime || '');
        setIsAlarmSet(parsedState.isAlarmSet || false);
        setIsAlarmActive(parsedState.isAlarmActive || false);
        setBedtime(parsedState.bedtime || '');
        setSleepStarted(parsedState.sleepStarted || false);
      } catch (error) {
        console.error('Error parsing saved alarm state:', error);
      }
    }
  }, []);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isAlarmSet || sleepStarted) {
      const stateToSave = {
        alarmTime,
        isAlarmSet,
        isAlarmActive,
        bedtime,
        sleepStarted
      };
      localStorage.setItem('alarmState', JSON.stringify(stateToSave));
    }
  }, [alarmTime, isAlarmSet, isAlarmActive, bedtime, sleepStarted]);
  
  // Set up alarm checking interval
  useEffect(() => {
    let intervalId;
    
    if (isAlarmSet && !isAlarmActive) {
      intervalId = setInterval(() => {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        if (currentTime === alarmTime) {
          setIsAlarmActive(true);
          setWakeTime(currentTime);
          
          // Play alarm sound
          const audio = new Audio('/alarm-sound.mp3');
          audio.loop = true;
          audio.play().catch(error => {
            console.error('Failed to play alarm sound:', error);
          });
          
          // Store the audio reference so we can stop it later
          window.alarmAudio = audio;
        }
      }, 1000); // Check every second
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAlarmSet, isAlarmActive, alarmTime]);
  
  // Start sleep tracking
  const startSleepTracking = () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    setBedtime(currentTime);
    setSleepStarted(true);
    setIsAlarmSet(true);
  };
  
  // Stop sleep tracking
  const stopSleepTracking = (wasAlarmTriggered = false) => {
    if (!wasAlarmTriggered) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');
      setWakeTime(currentTime);
    }
    
    // Stop alarm sound if it's playing
    if (window.alarmAudio) {
      window.alarmAudio.pause();
      window.alarmAudio.currentTime = 0;
      window.alarmAudio = null;
    }
    
    setIsAlarmActive(false);
    setIsAlarmSet(false);
    setSleepStarted(false);
    
    // Clear localStorage
    localStorage.removeItem('alarmState');
    
    return {
      bedtime,
      wakeTime: wasAlarmTriggered ? alarmTime : wakeTime
    };
  };
  
  // Reset all state
  const resetAlarm = () => {
    setAlarmTime('');
    setIsAlarmSet(false);
    setIsAlarmActive(false);
    setBedtime('');
    setWakeTime('');
    setSleepStarted(false);
    localStorage.removeItem('alarmState');
    
    // Stop alarm sound if it's playing
    if (window.alarmAudio) {
      window.alarmAudio.pause();
      window.alarmAudio.currentTime = 0;
      window.alarmAudio = null;
    }
  };
  
  const value = {
    alarmTime,
    setAlarmTime,
    isAlarmSet,
    isAlarmActive,
    bedtime,
    wakeTime,
    sleepStarted,
    startSleepTracking,
    stopSleepTracking,
    resetAlarm
  };
  
  return (
    <AlarmContext.Provider value={value}>
      {children}
    </AlarmContext.Provider>
  );
};
