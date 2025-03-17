import React, { useEffect, useState } from "react";
import { getUserSleepData } from "./sleepData";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase-config";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import AIInsights from "../components/AIInsights";
import SimpleCarousel from "../components/SimpleCarousel";
// import the new component
import RecommendedActions from "../components/RecommendedActions"; 
// import Toastify
import { ToastContainer } from "react-toastify";  


import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAlarm } from "../contexts/AlarmContext";
import "./Home.css"; // Import the Home CSS file

const Home = () => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [sleepData, setSleepData] = useState(null);
  const navigate = useNavigate();
  const [loadingTemp, setLoading] = useState(false);
  const { setAlarmTime } = useAlarm();

  // Color constants for charts
  const COLORS = {
    primary: "#8884d8",
    secondary: "#82ca9d",
    tertiary: "#ffc658",
    good: "#4CAF50",
    fair: "#FFC107",
    poor: "#F44336",
    deep: "#3F51B5",
    rem: "#673AB7",
    light: "#9C27B0",
    confident: "#4CAF50",    // High confidence
    moderate: "#FFC107",     // Medium confidence
    uncertain: "#F44336",    // Low confidence
  };

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/landing");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Fetch additional user details from Firestore once the user is authenticated
    if (user) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.log("No additional user data found.");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/landing"); // Redirect to landing page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const fetchSleepData = async () => {
      try {
        if (!user) return;

        setLoading(true);
        const data = await getUserSleepData(user.uid);
        setSleepData(data);
      } catch (error) {
        console.error("Error fetching sleep data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSleepData();
  }, [user]);

  // Get a color based on sleep quality score
  const getQualityColor = (quality) => {
    if (quality >= 70) return COLORS.good;
    if (quality >= 40) return COLORS.fair;
    return COLORS.poor;
  };

  // Get color based on confidence level
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return COLORS.confident;
    if (confidence >= 0.5) return COLORS.moderate;
    return COLORS.uncertain;
  };

  // Format confidence as percentage
  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Format date for axis labels
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Prepare data for sleep distribution pie chart
  const prepareSleepDistributionData = () => {
    if (!sleepData?.sleepDistribution) return [];

    return [
      {
        name: "Deep Sleep",
        value: sleepData.sleepDistribution.deep,
        color: COLORS.deep,
      },
      {
        name: "REM Sleep",
        value: sleepData.sleepDistribution.rem,
        color: COLORS.rem,
      },
      {
        name: "Light Sleep",
        value: sleepData.sleepDistribution.light,
        color: COLORS.light,
      },
    ];
  };

  if (loading) {
    return <div className="loading-container">Authenticating...</div>;
  }

  return (
    <div className="container">
      <h1>Sleep Dashboard</h1>

  {/* Toast Notifications */}
  <ToastContainer />

      {/* Display Recommended Actions if sleep data is available */}

      {sleepData && (
        <RecommendedActions 
          sleepDuration={sleepData.lastNight.sleepDuration} 
          sleepQuality={sleepData.lastNight.quality} 

          // For test manually
          // sleepDuration={4.0} 
          // sleepQuality={40} 
        />
      )}

      {userData && user && (
        <div className="user-summary">
          <h2>Hello, {userData.fullName}</h2>
          <div className="sleep-goal-indicator">
            <p>Your sleep goal: {userData.sleepGoal} hours</p>
            {sleepData && (
              <p>
                Last night:{" "}
                {Math.round(sleepData.lastNight.sleepDuration * 10) / 10} hours
                <span
                  className={
                    sleepData.lastNight.sleepDuration >= userData.sleepGoal
                      ? "goal-met"
                      : "goal-missed"
                  }
                >
                  {sleepData.lastNight.sleepDuration >= userData.sleepGoal
                    ? " ✅ Goal reached!"
                    : ` ⚠️ ${
                        Math.round(
                          (userData.sleepGoal -
                            sleepData.lastNight.sleepDuration) *
                            10
                        ) / 10
                      } hrs under goal`}
                </span>
              </p>
            )}
          </div>
          <button className="button button-red" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}

      {/* Replace Slider with SimpleCarousel */}
      <SimpleCarousel autoplayInterval={30000}>
        {/* AI Insights Card - Fixed className */}
        <div className="dashboard-card gen-ai-summary">
          <h3>AI Insights</h3>
          <AIInsights sleepData={sleepData} maxSentences={2} />
        </div>
        {/* Sleep Clock Card */}
        <div className="dashboard-card sleep-clock-card">
          <h3>Sleep Clock</h3>
          <div className="sleep-clock-preview">
            <p>Plan your sleep with our intelligent sleep calculator.</p>
            <p>
              Answer a few questions about your sleep habits to get personalized
              recommendations.
            </p>
            <button
              className="button button-blue"
              onClick={() => navigate("/sleep-clock")}
            >
              Open Sleep Calculator
            </button>
          </div>
        </div>
      </SimpleCarousel>

      {loadingTemp ? (
        <div className="loading-container">
          <p>Loading your sleep data...</p>
          {/* You could add a loading spinner here */}
        </div>
      ) : sleepData ? (
        <div className="dashboard-grid">
          {/* Sleep Quality Score Card */}
          {/* hello */}
          <div className="dashboard-card score-card">
            <h3>Sleep Score</h3>
            <div className="score-display">
              <div className="score-circle-container">
                <div
                  className="score-circle"
                  style={{
                    background: `conic-gradient(${getQualityColor(
                      sleepData.stats.sleepScore
                    )} ${sleepData.stats.sleepScore}%, var(--input-bg) 0)`,
                  }}
                >
                  <div className="score-circle-inner">
                    <span>{sleepData.stats.sleepScore}</span>
                  </div>
                </div>
              </div>
              <div className="score-details">
                <p className="score-label">
                  Your sleep health is{" "}
                  <span
                    className="score-quality-text"
                    style={{ color: getQualityColor(sleepData.stats.sleepScore) }}
                  >
                    {sleepData.stats.sleepScore >= 80
                      ? "Excellent"
                      : sleepData.stats.sleepScore >= 60
                      ? "Good"
                      : sleepData.stats.sleepScore >= 40
                      ? "Fair"
                      : "Poor"}
                  </span>
                </p>
                
                {/* Display prediction method and confidence */}
                {sleepData.stats.sleepScoreMethod && (
                  <div className="prediction-details">
                    <div className="prediction-method">
                      <span className={`prediction-badge ${sleepData.stats.sleepScoreMethod}`}>
                        {sleepData.stats.sleepScoreMethod === 'knn' ? 'AI Prediction' : 'Standard Calculation'}
                      </span>
                    </div>
                    
                    {sleepData.stats.sleepScoreMethod === 'knn' && sleepData.stats.sleepScoreConfidence && (
                      <div className="confidence-indicator">
                        <div className="confidence-bar">
                          <div 
                            className="confidence-level" 
                            style={{ 
                              width: formatConfidence(sleepData.stats.sleepScoreConfidence),
                              backgroundColor: getConfidenceColor(sleepData.stats.sleepScoreConfidence)
                            }}
                          ></div>
                        </div>
                        <span 
                          className="confidence-text"
                          style={{ color: getConfidenceColor(sleepData.stats.sleepScoreConfidence) }}
                        >
                          Confidence: {formatConfidence(sleepData.stats.sleepScoreConfidence)}
                        </span>
                      </div>
                    )}
                    
                    {sleepData.stats.sleepScoreMessage && (
                      <p className="prediction-message">{sleepData.stats.sleepScoreMessage}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sleep Duration Chart */}
          <div className="dashboard-card chart-card">
            <h3>Sleep Duration (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={sleepData.weeklyData}
                margin={{ top: 10, right: 25, bottom: 20, left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-color)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  label={{
                    value: "Hours",
                    angle: -90,
                    position: "insideLeft",
                    dy: 10,
                    dx: -5,
                    fontSize: 12,
                    fill: "var(--text-secondary)",
                  }}
                  domain={[
                    0,
                    Math.max(
                      userData?.sleepGoal ? userData.sleepGoal + 2 : 10,
                      10
                    ),
                  ]}
                  ticks={[0, 2, 4, 6, 8, 10, 12].filter(
                    (tick) =>
                      tick <=
                      (userData?.sleepGoal ? userData.sleepGoal + 2 : 10)
                  )}
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  tickMargin={5}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    color: "var(--text-primary)",
                  }}
                  formatter={(value) => [
                    `${Math.round(value * 10) / 10} hrs`,
                    "Sleep Duration",
                  ]}
                  isAnimationActive={false}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ paddingTop: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="sleepDuration"
                  stroke={COLORS.primary}
                  activeDot={{ r: 6, strokeWidth: 1, fill: COLORS.primary }}
                  name="Sleep Duration"
                  strokeWidth={2.5}
                  dot={{ stroke: "var(--card-bg)", strokeWidth: 1, r: 4 }}
                  animationDuration={1500}
                  connectNulls={true}
                />
                {userData?.sleepGoal && (
                  <Line
                    type="monotone"
                    data={sleepData.weeklyData.map((day) => ({
                      date: day.date,
                      goal: userData.sleepGoal,
                    }))}
                    dataKey="goal"
                    stroke={COLORS.tertiary}
                    strokeDasharray="5 5"
                    name="Sleep Goal"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sleep Quality Chart */}
          <div className="dashboard-card chart-card">
            <h3>Sleep Quality (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={sleepData.weeklyData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                <YAxis
                  label={{
                    value: "Quality Score",
                    angle: -90,
                    position: "insideLeft",
                    dy: -10,
                    dx: -25,
                    fontSize: 12,
                  }}
                  domain={[0, 100]}
                  tickCount={6}
                />
                <Tooltip formatter={(value) => [`${value}`, "Quality Score"]} />
                <Bar dataKey="quality" name="Sleep Quality" barSize={30}>
                  {sleepData.weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getQualityColor(entry.quality)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sleep Distribution Pie Chart */}
          <div className="dashboard-card chart-card">
            <h3>Average Sleep Composition</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={prepareSleepDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  innerRadius="50%"
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {prepareSleepDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} hours`, ""]} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Last Night Details */}
          <div className="dashboard-card last-night-card">
            <h3>Last Night Details</h3>
            <div className="sleep-details">
              <div className="detail-item">
                <span>Date:</span>
                <strong>
                  {new Date(sleepData.lastNight.date).toLocaleDateString()}
                </strong>
              </div>
              <div className="detail-item">
                <span>Bedtime:</span>
                <strong>{sleepData.lastNight.bedtime}</strong>
              </div>
              <div className="detail-item">
                <span>Wake time:</span>
                <strong>{sleepData.lastNight.wakeTime}</strong>
              </div>
              <div className="detail-item">
                <span>Total sleep:</span>
                <strong>
                  {Math.round(sleepData.lastNight.sleepDuration * 10) / 10}{" "}
                  hours
                </strong>
              </div>
              <div className="detail-item">
                <span>Interruptions:</span>
                <strong>{sleepData.lastNight.interruptions} time(s)</strong>
              </div>
              <div className="detail-item">
                <span>Quality:</span>
                <strong
                  style={{
                    color: getQualityColor(sleepData.lastNight.quality),
                  }}
                >
                  {sleepData.lastNight.sleepQuality}
                </strong>
              </div>
            </div>
          </div>

          {/* Sleep Stats Summary */}
          <div className="dashboard-card stats-summary-card">
            <h3>Your Sleep Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span>Average Duration</span>
                <strong>
                  {Math.round(sleepData.stats.averageSleepDuration * 10) / 10}{" "}
                  hours
                </strong>
              </div>
              <div className="stat-item">
                <span>Consistency</span>
                <strong>{sleepData.stats.sleepConsistency}</strong>
              </div>
              <div className="stat-item">
                <span>Sleep Debt</span>
                <strong>{sleepData.stats.sleepDebt} hours</strong>
              </div>
              <div className="stat-item">
                <span>Tracked Nights</span>
                <strong>{sleepData.stats.totalNightsTracked}</strong>
              </div>
              <div className="stat-item">
                <span>Recommended</span>
                <strong>{sleepData.stats.optimalSleepDuration} hours</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-container">
          <p>No sleep data found. Start tracking your sleep to see insights!</p>
        </div>
      )}

      <div className="action-buttons">
        <button
          className="button button-green"
          onClick={() => navigate("/alarm")}
        >
          Set Alarm
        </button>
        <button
          className="button button-blue"
          onClick={() => navigate("/sleep-session")}
        >
          Log Sleep Session
        </button>
        <button
          className="button button-purple"
          onClick={() => navigate("/sleep-clock")}
        >
          Smart Sleep Calculator
        </button>
      </div>
    </div>
  );
};

export default Home;
