import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, RefreshCw, Image, Shuffle, BookOpen } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';

const TEST_VERSES = [
  {
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    ref: 'John 3:16',
    category: 'Salvation'
  },
  {
    text: 'The LORD is my shepherd; I shall not want.',
    ref: 'Psalm 23:1',
    category: 'Comfort'
  },
  {
    text: 'In the beginning God created the heaven and the earth.',
    ref: 'Genesis 1:1',
    category: 'Creation'
  },
  {
    text: 'Jesus wept.',
    ref: 'John 11:35',
    category: 'Short'
  },
  {
    text: 'And Jesus said unto them, Come ye yourselves apart into a desert place, and rest a while: for there were many coming and going, and they had no leisure so much as to eat. And they departed into a desert place by ship privately. And the people saw them departing, and many knew him, and ran afoot thither out of all cities, and outwent them, and came together unto him. And Jesus, when he came out, saw much people, and was moved with compassion toward them, because they were as sheep not having a shepherd: and he began to teach them many things.',
    ref: 'Mark 6:31-34',
    category: 'Long'
  },
  {
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
    ref: 'Philippians 4:6',
    category: 'Peace'
  }
];

export default function TestDailyVerse() {
  const [selectedVerse, setSelectedVerse] = useState(TEST_VERSES[0]);
  const [isOffline, setIsOffline] = useState(false);
  const [customBook, setCustomBook] = useState('John');
  const [customChapter, setCustomChapter] = useState(3);
  const [customVerse, setCustomVerse] = useState(16);
  const [useCustom, setUseCustom] = useState(false);
  const verseCardRef = useRef(null);

  const BIBLE_BOOKS = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
    '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ];

  const handleDownload = async () => {
    if (!verseCardRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(verseCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      const link = document.createElement('a');
      const cat = useCustom ? `${customBook}-${customChapter}-${customVerse}` : selectedVerse.category;
      link.download = `test-daily-verse-${dateStr}-${cat}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to generate image. Please try again.');
    }
  };

  const fetchCustomVerse = async () => {
    try {
      const response = await base44.functions.invoke('bibleApi', {
        action: 'getVerse',
        book: customBook,
        chapter: customChapter,
        verse: customVerse
      });
      
      if (response?.data?.verse) {
        const verseData = {
          text: response.data.verse.text,
          ref: `${customBook} ${customChapter}:${customVerse}`,
          category: 'Custom'
        };
        setSelectedVerse(verseData);
        setUseCustom(true);
      }
    } catch (err) {
      console.error('Failed to fetch verse:', err);
      alert('Failed to fetch verse. Please try again.');
    }
  };

  const pickRandomVerse = () => {
    const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    const randomChapter = Math.floor(Math.random() * 50) + 1;
    const randomVerse = Math.floor(Math.random() * 30) + 1;
    setCustomBook(randomBook);
    setCustomChapter(randomChapter);
    setCustomVerse(randomVerse);
    
    // Auto-fetch the random verse
    setTimeout(() => {
      fetchCustomVerse();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Daily Verse Card Tester</h1>
          <p className="font-sans text-sm text-muted-foreground">Test different verse lengths and formats with download capability</p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              <span className="font-sans text-sm font-medium text-foreground">Select Test Verse:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEST_VERSES.map((verse, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedVerse(verse);
                    setUseCustom(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-all ${
                    selectedVerse === verse && !useCustom
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                  }`}
                >
                  {verse.category}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Verse Picker */}
          <div className="pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-sans text-sm font-medium text-foreground">Pick Any Verse:</span>
              </div>
              <button
                onClick={pickRandomVerse}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/20 text-accent font-sans text-xs font-medium hover:bg-accent/30 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Random
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block font-sans text-xs text-muted-foreground mb-1">Book</label>
                <select
                  value={customBook}
                  onChange={(e) => setCustomBook(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-sans text-sm"
                >
                  {BIBLE_BOOKS.map(book => (
                    <option key={book} value={book}>{book}</option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="block font-sans text-xs text-muted-foreground mb-1">Chapter</label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={customChapter}
                  onChange={(e) => setCustomChapter(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-sans text-sm"
                />
              </div>
              <div className="w-20">
                <label className="block font-sans text-xs text-muted-foreground mb-1">Verse</label>
                <input
                  type="number"
                  min="1"
                  max="176"
                  value={customVerse}
                  onChange={(e) => setCustomVerse(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-sans text-sm"
                />
              </div>
              <button
                onClick={fetchCustomVerse}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Load
              </button>
            </div>
            {useCustom && (
              <p className="font-sans text-xs text-primary mt-2">
                Currently showing: {customBook} {customChapter}:{customVerse}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOffline}
                  onChange={(e) => setIsOffline(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-sans text-sm text-foreground">Simulate Offline Mode</span>
              </label>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Download Card
            </button>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="font-sans text-xs text-muted-foreground">
              <strong>Verse length:</strong> {selectedVerse.text.length} characters | 
              <strong> Words:</strong> {selectedVerse.text.split(/\s+/).length}
            </p>
          </div>
        </div>

        {/* Preview Card */}
        <div className="space-y-2">
          <h2 className="font-sans text-sm font-semibold text-foreground">Live Preview:</h2>
          <div ref={verseCardRef}>
            <DailyVerseImage
              verse={selectedVerse}
              isOffline={isOffline}
              onClick={() => {}}
              onToggleNotif={() => {}}
              notifEnabled={false}
            />
          </div>
        </div>

        {/* Tips */}
        <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-2">
          <h3 className="font-sans text-sm font-semibold text-foreground">Testing Tips:</h3>
          <ul className="font-sans text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Test different verse lengths to ensure proper text scaling</li>
            <li>Try offline mode to see the alternate header</li>
            <li>Download cards to verify export quality</li>
            <li>Change backgrounds and text styles in the card's menu</li>
            <li>Test on mobile viewport for responsive behavior</li>
          </ul>
        </div>
      </div>
    </div>
  );
}