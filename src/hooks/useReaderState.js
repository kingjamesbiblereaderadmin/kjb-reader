import { useState, useEffect, useCallback } from 'react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getAccessibilityFont, setAccessibilityFont, applyReaderFont } from '@/lib/accessibilityFont';

const STORAGE_KEY = 'kjb-position';

export function loadPosition() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (p?.abbr && BIBLE_BOOKS.find(b => b.abbr === p.abbr)) return p;
  } catch {}
  return { abbr: 'GEN', chapter: 1, verse: null };
}

export function savePosition(abbr, chapter, verse = null) {
  try {
    let verseEnd = null;
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (prev.abbr === abbr && prev.chapter === chapter && prev.verse === verse && prev.verseEnd) {
        verseEnd = prev.verseEnd;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter, verse, verseEnd }));
  } catch {}
}

export function useReaderState() {
  const [pos, setPos] = useState(() => {
    const p = loadPosition();
    return { ...p, verse: null };
  });
  
  const [zoomLevel, setZoomLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('kjb-zoom') || '100'); } catch { return 100; }
  });
  
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const a11yActive = a11yFont !== 'default';

  useEffect(() => {
    if (a11yFont !== 'default' && fontFamily === 'cursive') {
      setFontFamily('serif');
      try { localStorage.setItem('kjb-reader-font-family', 'serif'); } catch {}
    }
  }, []);

  const setZoomPersist = useCallback((next) => {
    setZoomLevel(next);
    try { localStorage.setItem('kjb-zoom', String(next)); } catch {}
  }, []);

  const handleFontChange = useCallback((font) => {
    if (font === 'dyslexic' || font === 'hyperlegible') {
      setAccessibilityFont(font);
      setA11yFont(font);
      window.dispatchEvent(new Event('storage'));
      return;
    }
    try { localStorage.setItem('kjb-reader-font-family', font); } catch {}
    setFontFamily(font);
    applyReaderFont(font);
    if (a11yFont !== 'default') {
      setAccessibilityFont('default');
      setA11yFont('default');
    }
    window.dispatchEvent(new Event('storage'));
  }, [a11yFont]);

  const getFontFamilyValue = useCallback((family) => {
    if (family === 'cursive') return "'Dancing Script', cursive";
    if (family === 'serif') return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
    if (family === 'sans-serif') return "'Inter', system-ui, -apple-system, sans-serif";
    if (family === 'monospace') return "'Courier New', monospace";
    if (family === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
    if (family === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
    return family;
  }, []);

  return {
    pos,
    setPos,
    zoomLevel,
    setZoomLevel: setZoomPersist,
    fontFamily,
    setFontFamily,
    a11yFont,
    setA11yFont,
    a11yActive,
    handleFontChange,
    getFontFamilyValue,
  };
}