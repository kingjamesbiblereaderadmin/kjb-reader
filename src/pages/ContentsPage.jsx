import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, ChevronRight, ChevronDown } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchVerseCount } from '@/lib/bibleApi';

export default function ContentsPage() {
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTestament, setSelectedTestament] = useState('old');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [verseCounts, setVerseCounts] = useState({});

  const books = BIBLE_BOOKS.filter(b => b.testament === selectedTestament);
  const currentBook = selectedBook ? BIBLE_BOOKS.find(b => b.abbr === selectedBook) : null;

  const goTo = (abbr, chapter, verse = null) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse })); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate('/read'), 150);
    setShowPicker(false);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book.abbr);
    setSelectedChapter(1);
    setSelectedVerse(null);
    const key = `${book.abbr}:1`;
    if (!verseCounts[key]) {
      fetchVerseCount(book.apiName, 1).then(count => {
        setVerseCounts(prev => ({ ...prev, [key]: count }));
      });
    }
  };

  const handleSelectChapter = (c) => {
    setSelectedChapter(c);
    setSelectedVerse(null);
    const key = `${selectedBook}:${c}`;
    if (!verseCounts[key]) {
      fetchVerseCount(currentBook.apiName, c).then(count => {
        setVerseCounts(prev => ({ ...prev, [key]: count }));
      });
    }
  };

  useEffect(() => {
    if (selectedBook && selectedChapter !== null && !verseCounts[`${selectedBook}:${selectedChapter}`]) {
      fetchVerseCount(currentBook.apiName, selectedChapter).then(count => {
        setVerseCounts(prev => ({ ...prev, [`${selectedBook}:${selectedChapter}`]: count }));
      });
    }
  }, [selectedBook, selectedChapter]);

  const vcKey = currentBook ? `${currentBook.abbr}:${selectedChapter}` : null;
  const vc = vcKey ? verseCounts[vcKey] || 0 : 0;
  const isViewingTitlePage = selectedChapter === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <List className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Table of Contents</h1>
        <p className="font-sans text-sm text-muted-foreground">King James Bible — Pure Cambridge Edition</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Navigation Dropdown */}
      <div className="mb-8">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-sans font-semibold text-sm hover:opacity-90 transition-colors flex items-center justify-between"
        >
          <span>
            {selectedBook ? `${currentBook?.name} ${selectedChapter}${selectedVerse ? `:${selectedVerse}` : ''}` : 'Select a passage'}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
            <div className="absolute left-4 right-4 top-32 z-40 bg-card border border-border rounded-xl shadow-xl max-h-96 overflow-y-auto">
              
              {/* Testament Selection */}
              {!selectedBook && (
                <div className="p-4 space-y-2 border-b border-border">
                  <p className="font-serif font-semibold text-foreground text-sm mb-3">Select Testament</p>
                  <button
                    onClick={() => setSelectedTestament('old')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors ${
                      selectedTestament === 'old' ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    Old Testament (39 books)
                  </button>
                  <button
                    onClick={() => setSelectedTestament('new')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors ${
                      selectedTestament === 'new' ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    New Testament (27 books)
                  </button>
                </div>
              )}

              {/* Book Selection */}
              {!selectedBook && (
                <div className="p-4 space-y-1">
                  {books.map(book => (
                    <button
                      key={book.abbr}
                      onClick={() => handleSelectBook(book)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans hover:bg-secondary text-foreground transition-colors"
                    >
                      {book.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Chapter Selection */}
              {selectedBook && !isViewingTitlePage && (
                <div className="p-4">
                  <button
                    onClick={() => { setSelectedBook(null); setSelectedChapter(null); setSelectedVerse(null); }}
                    className="text-xs text-accent hover:underline mb-3 font-sans"
                  >
                    ← Back to books
                  </button>
                  <p className="font-serif font-semibold text-foreground text-sm mb-3">Select Chapter</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(c => (
                      <button
                        key={c}
                        onClick={() => handleSelectChapter(c)}
                        className={`h-8 rounded-lg font-sans text-xs font-medium transition-colors ${
                          selectedChapter === c
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Verse Selection */}
                  {vc > 0 && (
                    <div className="mt-4">
                      <p className="font-serif font-semibold text-foreground text-sm mb-2">Select Verse (optional)</p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {Array.from({ length: vc }, (_, i) => i + 1).map(v => (
                          <button
                            key={v}
                            onClick={() => setSelectedVerse(selectedVerse === v ? null : v)}
                            className={`h-8 rounded-lg font-sans text-xs font-medium transition-colors ${
                              selectedVerse === v
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Read Button */}
                  <button
                    onClick={() => goTo(selectedBook, selectedChapter, selectedVerse)}
                    className="w-full mt-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-sans font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Read →
                  </button>
                </div>
              )}

              {/* Title Page Selection - Only for Genesis and Matthew */}
              {selectedBook && isViewingTitlePage && (selectedBook === 'GEN' || selectedBook === 'MAT') && (
                <div className="p-4">
                  <button
                    onClick={() => { setSelectedBook(null); setSelectedChapter(null); setSelectedVerse(null); }}
                    className="text-xs text-accent hover:underline mb-3 font-sans"
                  >
                    ← Back to books
                  </button>
                  <p className="font-serif font-semibold text-foreground text-sm mb-3">{currentBook?.name}</p>
                  <button
                    onClick={() => goTo(selectedBook, 0, null)}
                    className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-sans font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    View Title Page →
                  </button>
                  <button
                    onClick={() => handleSelectChapter(1)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-sans font-semibold text-sm hover:bg-accent/20 transition-colors"
                  >
                    Go to Chapter 1 →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <p className="text-center font-sans text-xs text-muted-foreground">
        Use the navigation dropdown above to select a book, chapter, and verse
      </p>
    </div>
  );
}