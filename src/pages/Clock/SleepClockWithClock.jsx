// SleepClockWithClock.jsx
import React from "react";
import SleepClock from "./SleepClock"; // Import SleepClock component
import Clock from "./Clock"; // Import Clock component
import SleepClockquestionaire from "./SleepClockquestionaire"; // Import Clock component

const SleepClockWithClock = () => {
  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 rounded-lg shadow-lg">
      {/* Render both components */}
      <SleepClock />
      <Clock />
      <SleepClockquestionaire />
    </div>
  );
};

export default SleepClockWithClock;