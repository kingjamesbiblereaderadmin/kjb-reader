import React, { createContext, useState, useEffect, useContext } from 'react';

// theme modes: 'light' | 'dark' | 'system' | 'auto'
// colour palettes: 'gold' | 'sapphire' | 'forest' | 'rose' | 'amethyst' | 'slate'

const ThemeContext = createContext();

// Each palette: { name, accent (HSL), primary_light (HSL), primary_dark (HSL) }
// 1611-inspired historical color schemes
export const COLOUR_PALETTES = [
  { id: 'antique',   name: 'Antique',   swatch: '#8B4513', accent: '30 40% 35%',  primary_light: '30 35% 25%', primary_dark: '45 65% 50%'  },
  { id: 'parchment', name: 'Parchment', swatch: '#D2B48C', accent: '35 35% 60%',  primary_light: '30 30% 20%', primary_dark: '35 40% 65%' },
  { id: 'leather',   name: 'Leather',   swatch: '#654321', accent: '25 35% 30%',  primary_light: '25 40% 25%', primary_dark: '30 45% 35%' },
  { id: 'gold',      name: 'Gold Leaf', swatch: '#B8860B', accent: '45 70% 45%',  primary_light: '30 35% 20%', primary_dark: '45 75% 50%' },
  { id: 'burgundy',  name: 'Burgundy',  swatch: '#800020', accent: '350 60% 30%', primary_light: '350 55% 25%', primary_dark: '350 65% 35%' },
  { id: 'forest',    name: 'Forest',    swatch: '#2D5016', accent: '120 45% 25%', primary_light: '120 40% 20%', primary_dark: '120 50% 30%' },
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
    // Cycle through: light → dark → auto → light
    setMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
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

  // Apply 1611 vs Modern theme
  useEffect(() => {
    const root = document.documentElement;
    const use1611 = localStorage.getItem('kjb-theme-1611') !== 'false';
    if (!use1611) {
      root.setAttribute('data-theme-modern', 'true');
    } else {
      root.removeAttribute('data-theme-modern');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, colourId, setColourId, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}