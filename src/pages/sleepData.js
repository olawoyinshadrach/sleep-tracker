// sleepData.js
export const getUserSleepData = (userID) => {
    // For now, return some dummy sleep data for the given userID
    console.log(`Fetching sleep data for user: ${userID}`);
    return {
      lastNight: {
        date: '2025-02-22', // Example date (yesterday)
        sleepDuration: 7.5, // in hours
        sleepQuality: 'Good',
      },
      stats: {
        averageSleepDuration: 7, // in hours
        sleepConsistency: 'High',
        totalNightsTracked: 30,
      },
    };
  };
  