import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Tema inicial: guardado en localStorage o nvidia-dark por defecto
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('fooderp_theme');
    return saved === 'nvidia-light' ? 'nvidia-light' : 'nvidia-dark';
  });

  const setTheme = (newTheme) => {
    const validTheme = newTheme === 'nvidia-light' ? 'nvidia-light' : 'nvidia-dark';
    setThemeState(validTheme);
    localStorage.setItem('fooderp_theme', validTheme);
    document.documentElement.setAttribute('data-theme', validTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'nvidia-dark' ? 'nvidia-light' : 'nvidia-dark');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'nvidia-dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
}
