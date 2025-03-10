import React, { createContext, useContext, useState, useEffect } from "react";

const AlarmContext = createContext();

export function useAlarm() {
  return useContext(AlarmContext);
}

export function AlarmProvider({ children }) {
  // State for alarm functionality
  const [alarmTime, setAlarmTime] = useState("");
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [alarmAudio] = useState(new Audio("https://www.soundjay.com/button/beep-07.wav"));
  const [bedtime, setBedtime] = useState("");
  const [sleepStarted, setSleepStarted] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState(null);
  const [recommendedSleepHours, setRecommendedSleepHours] = useState(8);
  const [sleepRecommendations, setSleepRecommendations] = useState(null);

  // Check if alarm should be triggered
  useEffect(() => {
    let interval;
    
    if (isAlarmSet) {
      interval = setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const [alarmHour, alarmMinute] = alarmTime.split(':').map(Number);
        
        if (currentHour === alarmHour && currentMinute === alarmMinute) {
          setIsAlarmActive(true);
          alarmAudio.loop = true;
          alarmAudio.play();
        }
      }, 1000);
    }
    
    return () => {
      clearInterval(interval);
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    };
  }, [isAlarmSet, alarmTime, alarmAudio]);

  // Start sleep tracking
  const startSleepTracking = (customBedtime = null) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    
    // Use provided bedtime or current time
    const startBedtime = customBedtime || currentTime;
    
    setBedtime(startBedtime);
    setSleepStartTime(now);
    setSleepStarted(true);
    setIsAlarmSet(true);
    console.log(`Sleep tracking started at ${startBedtime}`);
  };

  // Stop sleep tracking and return sleep data
  const stopSleepTracking = (alarmTriggered = false) => {
    setIsAlarmSet(false);
    setIsAlarmActive(false);
    setSleepStarted(false);
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    
    const now = new Date();
    const wakeTime = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0');
    
    // Calculate sleep metrics
    const sleepDuration = sleepStartTime ? 
      (now - sleepStartTime) / (1000 * 60 * 60) : null;
    
    console.log(`Sleep tracking stopped at ${wakeTime}`);
    console.log(`Total sleep time: ${sleepDuration ? sleepDuration.toFixed(2) + ' hours' : 'Unknown'}`);
    
    // Return data for logging in Sleep Session
    return {
      bedtime,
      wakeTime,
      sleepDuration: sleepDuration ? parseFloat(sleepDuration.toFixed(2)) : null,
      recommendedSleepHours
    };
  };

  // Reset all alarm and tracking state
  const resetAlarm = () => {
    setAlarmTime("");
    setIsAlarmSet(false);
    setIsAlarmActive(false);
    setBedtime("");
    setSleepStarted(false);
    setSleepStartTime(null);
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  };
  
  // Store sleep recommendations from the integrated sleep clock
  const storeSleepRecommendations = (recommendations) => {
    setSleepRecommendations(recommendations);
    
    if (recommendations.recommendedSleepHours) {
      setRecommendedSleepHours(recommendations.recommendedSleepHours);
    }
  };

  return (
    <AlarmContext.Provider
      value={{
        alarmTime,
        setAlarmTime,
        isAlarmSet,
        isAlarmActive,
        bedtime,
        sleepStarted,
        startSleepTracking,
        stopSleepTracking,
        resetAlarm,
        recommendedSleepHours,
        setRecommendedSleepHours,
        sleepRecommendations,
        storeSleepRecommendations
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}
