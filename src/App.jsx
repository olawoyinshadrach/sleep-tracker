// src/App.jsx
import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SleepSession from "./pages/SleepSession";
import Alarm from "./pages/Alarm";
import { AlarmProvider } from "./contexts/AlarmContext";
import "./App.css";

function App() {
  return (
    <AlarmProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sleep-session" element={<SleepSession />} />
          <Route path="/alarm" element={<Alarm />} />
        </Routes>
      </div>
    </AlarmProvider>
  );
}

export default App;
