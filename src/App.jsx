// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Alarm from './pages/Alarm';
import SleepSession from './pages/SleepSession';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/alarm" element={<Alarm />} />
      <Route path="/sleep-session" element={<SleepSession />} />
    </Routes>
  );
};

export default App;
