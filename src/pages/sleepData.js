// sleepData.js
export const getUserSleepData = (userID) => {
  console.log(`Fetching sleep data for user: ${userID}`);
  
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
      sleepScore: Math.floor(65 + Math.random() * 20), // 65-85
      sleepDebt: Math.floor(Math.random() * 6), // 0-5 hours
      optimalSleepDuration: 8, // recommended hours
    },
    sleepDistribution: {
      deep: Math.round(weeklyData.reduce((sum, day) => sum + day.deepSleep, 0) / 7 * 10) / 10,
      rem: Math.round(weeklyData.reduce((sum, day) => sum + day.remSleep, 0) / 7 * 10) / 10,
      light: Math.round(weeklyData.reduce((sum, day) => sum + day.lightSleep, 0) / 7 * 10) / 10,
    }
  };
};
