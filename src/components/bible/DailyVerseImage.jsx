import React, { useRef, useState } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

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
  const defaultBg = VERSE_BACKGROUNDS[dow];
  

  
  const verseRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  
  const bgStyle = {};
  const gradientClass = `bg-gradient-to-br ${defaultBg.gradient}`;
  const accentClass = defaultBg.accent;

  const handleDownload = async (e) => {
    e.stopPropagation();
    setCapturing(true);
    try {
      const canvas = await html2canvas(verseRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `daily-verse-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
    }
    setCapturing(false);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    setCapturing(true);
    try {
      const canvas = await html2canvas(verseRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `daily-verse-${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Daily Verse - KJB Reader',
          text: `"${verse.text}" — ${verse.ref}`,
          files: [file],
        });
      } else {
        // Fallback: copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        alert('Image copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to share image:', err);
      // Fallback to download
      handleDownload(e);
    }
    setCapturing(false);
  };

  return (
    <div ref={verseRef} className={`w-full ${gradientClass} rounded-2xl shadow-lg px-8 pt-5 pb-8 text-center text-white relative`} style={bgStyle}>
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1.5 z-10">
        <button
          onClick={handleShare}
          disabled={capturing}
          className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur transition-colors disabled:opacity-50"
          title="Share verse image"
          type="button"
        >
          {capturing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
          ) : (
            <Share2 className="w-4 h-4 text-white" />
          )}
        </button>
        <button
          onClick={handleDownload}
          disabled={capturing}
          className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur transition-colors disabled:opacity-50"
          title="Download verse image"
          type="button"
        >
          {capturing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
          ) : (
            <Download className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
      
      <p className={`font-sans text-xs font-semibold tracking-widest uppercase mb-4 opacity-80 ${accentClass}`}>
        Verse of the Day
      </p>
      <blockquote className="font-serif text-2xl md:text-3xl font-bold leading-relaxed mb-6">
        "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
      </blockquote>
      <p className="font-sans text-base font-semibold opacity-95">— {verse.ref} (KJB)</p>
      <div className={`mt-5 w-12 h-1 ${accentClass} mx-auto opacity-75`} />
    </div>
  );
}