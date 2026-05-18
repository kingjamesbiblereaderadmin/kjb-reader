import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('kjb-dark-mode');
      if (stored !== null) return stored === 'true';
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Follow system theme changes when no manual override is stored
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      try {
        if (localStorage.getItem('kjb-dark-mode') === null) setIsDark(e.matches);
      } catch { setIsDark(e.matches); }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('kjb-dark-mode', String(isDark)); } catch {}
  }, [isDark]);

  // Reset to system theme
  const resetToSystem = () => {
    try { localStorage.removeItem('kjb-dark-mode'); } catch {}
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(d => !d), resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}