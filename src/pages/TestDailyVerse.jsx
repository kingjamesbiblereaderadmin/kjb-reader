import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, RefreshCw, Image } from 'lucide-react';
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
  const verseCardRef = useRef(null);

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
      link.download = `test-daily-verse-${dateStr}-${selectedVerse.category}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to generate image. Please try again.');
    }
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
                  onClick={() => setSelectedVerse(verse)}
                  className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-all ${
                    selectedVerse === verse
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                  }`}
                >
                  {verse.category}
                </button>
              ))}
            </div>
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