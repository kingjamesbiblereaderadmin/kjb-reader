// Adjustable layout settings for the ShareCard / daily verse image.
// Values persist in localStorage so the admin can tune spacing, padding,
// borders and text sizing from Dev Tools without touching code. ShareCard
// reads these at render time; changing them dispatches a 'storage' event so
// any mounted card re-reads and re-fits immediately.
//
// There are two layers:
//  1. GLOBAL defaults (KEY) — used every day unless a per-day override exists.
//  2. PER-DAY overrides (PER_DAY_KEY) — a map of { 'YYYY-MM-DD': {settings} }.
//     When the card renders on a date that has an override, that override is
//     used instead of the global settings.

const KEY = 'kjb-sharecard-settings-v1';
const PER_DAY_KEY = 'kjb-sharecard-settings-perday-v1';

// Defaults mirror the original hardcoded ShareCard constants so behaviour is
// unchanged until the admin adjusts something.
export const SHARECARD_DEFAULTS = {
  outerPadTop: 32,
  outerPadBottom: 40,
  outerPadX: 72,
  headerDividerGap: 36,   // margin below the header divider
  footerGapTop: 16,       // margin above the footer curve
  footerGapBottom: 26,    // margin below the footer curve
  panelPad: 40,           // readability panel inner padding
  panelRadius: 24,        // readability panel corner radius
  panelBorderWidth: 0,    // readability panel border thickness
  maxFontSize: 108,
  minFontSize: 15,
  heightSafety: 1.1,      // fit inflation factor
};

// Format a JS Date (or today) as a local YYYY-MM-DD key.
export function toDateKey(dateObj) {
  const d = dateObj || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The global (every-day) settings.
export function getGlobalShareCardSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...SHARECARD_DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...SHARECARD_DEFAULTS };
}

// The full per-day override map.
function getPerDayMap() {
  try {
    const raw = localStorage.getItem(PER_DAY_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch {}
  return {};
}

// The effective settings for a given date: per-day override if present,
// otherwise the global settings. Called by ShareCard at render time (no arg
// = today).
export function getShareCardSettings(dateKey) {
  const key = dateKey || toDateKey();
  const perDay = getPerDayMap();
  if (perDay[key]) return { ...SHARECARD_DEFAULTS, ...perDay[key] };
  return getGlobalShareCardSettings();
}

// Save the GLOBAL (every-day) settings.
export function saveShareCardSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

// Save settings for one specific day only.
export function savePerDayShareCardSettings(dateKey, settings) {
  try {
    const map = getPerDayMap();
    map[dateKey] = settings;
    localStorage.setItem(PER_DAY_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

// Remove a specific day's override (falls back to global).
export function clearPerDayShareCardSettings(dateKey) {
  try {
    const map = getPerDayMap();
    delete map[dateKey];
    localStorage.setItem(PER_DAY_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export function hasPerDayShareCardSettings(dateKey) {
  return !!getPerDayMap()[dateKey];
}

export function resetShareCardSettings() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('storage'));
  } catch {}
}