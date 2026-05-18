import React, { createContext, useContext, useState, useEffect } from 'react';

// theme modes: 'light' | 'dark' | 'system' | 'auto'
// 'system' = follow OS preference
// 'auto'   = light 6am-6pm, dark 6pm-6am

const ThemeContext = createContext();

function getAutoIsDark() {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
}

function getSystemIsDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveIsDark(mode) {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (mode === 'auto') return getAutoIsDark();
  return getSystemIsDark(); // 'system'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('kjb-theme-mode') || 'system'; } catch { return 'system'; }
  });
  const [isDark, setIsDark] = useState(() => resolveIsDark(
    (() => { try { return localStorage.getItem('kjb-theme-mode') || 'system'; } catch { return 'system'; } })()
  ));

  // Persist mode and apply dark class
  useEffect(() => {
    try { localStorage.setItem('kjb-theme-mode', mode); } catch {}
    setIsDark(resolveIsDark(mode));
  }, [mode]);

  // For 'system': listen to OS changes
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  // For 'auto': poll every minute to update based on time-of-day
  useEffect(() => {
    if (mode !== 'auto') return;
    const interval = setInterval(() => setIsDark(getAutoIsDark()), 60_000);
    return () => clearInterval(interval);
  }, [mode]);

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}