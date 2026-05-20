import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, ChevronDown } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchVerseCount } from '@/lib/bibleApi';
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseSelector from '@/components/bible/VerseSelector';

export default function ContentsPage() {
  const navigate = useNavigate();
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showVerseSelector, setShowVerseSelector] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [verseCount, setVerseCount] = useState(0);

  const currentBook = selectedBook ? BIBLE_BOOKS.find(b => b.abbr === selectedBook) : null;

  const goTo = (abbr, chapter, verse = null) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse })); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate('/read'), 150);
  };

  const handleSelectBook = (book, isTitlePage) => {
    if (isTitlePage) {
      setSelectedBook(book.abbr);
      setSelectedChapter(0);
      setSelectedVerse(null);
      setTimeout(() => goTo(book.abbr, 0, null), 150);
    } else {
      setSelectedBook(book.abbr);
      setSelectedChapter(null);
      setSelectedVerse(null);
      setShowBookSelector(false);
      setShowChapterSelector(true);
    }
  };

  const handleSelectChapter = (chapter, showVerseSelectorNext) => {
    setSelectedChapter(chapter);
    if (showVerseSelectorNext) {
      setShowChapterSelector(false);
      // Fetch verse count for selected chapter
      fetchVerseCount(currentBook.apiName, chapter).then(count => {
        setVerseCount(count);
        if (count > 0) {
          setShowVerseSelector(true);
        } else {
          setTimeout(() => goTo(selectedBook, chapter, null), 150);
        }
      });
    }
  };

  const handleSelectVerse = (verse) => {
    setSelectedVerse(verse);
    setShowVerseSelector(false);
    setTimeout(() => goTo(selectedBook, selectedChapter, verse), 150);
  };

  useEffect(() => {
    if (selectedBook && selectedChapter && selectedChapter > 0) {
      fetchVerseCount(currentBook.apiName, selectedChapter).then(count => {
        setVerseCount(count);
      });
    }
  }, [selectedBook, selectedChapter]);

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

      {/* Selection Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowBookSelector(true)}
          className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-sans font-semibold text-sm hover:opacity-90 transition-colors flex items-center justify-between"
        >
          <span>
            {selectedBook && selectedChapter 
              ? `${currentBook?.name} ${selectedChapter}${selectedVerse ? `:${selectedVerse}` : ''}` 
              : 'Select a Book'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Book Selector Popup */}
      {showBookSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative">
            <BookSelector
              currentAbbr={selectedBook}
              onSelect={handleSelectBook}
              onClose={() => setShowBookSelector(false)}
            />
          </div>
        </div>
      )}

      {/* Chapter Selector Popup */}
      {showChapterSelector && currentBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative">
            <ChapterSelector
              totalChapters={currentBook.chapters}
              currentChapter={selectedChapter}
              onSelect={handleSelectChapter}
              onClose={() => {
                setShowChapterSelector(false);
                setSelectedBook(null);
                setSelectedChapter(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Verse Selector Popup */}
      {showVerseSelector && verseCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative">
            <VerseSelector
              totalVerses={verseCount}
              currentVerse={selectedVerse}
              onSelect={handleSelectVerse}
              onClose={() => setShowVerseSelector(false)}
            />
          </div>
        </div>
      )}

      <p className="text-center font-sans text-xs text-muted-foreground">
        Tap "Select a Book" to choose a book, chapter, and verse
      </p>
    </div>
  );
}