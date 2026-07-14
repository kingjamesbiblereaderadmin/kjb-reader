// Adjustable layout settings for the ShareCard / daily verse image.
// Values persist in localStorage so the admin can tune spacing, padding,
// borders and text sizing from Dev Tools without touching code. ShareCard
// reads these at render time; changing them dispatches a 'storage' event so
// any mounted card re-reads and re-fits immediately.

const KEY = 'kjb-sharecard-settings-v1';

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

export function getShareCardSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...SHARECARD_DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...SHARECARD_DEFAULTS };
}

export function saveShareCardSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export function resetShareCardSettings() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('storage'));
  } catch {}
}