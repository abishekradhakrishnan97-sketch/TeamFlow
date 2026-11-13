import React, { createContext, useContext, useState, useEffect } from 'react';

interface DashboardThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const DashboardThemeContext = createContext<DashboardThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'teamflow_dashboard_theme';

export const DashboardThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === 'dark';
      return false; // Default to existing light mode
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      } catch (e) {
        console.warn('Failed to save theme in localStorage', e);
      }
      return next;
    });
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme in localStorage', e);
    }
  };

  return (
    <DashboardThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
};

export const useDashboardTheme = () => useContext(DashboardThemeContext);
