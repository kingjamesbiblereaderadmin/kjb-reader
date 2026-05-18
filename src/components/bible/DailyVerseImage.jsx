import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';

const VERSE_BACKGROUNDS = [
  { gradient: 'from-blue-600 to-purple-600', accent: 'text-blue-200' },
  { gradient: 'from-rose-600 to-pink-600', accent: 'text-rose-200' },
  { gradient: 'from-emerald-600 to-teal-600', accent: 'text-emerald-200' },
  { gradient: 'from-amber-600 to-orange-600', accent: 'text-amber-200' },
  { gradient: 'from-indigo-600 to-blue-600', accent: 'text-indigo-200' },
  { gradient: 'from-violet-600 to-purple-600', accent: 'text-violet-200' },
  { gradient: 'from-cyan-600 to-blue-600', accent: 'text-cyan-200' }
];

export default function DailyVerseImage({ verse }) {
  const dow = new Date().getDay();
  const { gradient, accent } = VERSE_BACKGROUNDS[dow];

  return (
    <div className={`w-full bg-gradient-to-br ${gradient} rounded-2xl shadow-lg px-8 pt-5 pb-8 text-center text-white`}>
      <p className={`font-sans text-xs font-semibold tracking-widest uppercase mb-4 opacity-80 ${accent}`}>
        Verse of the Day
      </p>
      <blockquote className="font-serif text-2xl md:text-3xl font-bold leading-relaxed mb-6">
        "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
      </blockquote>
      <p className="font-sans text-base font-semibold opacity-95">— {verse.ref} (KJB)</p>
      <div className={`mt-5 w-12 h-1 ${accent} mx-auto opacity-75`} />
    </div>
  );
}