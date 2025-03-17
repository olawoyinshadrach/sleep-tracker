import { db } from "../firebase-config";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import sleepScorePredictor from "../utils/sleepScorePredictor";

// Initialize the KNN model when the module loads
(async function() {
  try {
    await sleepScorePredictor.initialize();
    console.log('Sleep score predictor initialized');
  } catch (err) {
    console.error('Failed to initialize sleep score predictor:', err);
  }
})();

/**
 * Fetches sleep data for a specific user from Firestore
 * Modified to handle enhanced sleep score calculation with confidence
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Object containing formatted sleep data
 */
export const getUserSleepData = async (userId) => {
  console.log(`Fetching sleep data for user: ${userId}`);
  
  try {
    // Query to get the last 30 days of sleep entries
    const sleepEntriesRef = collection(db, "sleepEntries");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const q = query(
      sleepEntriesRef,
      where("userId", "==", userId),
      where("date", ">=", Timestamp.fromDate(thirtyDaysAgo)),
      orderBy("date", "desc"),
      limit(30)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Check if we have any sleep data
    if (querySnapshot.empty) {
      console.log("No sleep data found - returning default data");
      return generateDefaultSleepData();
    }
    
    // Extract and format the sleep entries
    const sleepEntries = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to JS Date
      const jsDate = data.date.toDate();
      const dateStr = jsDate.toISOString().split('T')[0];
      
      sleepEntries.push({
        id: doc.id,
        date: dateStr,
        sleepDuration: data.sleepDuration || 0,
        deepSleep: data.deepSleep || 0,
        remSleep: data.remSleep || 0,
        lightSleep: data.lightSleep || (data.sleepDuration - (data.deepSleep + data.remSleep)) || 0,
        quality: data.quality || 0,
        interruptions: data.interruptions || 0,
        bedtime: data.bedtime || '',
        wakeTime: data.wakeTime || '',
        notes: data.notes || '',
      });
    });
    
    // Get the last 7 days for weekly data
    const weeklyData = sleepEntries.slice(0, 7);
    
    // Sort by date ascending for proper charting
    weeklyData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate stats
    const averageSleepDuration = weeklyData.reduce((sum, entry) => sum + entry.sleepDuration, 0) / weeklyData.length;
    // Get sleep score with confidence information
    const sleepScore = await calculateSleepScore(weeklyData);
    const sleepConsistency = calculateSleepConsistency(weeklyData);
    
    // Format data for the app
    const formattedData = {
      lastNight: weeklyData.length > 0 ? 
        {
          ...weeklyData[weeklyData.length - 1],
          sleepQuality: getSleepQualityLabel(weeklyData[weeklyData.length - 1].quality)
        } : 
        generateDefaultLastNight(),
      weeklyData,
      stats: {
        averageSleepDuration,
        sleepConsistency,
        totalNightsTracked: sleepEntries.length,
        sleepScore: sleepScore.score,
        sleepDebt: calculateSleepDebt(weeklyData, 8), // Assuming 8 hours is optimal
        optimalSleepDuration: 8, // This could come from user settings
        sleepScoreMethod: sleepScore.method,
        sleepScoreConfidence: sleepScore.confidence,
        sleepScoreMessage: sleepScore.message
      },
      sleepDistribution: calculateSleepDistribution(weeklyData)
    };
    
    return formattedData;
    
  } catch (error) {
    console.error("Error fetching sleep data:", error);
    return generateDefaultSleepData();
  }
};

/**
 * Adds a new sleep entry to Firestore
 * @param {Object} sleepEntry - The sleep entry data
 * @returns {Promise<string>} - The ID of the created document
 */
export const addSleepEntry = async (sleepEntry) => {
  try {
    const sleepEntriesRef = collection(db, "sleepEntries");
    
    // Add server timestamp for tracking when entries were created
    const entryWithTimestamp = {
      ...sleepEntry,
      createdAt: serverTimestamp()
    };
    
    // If date is string, convert it to Timestamp
    if (typeof entryWithTimestamp.date === 'string') {
      entryWithTimestamp.date = Timestamp.fromDate(new Date(entryWithTimestamp.date));
    }
    
    const docRef = await addDoc(sleepEntriesRef, entryWithTimestamp);
    console.log("Sleep entry added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding sleep entry:", error);
    throw error;
  }
};

/**
 * Calculates the sleep score based on various metrics
 * Now uses KNN prediction with confidence levels and falls back to traditional calculation
 * @param {Array} weeklyData - Array of sleep entries
 * @returns {Promise<Object>} - Sleep score with confidence information
 */
const calculateSleepScore = async (weeklyData) => {
  if (weeklyData.length === 0) {
    return { 
      score: 70, 
      method: 'default',
      confidence: 0,
      message: 'No sleep data available' 
    };
  }
  
  // Calculate input features for KNN
  const avgDuration = weeklyData.reduce((sum, entry) => sum + entry.sleepDuration, 0) / weeklyData.length;
  const avgQuality = weeklyData.reduce((sum, entry) => sum + entry.quality, 0) / weeklyData.length;
  const consistencyScore = calculateSleepConsistencyScore(weeklyData);
  
  // Try to get KNN prediction first
  try {
    // Get prediction with confidence information
    const prediction = await sleepScorePredictor.predict(
      avgDuration,
      avgQuality,
      consistencyScore
    );
    
    // If prediction score is available
    if (prediction.score !== null) {
      console.log(`KNN sleep score: ${prediction.score}, confidence: ${Math.round(prediction.confidence * 100)}%`);
      
      // For very low confidence predictions, use traditional calculation instead
      if (prediction.confidenceLevel === 'very low') {
        const traditionalScore = calculateTraditionalSleepScore(avgDuration, avgQuality, consistencyScore);
        console.log(`Low confidence KNN prediction, using traditional calculation: ${traditionalScore}`);
        
        return {
          score: traditionalScore,
          method: 'traditional',
          knnAttempted: true,
          knnConfidence: prediction.confidence,
          message: `Using traditional calculation (KNN confidence too low: ${Math.round(prediction.confidence * 100)}%)`
        };
      }
      
      // Return KNN prediction with confidence info
      return {
        score: prediction.score,
        method: 'knn',
        confidence: prediction.confidence,
        confidenceLevel: prediction.confidenceLevel,
        message: prediction.message
      };
    }
  } catch (error) {
    console.log('KNN prediction failed, falling back to traditional calculation:', error);
  }
  
  // Fallback to traditional calculation
  const traditionalScore = calculateTraditionalSleepScore(avgDuration, avgQuality, consistencyScore);
  
  return {
    score: traditionalScore,
    method: 'traditional',
    confidence: 1.0, // Traditional calculation is considered 100% confident
    message: 'Using traditional calculation (KNN prediction failed)'
  };
};

/**
 * Traditional sleep score calculation (separated for clarity)
 */
const calculateTraditionalSleepScore = (avgDuration, avgQuality, consistencyScore) => {
  // Duration score (40 points): Optimal is 7-9 hours
  let durationScore = 0;
  if (avgDuration >= 7 && avgDuration <= 9) {
    durationScore = 40;
  } else if (avgDuration >= 6 && avgDuration < 7) {
    durationScore = 30;
  } else if (avgDuration > 9 && avgDuration <= 10) {
    durationScore = 30;
  } else if (avgDuration >= 5 && avgDuration < 6) {
    durationScore = 20;
  } else if (avgDuration > 10) {
    durationScore = 20;
  } else {
    durationScore = 10;
  }
  
  // Quality score (40 points): Direct from quality average
  const qualityScore = (avgQuality / 100) * 40;
  
  // Sum all scores and round
  return Math.round(durationScore + qualityScore + consistencyScore);
};

/**
 * Calculates sleep consistency score based on bedtime and wake time variability
 * @param {Array} weeklyData - Array of sleep entries
 * @returns {number} - Consistency score from 0-20
 */
const calculateSleepConsistencyScore = (weeklyData) => {
  if (weeklyData.length < 3) return 15; // Default if not enough data
  
  // Calculate variance in sleep duration
  const durations = weeklyData.map(entry => entry.sleepDuration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const variance = durations.reduce((a, b) => a + Math.pow(b - avgDuration, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation means more consistency
  if (stdDev < 0.5) return 20;
  if (stdDev < 1.0) return 17;
  if (stdDev < 1.5) return 14;
  if (stdDev < 2.0) return 10;
  return 7;
};

/**
 * Determines text label for sleep consistency
 * @param {Array} weeklyData - Array of sleep entries
 * @returns {string} - Text label for consistency
 */
const calculateSleepConsistency = (weeklyData) => {
  if (weeklyData.length < 3) return 'Insufficient Data';
  
  const consistencyScore = calculateSleepConsistencyScore(weeklyData);
  
  if (consistencyScore >= 17) return 'High';
  if (consistencyScore >= 14) return 'Good';
  if (consistencyScore >= 10) return 'Fair';
  return 'Low';
};

/**
 * Calculates sleep debt based on optimal sleep hours
 * @param {Array} weeklyData - Array of sleep entries
 * @param {number} optimalHours - Optimal sleep duration
 * @returns {number} - Sleep debt in hours
 */
const calculateSleepDebt = (weeklyData, optimalHours) => {
  if (weeklyData.length === 0) return 0;
  
  const totalDebt = weeklyData.reduce((debt, entry) => {
    const dailyDebt = entry.sleepDuration < optimalHours ? 
      optimalHours - entry.sleepDuration : 0;
    return debt + dailyDebt;
  }, 0);
  
  return Math.round(totalDebt);
};

/**
 * Calculates average sleep phases distribution
 * @param {Array} weeklyData - Array of sleep entries
 * @returns {Object} - Object with deep, rem and light sleep averages
 */
const calculateSleepDistribution = (weeklyData) => {
  if (weeklyData.length === 0) {
    return { deep: 2, rem: 1.5, light: 3.5 }; // Default values
  }
  
  const deep = Math.round(weeklyData.reduce((sum, entry) => sum + entry.deepSleep, 0) / weeklyData.length * 10) / 10;
  const rem = Math.round(weeklyData.reduce((sum, entry) => sum + entry.remSleep, 0) / weeklyData.length * 10) / 10;
  const light = Math.round(weeklyData.reduce((sum, entry) => sum + entry.lightSleep, 0) / weeklyData.length * 10) / 10;
  
  return { deep, rem, light };
};

/**
 * Gets quality label from numeric score
 * @param {number} qualityScore - Numeric quality score
 * @returns {string} - Text label for quality
 */
const getSleepQualityLabel = (qualityScore) => {
  if (qualityScore > 70) return 'Good';
  if (qualityScore > 40) return 'Fair';
  return 'Poor';
};

/**
 * Generates default sleep data when no Firestore data exists
 * Modified to use async sleep score calculation
 * @returns {Promise<Object>} - Default structured sleep data
 */
const generateDefaultSleepData = async () => {
  // Generate last 7 days of sleep data for charts
  const today = new Date();
  const weeklyData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dateStr = date.toISOString().split('T')[0];
    
    weeklyData.push({
      date: dateStr,
      sleepDuration: 5 + Math.random() * 4, // Random between 5-9 hours
      deepSleep: 1 + Math.random() * 2, // Random between 1-3 hours
      remSleep: 1 + Math.random() * 1.5, // Random between 1-2.5 hours
      lightSleep: 2 + Math.random() * 2, // Random between 2-4 hours
      quality: Math.floor(Math.random() * 100), // 0-100 score
      interruptions: Math.floor(Math.random() * 3), // 0-2 interruptions
    });
  }
  
  const sleepScore = await calculateSleepScore(weeklyData);
  
  return {
    lastNight: {
      date: weeklyData[6].date,
      sleepDuration: weeklyData[6].sleepDuration,
      sleepQuality: weeklyData[6].quality > 70 ? 'Good' : 
                   (weeklyData[6].quality > 40 ? 'Fair' : 'Poor'),
      deepSleep: weeklyData[6].deepSleep,
      remSleep: weeklyData[6].remSleep,
      lightSleep: weeklyData[6].lightSleep,
      interruptions: weeklyData[6].interruptions,
      bedtime: '22:30',
      wakeTime: '06:45',
    },
    weeklyData: weeklyData,
    stats: {
      averageSleepDuration: weeklyData.reduce((sum, day) => sum + day.sleepDuration, 0) / 7,
      sleepConsistency: 'High',
      totalNightsTracked: 30,
      sleepScore: sleepScore.score,
      sleepDebt: Math.floor(Math.random() * 6), // 0-5 hours
      optimalSleepDuration: 8, // recommended hours
      sleepScoreMethod: sleepScore.method,
      sleepScoreConfidence: sleepScore.confidence,
      sleepScoreMessage: sleepScore.message
    },
    sleepDistribution: {
      deep: Math.round(weeklyData.reduce((sum, day) => sum + day.deepSleep, 0) / 7 * 10) / 10,
      rem: Math.round(weeklyData.reduce((sum, day) => sum + day.remSleep, 0) / 7 * 10) / 10,
      light: Math.round(weeklyData.reduce((sum, day) => sum + day.lightSleep, 0) / 7 * 10) / 10,
    }
  };
};

/**
 * Generates default data for last night when no data exists
 * @returns {Object} - Default last night data
 */
const generateDefaultLastNight = () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  return {
    date: dateStr,
    sleepDuration: 7.5,
    sleepQuality: 'Fair',
    deepSleep: 1.8,
    remSleep: 1.5,
    lightSleep: 4.2,
    interruptions: 1,
    bedtime: '23:00',
    wakeTime: '06:30',
  };
};
