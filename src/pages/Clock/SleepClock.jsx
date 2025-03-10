import React, { useState, useEffect } from "react";

const SleepClock = () => {
  const [bedtime, setBedtime] = useState("");
  const [sleepHours, setSleepHours] = useState(8);
  const [fallAsleepTime, setFallAsleepTime] = useState(15);
  const [wakeTime, setWakeTime] = useState("");
  const [countdown, setCountdown] = useState("");

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

  // Countdown timer for wake time
  useEffect(() => {
    if (!wakeTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const [wakeHours, wakeMinutes] = wakeTime.split(":").map(Number);
      const wakeDate = new Date(now);
      wakeDate.setHours(wakeHours, wakeMinutes, 0, 0);
      if (wakeDate < now) wakeDate.setDate(wakeDate.getDate() + 1);

      const diff = wakeDate - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [wakeTime]);

  return (
    <div className="SleepClock p-4 max-w-md mx-auto bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Sleep Clock</h1>
      <p className="mb-2">Enter your bedtime to find your ideal wake-up time.</p>

      <label className="block mb-2">
        Bedtime:
        <input
          type="time"
          value={bedtime}
          onChange={(e) => setBedtime(e.target.value)}
          className="block w-full p-2 border rounded"
        />
      </label>

      <label className="block mb-2">
        Hours of Sleep Needed:
        <input
          type="number"
          min="1"
          max="12"
          value={sleepHours}
          onChange={(e) => setSleepHours(Number(e.target.value))}
          className="block w-full p-2 border rounded"
        />
      </label>

      <label className="block mb-2">
        Time to Fall Asleep (minutes):
        <input
          type="number"
          min="0"
          max="60"
          value={fallAsleepTime}
          onChange={(e) => setFallAsleepTime(Number(e.target.value))}
          className="block w-full p-2 border rounded"
        />
      </label>

      <button
        onClick={calculateWakeTime}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
      >
        Calculate Wake-up Time
      </button>

      {wakeTime && (
        <div className="mt-4">
          <p className="text-lg font-semibold">Your ideal wake-up time: {wakeTime}</p>
          <p className="text-red-500 text-lg font-bold">Time until wake-up: {countdown}</p>
        </div>
      )}
    </div>
  );
};

export default SleepClock;