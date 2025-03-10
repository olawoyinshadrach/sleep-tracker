import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: '🏠'
    },
    {
      id: 'alarm',
      label: 'Alarm',
      path: '/alarm',
      icon: '⏰'
    },
    {
      id: 'sleep',
      label: 'Sleep Log',
      path: '/sleep-session',
      icon: '📝'
    },
    {
      id: 'calculator',
      label: 'Calculator',
      path: '/sleep-clock',
      icon: '🧠'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="bottom-nav">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          onClick={() => handleNavigation(item.path)}
        >
          <div className="nav-icon">{item.icon}</div>
          <div className="nav-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default BottomNavigation;
