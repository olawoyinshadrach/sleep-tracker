import React, { useState, useEffect } from "react";
import { model } from "../firebase-config"; // Import the model from firebase-config.js
import "./AIInsights.css";

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

const AIInsights = ({ sleepData, maxSentences = 2 }) => {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sleepData) return;

    // Function to check if cached insights are valid
    const getCachedInsights = () => {
      try {
        const cachedData = localStorage.getItem('sleepInsights');
        if (!cachedData) return null;

        const { insights, timestamp, sleepScore, averageDuration, sleepDebt } = JSON.parse(cachedData);
        
        // Check if cache has expired
        if (Date.now() - timestamp > CACHE_EXPIRATION) return null;
        
        // Check if sleep data has changed significantly
        if (
          Math.abs(sleepData.stats.sleepScore - sleepScore) > 5 ||
          Math.abs(sleepData.stats.averageSleepDuration - averageDuration) > 0.5 ||
          Math.abs(sleepData.stats.sleepDebt - sleepDebt) > 0.5
        ) {
          return null;
        }
        
        return insights;
      } catch (err) {
        console.error("Error reading cached insights:", err);
        return null;
      }
    };

    // Try to get insights from cache first
    const cachedInsights = getCachedInsights();
    if (cachedInsights) {
      setInsight(cachedInsights);
      return;
    }

    // Generate new insights if no valid cache exists
    const generateInsight = async () => {
      setLoading(true);
      setError(false);

      try {
        // Create a simple prompt based on the sleep data
        const prompt = `
          Based on this sleep data, provide ${maxSentences} simple sentence${maxSentences > 1 ? 's' : ''} of insight:
          - Average sleep duration: ${sleepData.stats.averageSleepDuration} hours
          - Sleep consistency: ${sleepData.stats.sleepConsistency}
          - Sleep quality: ${sleepData.stats.sleepScore}/100
          - Sleep debt: ${sleepData.stats.sleepDebt} hours
          - Last night's sleep: ${sleepData.lastNight.sleepDuration} hours

          The user will see your direct output of text, so please make sure to provide a clear and concise response.
          Avoid using any markdown or code formatting. Just plain text.
        `;

        // Generate content using the firebase model
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean and limit the response
        const cleanedText = text.trim();
        setInsight(cleanedText);
        
        // Cache the insights with metadata
        const cacheData = {
          insights: cleanedText,
          timestamp: Date.now(),
          sleepScore: sleepData.stats.sleepScore,
          averageDuration: sleepData.stats.averageSleepDuration,
          sleepDebt: sleepData.stats.sleepDebt
        };
        localStorage.setItem('sleepInsights', JSON.stringify(cacheData));
      } catch (err) {
        console.error("Error generating sleep insight:", err);
        setError(true);
        
        // Fallback to static insight if AI fails
        const staticInsight = getStaticInsight(sleepData);
        setInsight(staticInsight);
        
        // Cache the static insight too, but with shorter expiration
        const cacheData = {
          insights: staticInsight,
          timestamp: Date.now() - (CACHE_EXPIRATION / 2), // Set to expire in half the normal time
          sleepScore: sleepData.stats.sleepScore,
          averageDuration: sleepData.stats.averageSleepDuration,
          sleepDebt: sleepData.stats.sleepDebt
        };
        localStorage.setItem('sleepInsights', JSON.stringify(cacheData));
      } finally {
        setLoading(false);
      }
    };

    generateInsight();
  }, [sleepData, maxSentences]);

  // Fallback function for static insights
  const getStaticInsight = (data) => {
    if (data.stats.averageSleepDuration < 7) {
      return "You're getting less sleep than recommended, try to increase your sleep time for better health.";
    } else {
      return "You're getting a healthy amount of sleep, keep up the good habits.";
    }
  };

  if (!sleepData) {
    return <p>Collecting insights about your sleep patterns...</p>;
  }

  if (loading) {
    return <p>Analyzing your sleep data...</p>;
  }

  return (
    <div className="ai-insights-container">
      <p>{insight || getStaticInsight(sleepData)}</p>
      {error && <small className="ai-error-note">(Using backup insight system)</small>}
    </div>
  );
};

export default AIInsights;