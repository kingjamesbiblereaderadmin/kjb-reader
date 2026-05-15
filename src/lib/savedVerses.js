const SAVED_KEY = 'kjb-saved-verses';

export function getSavedVerses() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function isVerseSaved(abbr, chapter, verse) {
  return getSavedVerses().some(v => v.abbr === abbr && v.chapter === chapter && v.verse === verse);
}

export function saveVerse(entry) {
  const saved = getSavedVerses();
  if (!isVerseSaved(entry.abbr, entry.chapter, entry.verse)) {
    saved.unshift(entry); // newest first
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }
}

export function removeSavedVerse(abbr, chapter, verse) {
  const saved = getSavedVerses().filter(v => !(v.abbr === abbr && v.chapter === chapter && v.verse === verse));
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}