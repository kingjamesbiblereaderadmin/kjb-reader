// Single source of truth for the app's keyboard shortcuts.
// Used by both the shortcuts overlay (Shift+?) and the Settings list.
export const SHORTCUTS = [
  { keys: ['Ctrl', 'F'], macKeys: ['⌘', 'F'], label: 'Focus the search bar' },
  { keys: ['Alt', '←'], macKeys: ['⌥', '←'], label: 'Go back' },
  { keys: ['Alt', 'H'], macKeys: ['⌥', 'H'], label: 'Go to Home' },
  { keys: ['?'], macKeys: ['?'], label: 'Show keyboard shortcuts' },
];

export const isMac = () =>
  typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);