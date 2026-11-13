import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface DashboardThemeContextType {
  isDark: boolean;
  themePreference: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const DashboardThemeContext = createContext<DashboardThemeContextType>({
  isDark: false,
  themePreference: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'teamflow_dashboard_theme';

export const DashboardThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // User preference persisted in localStorage
  const [themePreference, setThemePreference] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
      return 'light'; // Default to existing light mode
    } catch {
      return 'light';
    }
  });

  // Strict Dashboard Boundary: dark mode applies ONLY when on Dashboard route
  const isDashboardRoute =
    location.pathname === '/dashboard' || location.pathname === '/';

  const isDark = isDashboardRoute && themePreference === 'dark';

  // Toggle user preference
  const toggleTheme = () => {
    setThemePreference((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        console.warn('Failed to save theme in localStorage', e);
      }
      return next;
    });
  };

  const setTheme = (dark: boolean) => {
    const next = dark ? 'dark' : 'light';
    setThemePreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.warn('Failed to save theme in localStorage', e);
    }
  };

  // Synchronize CSS class and color-scheme on root document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dashboard-dark');
      document.body.classList.add('dashboard-dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dashboard-dark');
      document.body.classList.remove('dashboard-dark');
      document.documentElement.style.colorScheme = 'light';
    }

    return () => {
      document.documentElement.classList.remove('dashboard-dark');
      document.body.classList.remove('dashboard-dark');
      document.documentElement.style.colorScheme = 'light';
    };
  }, [isDark]);

  const value = useMemo(
    () => ({ isDark, themePreference, toggleTheme, setTheme }),
    [isDark, themePreference]
  );

  return (
    <DashboardThemeContext.Provider value={value}>
      {children}
    </DashboardThemeContext.Provider>
  );
};

export const useDashboardTheme = () => useContext(DashboardThemeContext);
