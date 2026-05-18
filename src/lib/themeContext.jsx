import React, { createContext, useContext, useState, useEffect } from 'react';

// theme modes: 'light' | 'dark' | 'system' | 'auto'
// colour palettes: 'gold' | 'sapphire' | 'forest' | 'rose' | 'amethyst' | 'slate'

const ThemeContext = createContext();

// Each palette: { name, accent (HSL), primary_light (HSL), primary_dark (HSL) }
export const COLOUR_PALETTES = [
  { id: 'gold',      name: 'Gold',      swatch: '#c8922a', accent: '38 70% 50%',  primary_light: '220 60% 20%', primary_dark: '38 70% 55%'  },
  { id: 'sapphire',  name: 'Sapphire',  swatch: '#2563eb', accent: '217 91% 55%', primary_light: '217 91% 30%', primary_dark: '217 91% 60%' },
  { id: 'forest',    name: 'Forest',    swatch: '#16a34a', accent: '142 70% 38%', primary_light: '142 70% 22%', primary_dark: '142 60% 45%' },
  { id: 'rose',      name: 'Rose',      swatch: '#e11d48', accent: '345 80% 52%', primary_light: '345 80% 28%', primary_dark: '345 80% 58%' },
  { id: 'amethyst',  name: 'Amethyst',  swatch: '#7c3aed', accent: '262 80% 55%', primary_light: '262 80% 30%', primary_dark: '262 70% 62%' },
  { id: 'slate',     name: 'Slate',     swatch: '#475569', accent: '215 25% 45%', primary_light: '215 25% 18%', primary_dark: '215 20% 60%' },
];

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

function applyPalette(paletteId, isDark) {
  const p = COLOUR_PALETTES.find(c => c.id === paletteId) || COLOUR_PALETTES[0];
  const root = document.documentElement;
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--accent-foreground', isDark ? '220 20% 7%' : '220 20% 10%');
  root.style.setProperty('--primary', isDark ? p.primary_dark : p.primary_light);
  root.style.setProperty('--primary-foreground', isDark ? '220 20% 7%' : '40 20% 98%');
  root.style.setProperty('--ring', isDark ? p.primary_dark : p.primary_light);
  // sidebar sync
  root.style.setProperty('--sidebar-primary', isDark ? p.primary_dark : p.primary_light);
  root.style.setProperty('--sidebar-ring', isDark ? p.primary_dark : p.primary_light);
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('kjb-theme-mode') || 'system'; } catch { return 'system'; }
  });
  const [colourId, setColourIdState] = useState(() => {
    try { return localStorage.getItem('kjb-colour') || 'gold'; } catch { return 'gold'; }
  });
  const [isDark, setIsDark] = useState(() => resolveIsDark(
    (() => { try { return localStorage.getItem('kjb-theme-mode') || 'system'; } catch { return 'system'; } })()
  ));

  const setColourId = (id) => {
    setColourIdState(id);
    try { localStorage.setItem('kjb-colour', id); } catch {}
  };

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

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

  // Apply colour palette whenever palette or dark mode changes
  useEffect(() => {
    applyPalette(colourId, isDark);
  }, [colourId, isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, colourId, setColourId, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}