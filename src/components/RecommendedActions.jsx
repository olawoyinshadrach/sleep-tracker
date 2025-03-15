import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RecommendedActions = ({ sleepDuration, sleepQuality }) => {
  const NHS_SLEEP_GUIDE = "https://www.nhs.uk/live-well/sleep-and-tiredness/";
  const isPoorSleep = sleepDuration < 5 || sleepQuality < 50;

  // using local storage to prevent duplicate notifications
  const [notified, setNotified] = useState(localStorage.getItem("sleepWarning") === "true");

  useEffect(() => {
    if (isPoorSleep && !notified) {
      toast.warn(
        `⚠️ Poor Sleep Detected: Only ${sleepDuration}h sleep & ${sleepQuality}% quality`,
        { position: "top-right", autoClose: 8000 }
      );
      // store the notification state
      localStorage.setItem("sleepWarning", "true"); 
      setNotified(true);
    }
  }, [isPoorSleep, sleepDuration, sleepQuality, notified]);

  return (
    <div className="recommended-actions">
      {isPoorSleep && (
        <div className="warning-box">
          <h3>⚠️ Your Sleep Quality Needs Improvement</h3>
          <p>
            You slept for <strong>{sleepDuration} hours</strong> with a sleep quality of 
            <strong> {sleepQuality}%</strong>. Poor sleep can affect memory, stress levels, and health.
          </p>
          <p>
            Read more about better sleep on the 
            <a href={NHS_SLEEP_GUIDE} target="_blank" rel="noopener noreferrer"> NHS Sleep Guide</a>.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedActions;
