import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check localStorage first, then time-based default
  const getInitialTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) return storedTheme;
    
    // Set default theme based on time of day (7AM-7PM = light, else dark)
    const currentHour = new Date().getHours();
    return currentHour >= 7 && currentHour < 19 ? 'light' : 'dark';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Check time and update theme automatically if not manually set
  useEffect(() => {
    const checkTimeAndUpdateTheme = () => {
      const currentHour = new Date().getHours();
      const suggestedTheme = currentHour >= 7 && currentHour < 19 ? 'light' : 'dark';
      
      // Only update if user hasn't manually changed the theme recently
      const lastManualChange = localStorage.getItem('lastManualThemeChange');
      if (!lastManualChange || Date.now() - parseInt(lastManualChange) > 3600000) { // 1 hour
        setTheme(suggestedTheme);
      }
    };

    // Check on initial load
    checkTimeAndUpdateTheme();
    
    // Set up interval to check every hour
    const intervalId = setInterval(checkTimeAndUpdateTheme, 3600000); // 1 hour
    
    return () => clearInterval(intervalId);
  }, []);

  // Update localStorage and document when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle theme and record manual change time
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('lastManualThemeChange', Date.now().toString());
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
