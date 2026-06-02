import React, { createContext, useState, useEffect, useContext } from 'react';
import { applyDailyAccent } from '@/lib/dailyVerseTheme';

// theme modes: 'light' | 'dark' | 'system' | 'auto'
// colour palettes: 'gold' | 'sapphire' | 'forest' | 'rose' | 'amethyst' | 'slate'

const ThemeContext = createContext();

// Each palette: { name, accent (HSL), primary_light (HSL), primary_dark (HSL) }
// 1611-inspired historical color schemes
export const COLOUR_PALETTES = [
  { id: 'indigo',    name: 'Indigo',    swatch: '#4f46e5', accent: '245 80% 56%', primary_light: '245 80% 52%', primary_dark: '255 80% 68%' },
  { id: 'sapphire',  name: 'Sapphire',  swatch: '#1d4ed8', accent: '222 80% 50%', primary_light: '222 80% 48%', primary_dark: '218 85% 62%' },
  { id: 'sky',       name: 'Sky',       swatch: '#0284c7', accent: '200 85% 45%', primary_light: '200 85% 42%', primary_dark: '199 85% 56%' },
  { id: 'teal',      name: 'Teal',      swatch: '#0d9488', accent: '174 70% 35%', primary_light: '174 72% 32%', primary_dark: '172 65% 45%' },
  { id: 'forest',    name: 'Forest',    swatch: '#16a34a', accent: '142 60% 38%', primary_light: '142 62% 34%', primary_dark: '142 55% 48%' },
  { id: 'amethyst',  name: 'Amethyst',  swatch: '#9333ea', accent: '271 70% 50%', primary_light: '271 72% 48%', primary_dark: '270 70% 64%' },
  { id: 'rose',      name: 'Rose',      swatch: '#e11d48', accent: '347 75% 50%', primary_light: '347 77% 48%', primary_dark: '347 75% 62%' },
  { id: 'crimson',   name: 'Crimson',   swatch: '#b91c1c', accent: '0 70% 45%',   primary_light: '0 72% 42%',   primary_dark: '0 70% 58%' },
  { id: 'amber',     name: 'Amber',     swatch: '#d97706', accent: '32 90% 45%',  primary_light: '32 90% 42%',  primary_dark: '38 90% 55%' },
  { id: 'gold',      name: 'Gold Leaf', swatch: '#B8860B', accent: '45 70% 45%',  primary_light: '43 74% 42%',  primary_dark: '45 75% 55%' },
  { id: 'burgundy',  name: 'Burgundy',  swatch: '#800020', accent: '350 60% 38%', primary_light: '350 60% 34%', primary_dark: '350 60% 50%' },
  { id: 'slate',     name: 'Slate',     swatch: '#475569', accent: '215 25% 40%', primary_light: '215 25% 38%', primary_dark: '215 22% 58%' },
  { id: 'antique',   name: 'Antique',   swatch: '#8B4513', accent: '30 40% 38%',  primary_light: '30 38% 34%',  primary_dark: '30 45% 50%' },
  { id: 'custom',    name: 'Custom',    swatch: localStorage.getItem('kjb-custom-accent') || '#B8860B', accent: 'auto', primary_light: 'auto', primary_dark: 'auto' },
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

function hexToHsl(hex) {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;
  
  // Find min and max values of r, g, b
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyPalette(paletteId, isDark) {
  const p = COLOUR_PALETTES.find(c => c.id === paletteId) || COLOUR_PALETTES[0];
  const root = document.documentElement;
  
  if (p.id === 'custom') {
    const customHex = localStorage.getItem('kjb-custom-accent') || '#B8860B';
    const hsl = hexToHsl(customHex);
    root.style.setProperty('--accent', hsl);
    root.style.setProperty('--primary', isDark ? hexToHsl('#6B4E05') : hexToHsl('#D4A017'));
    root.style.setProperty('--ring', isDark ? hexToHsl('#6B4E05') : hexToHsl('#D4A017'));
    root.style.setProperty('--sidebar-primary', isDark ? hexToHsl('#6B4E05') : hexToHsl('#D4A017'));
    root.style.setProperty('--sidebar-ring', isDark ? hexToHsl('#6B4E05') : hexToHsl('#D4A017'));
  } else {
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--primary', isDark ? p.primary_dark : p.primary_light);
    root.style.setProperty('--ring', isDark ? p.primary_dark : p.primary_light);
    root.style.setProperty('--sidebar-primary', isDark ? p.primary_dark : p.primary_light);
    root.style.setProperty('--sidebar-ring', isDark ? p.primary_dark : p.primary_light);
  }
  // Vivid mid-tone palettes need white text on accent/primary for contrast.
  root.style.setProperty('--accent-foreground', '0 0% 100%');
  root.style.setProperty('--primary-foreground', '0 0% 100%');
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('kjb-theme-mode') || 'system'; } catch { return 'system'; }
  });
  const [colourId, setColourIdState] = useState(() => {
    try { return localStorage.getItem('kjb-colour') || 'gold'; } catch { return 'gold'; }
  });
  // 'daily' = accent matches the daily verse card (auto-changes each day).
  // 'fixed' = use the chosen colour palette (colourId) instead.
  const [colorMode, setColorModeState] = useState(() => {
    try { return localStorage.getItem('kjb-color-mode') || 'daily'; } catch { return 'daily'; }
  });

  const setColorMode = (m) => {
    setColorModeState(m);
    try { localStorage.setItem('kjb-color-mode', m); } catch {}
  };
  const [isDark, setIsDark] = useState(() => {
    const savedMode = (() => { try { return localStorage.getItem('kjb-theme-mode') || 'system'; } catch { return 'system'; } })();
    return resolveIsDark(savedMode);
  });
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Apply dark class to <html> - run immediately on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Force theme application on mount to prevent flicker
  useEffect(() => {
    if (!isInitialized) {
      const savedMode = localStorage.getItem('kjb-theme-mode') || 'system';
      const savedColour = localStorage.getItem('kjb-colour') || 'gold';
      const dark = resolveIsDark(savedMode);
      const savedColorMode = localStorage.getItem('kjb-color-mode') || 'daily';
      document.documentElement.classList.toggle('dark', dark);
      applyPalette(savedColour, dark);
      // Only override with the daily-verse accent when in 'daily' colour mode.
      if (savedColorMode !== 'fixed') applyDailyAccent(dark);
      setIsInitialized(true);
    }
  }, []);

  // Apply colour palette whenever palette or dark mode changes, then override
  // the accent with today's verse-card colour so they stay in sync each day.
  useEffect(() => {
    applyPalette(colourId, isDark);
    // In 'daily' mode the daily-verse accent overrides the palette so the whole
    // app matches the verse card. In 'fixed' mode we keep the chosen palette.
    if (colorMode !== 'fixed') applyDailyAccent(isDark);
  }, [colourId, isDark, colorMode]);

  // Apply 1611 vs Modern theme and dyslexic font
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const use1611 = localStorage.getItem('kjb-theme-1611') !== 'false';
      if (!use1611) {
        root.setAttribute('data-theme-modern', 'true');
      } else {
        root.removeAttribute('data-theme-modern');
      }
      
      // Apply dyslexic font globally
      const useDyslexic = localStorage.getItem('kjb-dyslexic-font') === 'true';
      if (useDyslexic) {
        root.setAttribute('data-dyslexic-font', 'true');
      } else {
        root.removeAttribute('data-dyslexic-font');
      }
    };

    applyTheme();
    
    // Listen for storage changes to sync theme across tabs
    const handleStorage = () => applyTheme();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Listen for dyslexic font changes and update globally
  useEffect(() => {
    const handleFontChange = () => {
      const root = document.documentElement;
      const useDyslexic = localStorage.getItem('kjb-dyslexic-font') === 'true';
      if (useDyslexic) {
        root.setAttribute('data-dyslexic-font', 'true');
      } else {
        root.removeAttribute('data-dyslexic-font');
      }
    };
    
    window.addEventListener('dyslexic-font-change', handleFontChange);
    return () => window.removeEventListener('dyslexic-font-change', handleFontChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, colourId, setColourId, colorMode, setColorMode, toggleTheme }}>
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