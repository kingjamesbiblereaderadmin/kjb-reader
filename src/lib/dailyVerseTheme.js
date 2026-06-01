// Single source of truth for the daily verse-card gradient (one per weekday).
// Used by the daily card AND the app-wide accent colour so they stay in sync,
// and both change automatically each day.

export const VERSE_BACKGROUNDS = [
  { gradient: 'from-blue-700 via-indigo-600 to-purple-600', accent: 'text-blue-200', pill: '79, 70, 229', hex: ['#1d4ed8', '#9333ea'] },      // Sun — blue/purple
  { gradient: 'from-emerald-700 via-teal-600 to-cyan-600', accent: 'text-emerald-200', pill: '13, 148, 136', hex: ['#047857', '#0891b2'] },  // Mon — green/teal
  { gradient: 'from-rose-700 via-pink-600 to-fuchsia-600', accent: 'text-rose-200', pill: '219, 39, 119', hex: ['#be123c', '#c026d3'] },      // Tue — rose/pink
  { gradient: 'from-amber-600 via-orange-600 to-red-600', accent: 'text-amber-200', pill: '194, 65, 12', hex: ['#d97706', '#dc2626'] },       // Wed — warm sunset
  { gradient: 'from-cyan-700 via-sky-600 to-blue-600', accent: 'text-cyan-200', pill: '2, 132, 199', hex: ['#0e7490', '#2563eb'] },          // Thu — ocean blue
  { gradient: 'from-violet-700 via-purple-600 to-pink-600', accent: 'text-violet-200', pill: '147, 51, 234', hex: ['#6d28d9', '#db2777'] },   // Fri — violet/pink
  { gradient: 'from-slate-800 via-indigo-800 to-purple-800', accent: 'text-slate-300', pill: '55, 48, 163', hex: ['#1e293b', '#5b21b6'] }     // Sat — deep night
];

// Today's verse-card background (matches the daily card).
export function getTodayVerseBackground() {
  return VERSE_BACKGROUNDS[new Date().getDay()];
}

// Convert a hex colour to an "H S% L%" string and darken it by `darken` (0..1)
// so the accent is a deeper shade of the card colour (good contrast for links).
export function hexToHslString(hex, darken = 0) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  l = Math.max(0, l * (1 - darken));
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Build a light, low-saturation tint from a hex colour: keeps the hue of the
// verse card but uses a high lightness / low saturation so boxes look subtly
// tinted (not loud). `isDark` produces a dark tinted surface instead.
function tintFromHex(hex, isDark) {
  const [h, s] = hexToHslString(hex).split(' ');
  const hue = parseInt(h, 10);
  if (isDark) return `${hue} 22% 14%`;
  return `${hue} 30% 95%`;
}

// Apply today's verse-card colour across the WHOLE app theme — accent, primary,
// focus rings, box surfaces, borders, and the page background — so the entire
// app matches the daily verse card and changes automatically each day.
export function applyDailyAccent(isDark = document.documentElement.classList.contains('dark')) {
  try {
    const bg = getTodayVerseBackground();
    const root = document.documentElement;
    const hue = parseInt(hexToHslString(bg.hex[1]).split(' ')[0], 10);

    // Accent (links, icons, highlights) — second gradient stop, darkened.
    const accent = hexToHslString(bg.hex[1], 0.22);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--ring', accent);
    root.style.setProperty('--sidebar-ring', accent);

    // Primary (buttons, key actions) — first gradient stop, tuned per mode.
    const primary = isDark ? hexToHslString(bg.hex[1], 0.1) : hexToHslString(bg.hex[0], 0.05);
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--sidebar-primary', primary);

    // Box surfaces — derived from the same hue.
    const surface = tintFromHex(bg.hex[1], isDark);
    root.style.setProperty('--card', surface);
    root.style.setProperty('--secondary', surface);
    root.style.setProperty('--muted', surface);

    // Borders + page background take the same hue at very low saturation.
    root.style.setProperty('--border', isDark ? `${hue} 20% 22%` : `${hue} 25% 89%`);
    root.style.setProperty('--input', isDark ? `${hue} 20% 22%` : `${hue} 25% 89%`);
    root.style.setProperty('--background', isDark ? `${hue} 28% 8%` : `${hue} 35% 99%`);
    root.style.setProperty('--sidebar-background', isDark ? `${hue} 28% 9%` : `${hue} 30% 98%`);
    root.style.setProperty('--sidebar-accent', surface);
  } catch {}
}