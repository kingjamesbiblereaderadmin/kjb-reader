// App-wide accessibility font preference.
// Applies a font override to the entire app via a data attribute on <html>.
// Options: 'default' | 'dyslexic' | 'hyperlegible'

const STORAGE_KEY = 'kjb-a11y-font';

export function getAccessibilityFont() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return ['dyslexic', 'hyperlegible'].includes(v) ? v : 'default';
  } catch {
    return 'default';
  }
}

export function applyAccessibilityFont(font) {
  const root = document.documentElement;
  if (font === 'dyslexic' || font === 'hyperlegible') {
    root.setAttribute('data-a11y-font', font);
  } else {
    root.removeAttribute('data-a11y-font');
  }
}

export function setAccessibilityFont(font) {
  try {
    if (font === 'default') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, font);
  } catch {}
  applyAccessibilityFont(font);
}