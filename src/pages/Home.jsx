import React, { useEffect, useState } from "react";
import { getUserSleepData } from "./sleepData";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase-config";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';

const Home = () => {
  const [user, loading, error] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [sleepData, setSleepData] = useState(null);
  const userID = "dummyUserID"; // Replace with actual user ID as needed
  const navigate = useNavigate();
  const [loadingTemp, setLoading] = useState(false);

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
  };

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
      navigate("/"); // Redirect to landing page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const fetchSleepData = async () => {
      try {
        setLoading(true);
        // Use the actual user ID if available, otherwise use the dummy one
        const userId = user?.uid || userID;
        const data = await getUserSleepData(userId);
        setSleepData(data);
      } catch (error) {
        console.error("Error fetching sleep data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSleepData();
  }, [userID, user]);

  // Get a color based on sleep quality score
  const getQualityColor = (quality) => {
    if (quality >= 70) return COLORS.good;
    if (quality >= 40) return COLORS.fair;
    return COLORS.poor;
  };

  // Format date for axis labels
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Prepare data for sleep distribution pie chart
  const prepareSleepDistributionData = () => {
    if (!sleepData?.sleepDistribution) return [];
    
    return [
      { name: 'Deep Sleep', value: sleepData.sleepDistribution.deep, color: COLORS.deep },
      { name: 'REM Sleep', value: sleepData.sleepDistribution.rem, color: COLORS.rem },
      { name: 'Light Sleep', value: sleepData.sleepDistribution.light, color: COLORS.light }
    ];
  };

  return (
    <div className="container">
      <h1>Sleep Dashboard</h1>
      
      {userData && user && (
        <div className="user-summary">
          <h2>Hello, {userData.fullName}</h2>
          <div className="sleep-goal-indicator">
            <p>Your sleep goal: {userData.sleepGoal} hours</p>
            {sleepData && (
              <p>
                Last night: {Math.round(sleepData.lastNight.sleepDuration * 10) / 10} hours
                <span className={
                  sleepData.lastNight.sleepDuration >= userData.sleepGoal
                    ? "goal-met"
                    : "goal-missed"
                }>
                  {sleepData.lastNight.sleepDuration >= userData.sleepGoal
                    ? " ✅ Goal reached!"
                    : ` ⚠️ ${Math.round((userData.sleepGoal - sleepData.lastNight.sleepDuration) * 10) / 10} hrs under goal`
                  }
                </span>
              </p>
            )}
          </div>
          <button className="button button-red" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}

      {loadingTemp ? (
        <div className="loading-container">
          <p>Loading your sleep data...</p>
          {/* You could add a loading spinner here */}
        </div>
      ) : sleepData ? (
        <div className="dashboard-grid">
          {/* Sleep Quality Score Card */}
          <div className="dashboard-card score-card">
            <h3>Sleep Score</h3>
            <div className="score-display">
              <div 
                className="score-circle" 
                style={{ 
                  background: `conic-gradient(${getQualityColor(sleepData.stats.sleepScore)} ${sleepData.stats.sleepScore}%, #e0e0e0 0)` 
                }}
              >
                <span>{sleepData.stats.sleepScore}</span>
              </div>
              <p>Your sleep health is {
                sleepData.stats.sleepScore >= 80 ? "Excellent" :
                sleepData.stats.sleepScore >= 60 ? "Good" :
                sleepData.stats.sleepScore >= 40 ? "Fair" : "Poor"
              }</p>
            </div>
          </div>

          {/* Sleep Duration Chart */}
          <div className="dashboard-card chart-card">
            <h3>Sleep Duration (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sleepData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDateLabel}
                />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${Math.round(value * 10) / 10} hrs`, "Sleep Duration"]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sleepDuration" 
                  stroke={COLORS.primary} 
                  activeDot={{ r: 8 }}
                  name="Sleep Duration" 
                />
                {userData?.sleepGoal && (
                  <Line 
                    type="monotone" 
                    data={sleepData.weeklyData.map(day => ({ date: day.date, goal: userData.sleepGoal }))} 
                    dataKey="goal" 
                    stroke={COLORS.tertiary} 
                    strokeDasharray="5 5"
                    name="Sleep Goal" 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sleep Quality Chart */}
          <div className="dashboard-card chart-card">
            <h3>Sleep Quality (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sleepData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDateLabel}
                />
                <YAxis label={{ value: 'Quality Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}`, "Quality Score"]} />
                <Bar dataKey="quality" name="Sleep Quality">
                  {sleepData.weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getQualityColor(entry.quality)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sleep Distribution Pie Chart */}
          <div className="dashboard-card chart-card">
            <h3>Average Sleep Composition</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={prepareSleepDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}h`}
                >
                  {prepareSleepDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} hours`, ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Last Night Details */}
          <div className="dashboard-card last-night-card">
            <h3>Last Night Details</h3>
            <div className="sleep-details">
              <div className="detail-item">
                <span>Date:</span>
                <strong>{new Date(sleepData.lastNight.date).toLocaleDateString()}</strong>
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
                <strong>{Math.round(sleepData.lastNight.sleepDuration * 10) / 10} hours</strong>
              </div>
              <div className="detail-item">
                <span>Interruptions:</span>
                <strong>{sleepData.lastNight.interruptions} time(s)</strong>
              </div>
              <div className="detail-item">
                <span>Quality:</span>
                <strong style={{ color: getQualityColor(sleepData.lastNight.quality) }}>
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
                <strong>{Math.round(sleepData.stats.averageSleepDuration * 10) / 10} hours</strong>
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
      </div>
    </div>

  );
};

export default Home;
