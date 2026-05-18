import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, BookOpen } from 'lucide-react';
import { getSavedVerses, removeSavedVerse } from '@/lib/savedVerses';

export default function SavedVersesPage() {
  const [saved, setSaved] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setSaved(getSavedVerses());
  }, []);

  const handleRemove = (abbr, chapter, verse) => {
    removeSavedVerse(abbr, chapter, verse);
    setSaved(getSavedVerses());
  };

  const handleNavigate = (entry) => {
    try {
      localStorage.setItem('kjb-position', JSON.stringify({ abbr: entry.abbr, chapter: entry.chapter, verse: entry.verse }));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate('/read'), 150);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Bookmark className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Saved Verses</h1>
        <p className="font-sans text-sm text-muted-foreground">{saved.length} verse{saved.length !== 1 ? 's' : ''} saved</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-serif text-xl text-muted-foreground mb-2">No saved verses yet</p>
          <p className="font-sans text-sm text-muted-foreground mb-6">Tap any verse while reading and press the bookmark icon to save it.</p>
          <button
            onClick={() => navigate('/read')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-sans text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" />
            Start Reading
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((entry, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 flex items-start gap-4"
            >
              <button
                onClick={() => handleNavigate(entry)}
                className="flex-1 text-left"
              >
                <p className="font-sans text-xs font-semibold text-accent tracking-wide uppercase mb-2">
                  {entry.ref}
                </p>
                <blockquote className="font-serif text-lg text-foreground leading-relaxed">
                  "{entry.text}"
                </blockquote>
              </button>
              <button
                onClick={() => handleRemove(entry.abbr, entry.chapter, entry.verse)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 mt-0.5"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}