import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase-config";
import { addSleepEntry } from "./sleepData";
import { useAlarm } from "../contexts/AlarmContext";

const SleepSession = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const { resetAlarm } = useAlarm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bedtime, setBedtime] = useState("22:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState(70);
  const [interruptions, setInterruptions] = useState(0);
  const [deepSleep, setDeepSleep] = useState(1.5);
  const [remSleep, setRemSleep] = useState(1.5);
  const [notes, setNotes] = useState("");
  
  // Check for pre-populated data from alarm tracking
  useEffect(() => {
    if (location.state?.sleepData) {
      const { bedtime: trackedBedtime, wakeTime: trackedWakeTime } = location.state.sleepData;
      
      if (trackedBedtime) {
        setBedtime(trackedBedtime);
      }
      
      if (trackedWakeTime) {
        setWakeTime(trackedWakeTime);
      }
      
      // Reset alarm context since we've consumed the data
      resetAlarm();
    }
  }, [location.state, resetAlarm]);
  
  const calculateSleepDuration = () => {
    try {
      const [bedHours, bedMinutes] = bedtime.split(":").map(Number);
      const [wakeHours, wakeMinutes] = wakeTime.split(":").map(Number);
      
      let duration = 0;
      
      // Convert to minutes since midnight
      const bedTimeMinutes = bedHours * 60 + bedMinutes;
      const wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
      
      // Calculate difference accounting for next-day wake up
      if (wakeTimeMinutes < bedTimeMinutes) {
        // If wake time is earlier in the day than bedtime
        duration = (24 * 60 - bedTimeMinutes) + wakeTimeMinutes;
      } else {
        duration = wakeTimeMinutes - bedTimeMinutes;
      }
      
      // Convert back to hours
      return Math.round((duration / 60) * 10) / 10;
    } catch (error) {
      console.error("Error calculating sleep duration:", error);
      return 0;
    }
  };
  
  // Automatically adjust sleep phases based on duration
  useEffect(() => {
    const duration = calculateSleepDuration();
    
    // Typical sleep cycle distribution: ~20% deep, ~25% REM, ~55% light
    // Adjust only if we have alarm tracking data (to avoid resetting manual inputs)
    if (location.state?.sleepData) {
      const estimatedDeep = Math.round(duration * 0.2 * 10) / 10;
      const estimatedRem = Math.round(duration * 0.25 * 10) / 10;
      
      setDeepSleep(estimatedDeep);
      setRemSleep(estimatedRem);
    }
  }, [bedtime, wakeTime, location.state]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to add sleep data.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Calculate sleep duration from bedtime and wake time
      const sleepDuration = calculateSleepDuration();
      
      // Calculate light sleep (total - (deep + rem))
      const lightSleep = Math.max(0, sleepDuration - (deepSleep + remSleep));
      
      // Prepare sleep entry object
      const sleepEntry = {
        userId: user.uid,
        date, // This will be converted to Timestamp in addSleepEntry
        bedtime,
        wakeTime,
        sleepDuration,
        quality: parseInt(quality),
        interruptions: parseInt(interruptions),
        deepSleep: parseFloat(deepSleep),
        remSleep: parseFloat(remSleep),
        lightSleep,
        notes,
        // Track whether this entry came from alarm tracking
        fromAlarmTracking: Boolean(location.state?.sleepData)
      };
      
      await addSleepEntry(sleepEntry);
      
      // Navigate back to home after successful submission
      navigate("/");
    } catch (error) {
      console.error("Error adding sleep entry:", error);
      setError("Failed to save sleep data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container">
      <h1>Log Sleep Session</h1>
      
      {location.state?.sleepData && (
        <div className="tracked-sleep-notice">
          <p>Your sleep has been tracked from {bedtime} to {wakeTime}. Please review and complete the details below.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="sleep-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bedtime">Bedtime:</label>
            <input
              type="time"
              id="bedtime"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="wakeTime">Wake time:</label>
            <input
              type="time"
              id="wakeTime"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Sleep Duration (calculated):</label>
            <div className="calculated-value">{calculateSleepDuration()} hours</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="quality">Sleep Quality:</label>
            <div className="range-with-value">
              <input
                type="range"
                id="quality"
                min="0"
                max="100"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              />
              <span>{quality} ({quality > 70 ? 'Good' : quality > 40 ? 'Fair' : 'Poor'})</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="interruptions">Interruptions:</label>
            <select
              id="interruptions"
              value={interruptions}
              onChange={(e) => setInterruptions(e.target.value)}
            >
              <option value="0">None</option>
              <option value="1">1 time</option>
              <option value="2">2 times</option>
              <option value="3">3 times</option>
              <option value="4">4+ times</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="deepSleep">Deep Sleep (hours):</label>
            <input
              type="number"
              id="deepSleep"
              min="0"
              max="12"
              step="0.1"
              value={deepSleep}
              onChange={(e) => setDeepSleep(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="remSleep">REM Sleep (hours):</label>
            <input
              type="number"
              id="remSleep"
              min="0"
              max="12"
              step="0.1"
              value={remSleep}
              onChange={(e) => setRemSleep(e.target.value)}
            />
          </div>
        </div>
        
        <div className="form-group full-width">
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about your sleep? (e.g., stress levels, caffeine intake, etc.)"
            rows="3"
          ></textarea>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="button-group">
          <button type="submit" className="button button-green" disabled={loading}>
            {loading ? "Saving..." : "Save Sleep Data"}
          </button>
          <button 
            type="button" 
            className="button button-red"
            onClick={() => navigate("/")}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SleepSession;
