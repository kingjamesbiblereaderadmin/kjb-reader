import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Renders today's daily verse (Washington / US Eastern time) as raw plain text,
// mimicking a /dailyverse.txt file. Fetches from the dailyVerseTxt backend
// function, which auto-updates each day and uses zero credits.
export default function DailyVerseTxt() {
  const [text, setText] = useState('Loading…');

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke('dailyVerseTxt', {})
      .then((res) => {
        if (active) setText(typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
      })
      .catch((err) => {
        if (active) setText('Error: ' + err.message);
      });
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