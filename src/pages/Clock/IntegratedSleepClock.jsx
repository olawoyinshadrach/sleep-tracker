import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase-config";
import { useAlarm } from "../../contexts/AlarmContext";
import "./sleepClock.css"; // We'll create this CSS file

const IntegratedSleepClock = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { setAlarmTime, startSleepTracking, storeSleepRecommendations } = useAlarm();
  
  // UI state
  const [currentView, setCurrentView] = useState("questionnaire"); // ["questionnaire", "calculator", "alarm"]
  const [currentTime, setCurrentTime] = useState("");
  
  // Clock state
  const [bedtime, setBedtime] = useState("");
  const [sleepHours, setSleepHours] = useState(8);
  const [fallAsleepTime, setFallAsleepTime] = useState(15);
  const [wakeTime, setWakeTime] = useState("");
  
  // Questionnaire state
  const [questionnaire, setQuestionnaire] = useState({
    sleepQuality: "",
    restedFeeling: "",
    fallAsleepTime: "",
    nightWakeups: "",
    caffeine: ""
  });
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  const [recommendedSleepHours, setRecommendedSleepHours] = useState(8);
  const [suggestedBedtime, setSuggestedBedtime] = useState("");
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.getHours().toString().padStart(2, '0') + ':' + 
        now.getMinutes().toString().padStart(2, '0')
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Calculate wake time based on bedtime, sleep hours, and time to fall asleep
  const calculateWakeTime = () => {
    if (!bedtime) return;

    const [hours, minutes] = bedtime.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes + sleepHours * 60 + fallAsleepTime;

    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60; // Adjust for next day

    const wakeHours = Math.floor(totalMinutes / 60) % 24;
    const wakeMinutes = totalMinutes % 60;
    const formattedTime = `${String(wakeHours).padStart(2, "0")}:${String(wakeMinutes).padStart(2, "0")}`;
    setWakeTime(formattedTime);
  };

  // Analyze questionnaire and recommend sleep settings
  const analyzeQuestionnaire = () => {
    let recommendedHours = 8; // Default
    let recommendedBedtimeHour = 22; // Default 10:00 PM
    
    // Adjust based on sleep quality
    if (questionnaire.sleepQuality === "Very Bad" || questionnaire.sleepQuality === "Bad") {
      recommendedHours += 1;
      recommendedBedtimeHour -= 1;
    }

    // Adjust based on rested feeling
    if (questionnaire.restedFeeling === "Very Bad" || questionnaire.restedFeeling === "Bad") {
      recommendedHours += 0.5;
    }

    // Adjust based on time to fall asleep
    if (questionnaire.fallAsleepTime === "More than 25 min") {
      recommendedBedtimeHour -= 0.5;
      setFallAsleepTime(30); // Set fall asleep time to 30 minutes
    } else if (questionnaire.fallAsleepTime === "20 min") {
      setFallAsleepTime(20);
    } else if (questionnaire.fallAsleepTime === "15 min") {
      setFallAsleepTime(15);
    } else {
      setFallAsleepTime(10);
    }

    // Adjust based on night wakeups
    if (questionnaire.nightWakeups === "3-4 times" || questionnaire.nightWakeups === "5+ times") {
      recommendedHours += 0.5;
    }

    // Keep sleep hours within reasonable range (6-10)
    recommendedHours = Math.min(Math.max(recommendedHours, 6), 10);
    setRecommendedSleepHours(recommendedHours);
    setSleepHours(recommendedHours);
    
    // Format suggested bedtime
    const bedHour = Math.floor(recommendedBedtimeHour);
    const bedMinutes = Math.round((recommendedBedtimeHour - bedHour) * 60);
    const formattedBedtime = `${String(bedHour).padStart(2, '0')}:${String(bedMinutes).padStart(2, '0')}`;
    setSuggestedBedtime(formattedBedtime);
    setBedtime(formattedBedtime);
    
    // Calculate wake time based on the recommendations
    setTimeout(() => calculateWakeTime(), 100);
    
    // Store recommendations in context for other components
    storeSleepRecommendations({
      suggestedBedtime: formattedBedtime,
      recommendedSleepHours: recommendedHours,
      fallAsleepTime: fallAsleepTime
    });
    
    setIsQuestionnaireCompleted(true);
    setCurrentView("calculator");
  };

  // Handle setting the alarm
  const handleSetAlarm = () => {
    if (!wakeTime) {
      calculateWakeTime();
      return;
    }
    
    setAlarmTime(wakeTime);
    startSleepTracking(bedtime);
    navigate("/alarm");
  };
  
  // Handle starting sleep session
  const handleLogSleepSession = () => {
    navigate("/sleep-session", { 
      state: { 
        sleepRecommendations: {
          suggestedBedtime,
          recommendedSleepHours,
          wakeTime
        }
      }
    });
  };

  return (
    <div className="container">
      <div className="header-with-nav">
        <h1>Smart Sleep Calculator</h1>
        <button className="button button-sm" onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
      
      <div className="sleep-clock-container">
        <h1 className="sleep-clock-title">Smart Sleep Calculator</h1>
        
        {/* Navigation tabs */}
        <div className="sleep-clock-tabs">
          <button 
            className={`tab ${currentView === "questionnaire" ? "active" : ""}`}
            onClick={() => setCurrentView("questionnaire")}
          >
            Sleep Assessment
          </button>
          <button 
            className={`tab ${currentView === "calculator" ? "active" : ""}`}
            onClick={() => setCurrentView("calculator")}
            disabled={!isQuestionnaireCompleted}
          >
            Sleep Calculator
          </button>
          <button 
            className={`tab ${currentView === "alarm" ? "active" : ""}`}
            onClick={() => setCurrentView("alarm")}
            disabled={!wakeTime}
          >
            Set Alarm
          </button>
        </div>
        
        <div className="sleep-clock-content">
          {/* Current time display */}
          <div className="current-time">
            <span>Current Time: {currentTime}</span>
          </div>
          
          {/* Questionnaire View */}
          {currentView === "questionnaire" && (
            <div className="questionnaire-section">
              <h2>Sleep Assessment</h2>
              <p>Answer these questions to get personalized sleep recommendations:</p>
              
              <div className="question">
                <label>How would you rate your overall sleep quality?</label>
                <div className="options">
                  {["Very Bad", "Bad", "Neutral", "Good", "Excellent"].map((option) => (
                    <label key={option} className="radio-option">
                      <input
                        type="radio"
                        name="sleepQuality"
                        value={option}
                        checked={questionnaire.sleepQuality === option}
                        onChange={() => setQuestionnaire({...questionnaire, sleepQuality: option})}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="question">
                <label>How rested do you feel upon waking up?</label>
                <div className="options">
                  {["Very Bad", "Bad", "Neutral", "Good", "Excellent"].map((option) => (
                    <label key={option} className="radio-option">
                      <input
                        type="radio"
                        name="restedFeeling"
                        value={option}
                        checked={questionnaire.restedFeeling === option}
                        onChange={() => setQuestionnaire({...questionnaire, restedFeeling: option})}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="question">
                <label>How long do you typically take to fall asleep?</label>
                <div className="options">
                  {["5 min", "10 min", "15 min", "20 min", "More than 25 min"].map((option) => (
                    <label key={option} className="radio-option">
                      <input
                        type="radio"
                        name="fallAsleepTime"
                        value={option}
                        checked={questionnaire.fallAsleepTime === option}
                        onChange={() => setQuestionnaire({...questionnaire, fallAsleepTime: option})}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="question">
                <label>How many times do you wake up during the night?</label>
                <div className="options">
                  {["Not at all", "1-2 times", "3-4 times", "5+ times", "Don't know"].map((option) => (
                    <label key={option} className="radio-option">
                      <input
                        type="radio"
                        name="nightWakeups"
                        value={option}
                        checked={questionnaire.nightWakeups === option}
                        onChange={() => setQuestionnaire({...questionnaire, nightWakeups: option})}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="question">
                <label>Do you consume caffeine before bed?</label>
                <div className="options">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="radio-option">
                      <input
                        type="radio"
                        name="caffeine"
                        value={option}
                        checked={questionnaire.caffeine === option}
                        onChange={() => setQuestionnaire({...questionnaire, caffeine: option})}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button 
                className="primary-button"
                onClick={analyzeQuestionnaire}
                disabled={!questionnaire.sleepQuality || !questionnaire.restedFeeling || 
                  !questionnaire.fallAsleepTime || !questionnaire.nightWakeups || !questionnaire.caffeine}
              >
                Get Sleep Recommendations
              </button>
            </div>
          )}
          
          {/* Calculator View */}
          {currentView === "calculator" && (
            <div className="calculator-section">
              <h2>Sleep Calculator</h2>
              
              {isQuestionnaireCompleted && (
                <div className="recommendation-box">
                  <h3>Your Sleep Recommendations</h3>
                  <p><strong>Suggested bedtime:</strong> {suggestedBedtime}</p>
                  <p><strong>Recommended sleep hours:</strong> {recommendedSleepHours}</p>
                  {wakeTime && <p><strong>Calculated wake time:</strong> {wakeTime}</p>}
                </div>
              )}
              
              <div className="calculator-form">
                <div className="form-group">
                  <label htmlFor="bedtime">Bedtime:</label>
                  <input
                    type="time"
                    id="bedtime"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="time-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="sleepHours">Hours of Sleep:</label>
                  <input
                    type="number"
                    id="sleepHours"
                    min="4"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="number-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="fallAsleepTime">Minutes to fall asleep:</label>
                  <input
                    type="number"
                    id="fallAsleepTime"
                    min="0"
                    max="60"
                    value={fallAsleepTime}
                    onChange={(e) => setFallAsleepTime(parseInt(e.target.value))}
                    className="number-input"
                  />
                </div>
                
                <button 
                  className="primary-button"
                  onClick={calculateWakeTime}
                >
                  Calculate Wake Time
                </button>
              </div>
              
              {wakeTime && (
                <div className="result-section">
                  <h3>Wake-up time: {wakeTime}</h3>
                  <div className="action-buttons">
                    <button 
                      className="secondary-button"
                      onClick={() => setCurrentView("alarm")}
                    >
                      Set Alarm For This Time
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Alarm View */}
          {currentView === "alarm" && (
            <div className="alarm-section">
              <h2>Set Sleep Alarm</h2>
              
              <div className="alarm-summary">
                <div className="summary-item">
                  <span>Bedtime:</span>
                  <span className="value">{bedtime}</span>
                </div>
                <div className="summary-item">
                  <span>Wake Time:</span>
                  <span className="value">{wakeTime}</span>
                </div>
                <div className="summary-item">
                  <span>Total Sleep:</span>
                  <span className="value">{sleepHours} hours</span>
                </div>
              </div>
              
              <p className="alarm-description">
                When you set your alarm, sleep tracking will begin. The app will record your sleep data
                and wake you up at the specified time.
              </p>
              
              <div className="alarm-buttons">
                <button 
                  className="primary-button"
                  onClick={handleSetAlarm}
                >
                  Start Sleep Tracking & Set Alarm
                </button>
                
                <button 
                  className="secondary-button"
                  onClick={handleLogSleepSession}
                >
                  Log Sleep Manually Instead
                </button>
                
                <button
                  className="tertiary-button"
                  onClick={() => navigate("/")}
                >
                  Cancel & Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegratedSleepClock;
