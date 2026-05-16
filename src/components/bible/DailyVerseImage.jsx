import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';

const VERSE_BACKGROUNDS = [
{ gradient: 'from-blue-600 to-purple-600', accent: 'text-blue-200' }, // Mon
{ gradient: 'from-rose-600 to-pink-600', accent: 'text-rose-200' }, // Tue
{ gradient: 'from-emerald-600 to-teal-600', accent: 'text-emerald-200' }, // Wed
{ gradient: 'from-amber-600 to-orange-600', accent: 'text-amber-200' }, // Thu
{ gradient: 'from-indigo-600 to-blue-600', accent: 'text-indigo-200' }, // Fri
{ gradient: 'from-violet-600 to-purple-600', accent: 'text-violet-200' }, // Sat
{ gradient: 'from-cyan-600 to-blue-600', accent: 'text-cyan-200' } // Sun
];

export default function RandomVerseImage({ verse }) {
  const dow = new Date().getDay();
  const { gradient, accent } = VERSE_BACKGROUNDS[dow];

  return (
    <div className={`w-full bg-gradient-to-br ${gradient} rounded-2xl shadow-lg p-8 md:p-12 text-center text-white`}>
      <p className="font-sans text-xs tracking-widest uppercase font-semibold mb-6 opacity-90"></p>
      <blockquote className="font-serif text-2xl md:text-3xl font-bold leading-relaxed mb-6">
        "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
      </blockquote>
      <p className="font-sans text-base font-semibold opacity-95">— {verse.ref} (KJB)</p>
      <div className={`mt-6 w-12 h-1 ${accent} mx-auto opacity-75`} />
    </div>);

}