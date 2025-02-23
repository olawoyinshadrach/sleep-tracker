// Home.js
import React, { useEffect, useState } from "react";
import { getUserSleepData } from "./sleepData"; // dummy function returning sleep data
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [sleepData, setSleepData] = useState(null);
  const userID = "dummyUserID"; // Replace with actual user ID as needed
  const navigate = useNavigate();

  useEffect(() => {
    const data = getUserSleepData(userID);
    setSleepData(data);
  }, [userID]);

  return (
    <div className="container">
      <h1>Welcome to the Restful Sleep Tracker!</h1>
      
      <div className="section">
        <h2>Last Night&apos;s Sleep Data</h2>
        {sleepData ? (
          <div className="card">
            <p><strong>Date:</strong> {sleepData.lastNight.date}</p>
            <p>
              <strong>Sleep Duration:</strong> {sleepData.lastNight.sleepDuration} hours
            </p>
            <p>
              <strong>Sleep Quality:</strong> {sleepData.lastNight.sleepQuality}
            </p>
          </div>
        ) : (
          <p>Loading sleep data...</p>
        )}
      </div>
      
      <div className="section">
        <h2>Sleep Stats</h2>
        {sleepData ? (
          <div className="card">
            <p>
              <strong>Average Sleep Duration:</strong> {sleepData.stats.averageSleepDuration} hours
            </p>
            <p>
              <strong>Sleep Consistency:</strong> {sleepData.stats.sleepConsistency}
            </p>
            <p>
              <strong>Total Nights Tracked:</strong> {sleepData.stats.totalNightsTracked}
            </p>
          </div>
        ) : (
          <p>Loading stats...</p>
        )}
      </div>
      
      <button
        className="button button-green"
        onClick={() => navigate('/alarm')}
      >
        Set Alarm
      </button>
      <button
        className="button button-green"
        onClick={() => alert("Add Sleep Tracking Form (Not implemented)")}
      >
        Add Sleep Tracking
      </button>
    </div>
  );
};

export default Home;