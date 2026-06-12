import React, { useEffect, useState } from 'react';

// Displays the full King James Bible plain-text inline in the browser at
// /bible.txt — fetches the hosted file and renders it as text (not a download).
const BIBLE_TXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/9b0c1d939_bible.txt';

export default function BibleTxt() {
  const [text, setText] = useState('Loading the full Bible…');

  useEffect(() => {
    let active = true;
    fetch(BIBLE_TXT_URL)
      .then((res) => res.text())
      .then((t) => { if (active) setText(t); })
      .catch((err) => { if (active) setText('Error: ' + err.message); });
    return () => { active = false; };
  }, []);

  return (
    <pre
      style={{
        margin: 0,
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: '#fff',
        color: '#000',
        minHeight: '100vh',
      }}
    >
      {text}
    </pre>
  );
}