import { useEffect } from 'react';

// Serves the full King James Bible plain-text file at /bible.txt.
// The full text is hosted as a static file, so we redirect straight to it —
// this delivers the real, raw .txt (no app chrome, no rendering layer).
const BIBLE_TXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/9b0c1d939_bible.txt';

export default function BibleTxt() {
  useEffect(() => {
    window.location.replace(BIBLE_TXT_URL);
  }, []);

  return null;
}