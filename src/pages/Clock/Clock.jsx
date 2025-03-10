import React, { useState, useEffect } from "react";

const Clock = ({ suggestedBedtime, recommendedSleepHours, wakeTime }) => {
  const [countdownToBed, setCountdownToBed] = useState("");
  const [countdownToWakeUp, setCountdownToWakeUp] = useState("");
  const alarmSound = new Audio("https://www.soundjay.com/button/beep-07.wav");

  // Countdown to bedtime
  useEffect(() => {
    const updateCountdownToBed = () => {
      const now = new Date();
      if (!suggestedBedtime) return; // Ensure suggestedBedtime is defined
      const [bedHour, bedMin] = suggestedBedtime.split(":").map(Number);

      let bedtimeToday = new Date();
      bedtimeToday.setHours(bedHour, bedMin, 0, 0);

      if (now > bedtimeToday) {
        bedtimeToday.setDate(bedtimeToday.getDate() + 1); // Set for next day
      }

      const timeDiff = bedtimeToday - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdownToBed(`${hours}h ${minutes}m ${seconds}s`);

      // Start the wake-up countdown once the bedtime countdown hits 0
      if (timeDiff <= 0 && countdownToWakeUp === "") {
        startCountdownToWakeUp();
      }
    };

    updateCountdownToBed();
    const interval = setInterval(updateCountdownToBed, 1000);

    return () => clearInterval(interval);
  }, [suggestedBedtime, countdownToWakeUp]);

  // Countdown to wake time
  const startCountdownToWakeUp = () => {
    const updateCountdownToWakeUp = () => {
      const now = new Date();
      const [wakeHour, wakeMin] = wakeTime.split(":").map(Number);

      let wakeTimeToday = new Date();
      wakeTimeToday.setHours(wakeHour, wakeMin, 0, 0);

      if (now > wakeTimeToday) {
        wakeTimeToday.setDate(wakeTimeToday.getDate() + 1); // Set for next day
      }

      const timeDiff = wakeTimeToday - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdownToWakeUp(`${hours}h ${minutes}m ${seconds}s`);

      // Play alarm when time is up
      if (timeDiff <= 0) {
        alarmSound.play(); // Play the alarm sound
      }
    };

    updateCountdownToWakeUp();
    const interval = setInterval(updateCountdownToWakeUp, 1000);

    return () => clearInterval(interval);
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Sleep Clock</h1>
      <p>Your suggested bedtime: {suggestedBedtime}</p>
      <p>Your recommended sleep duration: {recommendedSleepHours} hours</p>
      <p>Calculated Wake Time: {wakeTime}</p>
      <p>Time left until bedtime: {countdownToBed}</p>
      <p>Time left until wake-up: {countdownToWakeUp}</p>
    </div>
  );
};

export default Clock;