import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, RefreshCw, Image, Shuffle, BookOpen, Search, Type, Link as LinkIcon, Eye, Columns, Maximize2 } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link as RouterLink } from 'react-router-dom';

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

const READING_MODES = [
  { id: 'line', label: 'Line', icon: Type },
  { id: 'paragraph', label: 'Paragraph', icon: Columns },
  { id: 'full', label: 'Full Screen', icon: Maximize2 },
];

const TEST_LINKS = [
  { label: 'Home', path: '/', clicked: false },
  { label: 'Bible Reader', path: '/read', clicked: false },
  { label: 'Gospel', path: '/gospel', clicked: false },
  { label: 'Resources', path: '/resources', clicked: false },
  { label: 'About', path: '/about', clicked: false },
  { label: 'Contents', path: '/contents', clicked: false },
  { label: 'Settings', path: '/settings', clicked: false },
  { label: 'Search', path: '/search', clicked: false },
  { label: 'Saved Verses', path: '/saved', clicked: false },
  { label: 'Daily Verse Test', path: '/test-daily-verse', clicked: false },
];

export default function TestAllFeatures() {
  // Daily Verse state
  const [selectedVerse, setSelectedVerse] = useState(TEST_VERSES[0]);
  const [isOffline, setIsOffline] = useState(false);
  const [customBook, setCustomBook] = useState('John');
  const [customChapter, setCustomChapter] = useState(3);
  const [customVerse, setCustomVerse] = useState(16);
  const [useCustom, setUseCustom] = useState(false);
  const verseCardRef = useRef(null);

  // Random chapter state
  const [randomChapter, setRandomChapter] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Read mode state
  const [readingMode, setReadingMode] = useState('line');
  const [twoColumn, setTwoColumn] = useState(false);
  const [cursive, setCursive] = useState(false);
  const [testVerse, setTestVerse] = useState({ book: 'John', chapter: 3, verse: 16 });

  // Links state
  const [testLinks, setTestLinks] = useState(TEST_LINKS);

  // Font test key to force re-render when changing fonts
  const [fontTestKey, setFontTestKey] = useState(0);

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
      const cat = useCustom ? `${customBook}-${customChapter}-${customVerse}` : selectedVerse.category;
      const link = document.createElement('a');
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
        action: 'getChapter',
        book: customBook,
        chapter: customChapter
      });
      
      if (response?.data?.verses) {
        const verseObj = response.data.verses.find(v => v.verse === customVerse);
        if (verseObj) {
          const verseData = {
            text: verseObj.text,
            ref: `${customBook} ${customChapter}:${customVerse}`,
            category: 'Custom'
          };
          setSelectedVerse(verseData);
          setUseCustom(true);
        } else {
          alert(`Verse ${customVerse} not found in ${customBook} ${customChapter}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch verse:', err);
      alert('Failed to fetch verse. Please try again.');
    }
  };

  const pickRandomVerse = async () => {
    const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    const randomChapter = Math.floor(Math.random() * 50) + 1;
    const randomVerse = Math.floor(Math.random() * 30) + 1;
    
    setCustomBook(randomBook);
    setCustomChapter(randomChapter);
    setCustomVerse(randomVerse);
    
    try {
      const response = await base44.functions.invoke('bibleApi', {
        action: 'getChapter',
        book: randomBook,
        chapter: randomChapter
      });
      
      if (response?.data?.verses) {
        const verseObj = response.data.verses.find(v => v.verse === randomVerse);
        if (verseObj) {
          const verseData = {
            text: verseObj.text,
            ref: `${randomBook} ${randomChapter}:${randomVerse}`,
            category: 'Custom'
          };
          setSelectedVerse(verseData);
          setUseCustom(true);
        } else {
          pickRandomVerse();
          return;
        }
      } else {
        pickRandomVerse();
        return;
      }
    } catch (err) {
      console.error('Failed to fetch random verse:', err);
      pickRandomVerse();
    }
  };

  const fetchRandomChapter = async () => {
    setLoading(true);
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
        const randomChapter = Math.floor(Math.random() * 50) + 1;
        
        const response = await base44.functions.invoke('bibleApi', {
          action: 'getChapter',
          book: randomBook,
          chapter: randomChapter
        });
        
        if (response?.data?.verses && response.data.verses.length > 0) {
          setRandomChapter({
            book: randomBook,
            chapter: randomChapter,
            verses: response.data.verses,
            colophon: response.data.colophon
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Attempt', attempts + 1, 'failed:', err.message);
      }
      attempts++;
    }
    
    setLoading(false);
    alert('Failed to fetch a valid chapter after multiple attempts. Please try again.');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      // Use the same client-side search as SearchPage
      const { getBibleData } = await import('@/lib/bibleCache');
      const bible = await getBibleData();
      const kw = searchQuery.trim().toLowerCase();
      const matches = [];
      const seen = new Set();
      
      for (const bookName in bible) {
        if (bookName === '__colophons') continue;
        const chapters = bible[bookName];
        for (const chapterNum in chapters) {
          const verses = chapters[chapterNum];
          for (const verseObj of verses) {
            const searchText = verseObj.text.toLowerCase();
            if (searchText.includes(kw)) {
              const key = `${bookName}-${chapterNum}-${verseObj.verse}`;
              if (seen.has(key)) continue;
              seen.add(key);
              matches.push({
                book: bookName,
                chapter: parseInt(chapterNum),
                verse: parseInt(verseObj.verse),
                text: verseObj.text,
              });
              if (matches.length >= 10) break;
            }
          }
          if (matches.length >= 10) break;
        }
        if (matches.length >= 10) break;
      }
      
      setSearchResults(matches);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLinkClick = (index) => {
    const newLinks = [...testLinks];
    newLinks[index].clicked = true;
    setTestLinks(newLinks);
  };

  const getReaderUrl = () => {
    const bookObj = BIBLE_BOOKS.find(b => b.shortName === testVerse.book);
    const abbr = bookObj ? bookObj.abbr : 'JHN';
    return `/read?book=${abbr}&chapter=${testVerse.chapter}&verse=${testVerse.verse}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Bible Feature Testing Hub</h1>
          <p className="font-sans text-sm text-muted-foreground">Test all Bible reading features in one place</p>
        </div>

        <Tabs defaultValue="daily-verse" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="daily-verse">Daily Verse</TabsTrigger>
            <TabsTrigger value="random-chapter">Random Chapter</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="read-mode">Read Mode</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          {/* Daily Verse Tab */}
          <TabsContent value="daily-verse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Daily Verse Card Tester
                </CardTitle>
                <CardDescription>Test different verse lengths and formats with download capability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Button onClick={fetchCustomVerse}>Load</Button>
                  <Button onClick={pickRandomVerse} variant="outline">
                    <Shuffle className="w-4 h-4 mr-2" />
                    Random
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold mb-2 block">Test Font Family:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'serif', label: 'Serif' },
                        { value: 'sans-serif', label: 'Sans' },
                        { value: 'monospace', label: 'Mono' },
                        { value: 'cursive', label: 'Cursive' },
                        { value: 'dyslexic', label: 'Dyslexic' },
                        { value: 'hyperlegible', label: 'Legible' },
                      ].map((font) => (
                        <Button
                          key={font.value}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const isA11y = ['dyslexic', 'hyperlegible'].includes(font.value);
                            localStorage.setItem('kjb-verse-font-family', font.value);
                            localStorage.setItem('kjb-accessibility-font', isA11y ? font.value : 'default');
                            window.dispatchEvent(new Event('storage'));
                            window.dispatchEvent(new Event('kjb-fonts-changed'));
                            setFontTestKey(prev => prev + 1);
                          }}
                          className="text-xs"
                          style={{
                            fontFamily: font.value === 'serif' ? 'Merriweather, serif' :
                              font.value === 'sans-serif' ? 'Inter, sans-serif' :
                              font.value === 'monospace' ? 'Courier New, monospace' :
                              font.value === 'cursive' ? 'Dancing Script, cursive' :
                              font.value === 'dyslexic' ? 'OpenDyslexic, sans-serif' :
                              font.value === 'hyperlegible' ? 'Atkinson Hyperlegible, sans-serif' : 'inherit'
                          }}
                        >
                          {font.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Current: <span className="font-medium">{localStorage.getItem('kjb-verse-font-family') || 'serif'}</span>
                      {localStorage.getItem('kjb-accessibility-font') !== 'default' && (
                        <span> (Accessibility: <span className="font-medium">{localStorage.getItem('kjb-accessibility-font')}</span>)</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={isOffline}
                        onCheckedChange={setIsOffline}
                      />
                      <span className="font-sans text-sm text-foreground">Simulate Offline Mode</span>
                    </label>
                    <Button onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Card
                    </Button>
                  </div>
                </div>

                <div key={fontTestKey} ref={verseCardRef}>
                  <DailyVerseImage
                    verse={selectedVerse}
                    isOffline={isOffline}
                    onClick={() => {}}
                    onToggleNotif={() => {}}
                    notifEnabled={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Random Chapter Tab */}
          <TabsContent value="random-chapter" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Random Chapter Tester
                </CardTitle>
                <CardDescription>Fetch and display a random Bible chapter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={fetchRandomChapter} disabled={loading} className="w-full">
                  {loading ? 'Fetching...' : 'Get Random Chapter'}
                </Button>

                {randomChapter && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {randomChapter.book} {randomChapter.chapter}
                      </Badge>
                      <Badge variant="outline">{randomChapter.verses.length} verses</Badge>
                    </div>
                    
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <div className="space-y-2">
                        {randomChapter.verses.map((v) => (
                          <div key={v.verse} className="text-sm">
                            <sup className="text-primary font-bold mr-1">{v.verse}</sup>
                            <span className="text-foreground">{v.text}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {randomChapter.colophon && (
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Colophon:</p>
                        <p className="text-sm italic">{randomChapter.colophon}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        window.location.href = getReaderUrl();
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Open in Reader
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Tester
                </CardTitle>
                <CardDescription>Test Bible search functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for a word or phrase..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={searchLoading}>
                    {searchLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-3">
                      {searchResults.map((result, idx) => (
                        <div key={idx} className="p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="primary">
                              {result.book} {result.chapter}:{result.verse}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground">{result.text}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Read Mode Tab */}
          <TabsContent value="read-mode" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Read Mode Tester
                </CardTitle>
                <CardDescription>Configure and test different reading modes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-2">
                  {READING_MODES.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <Button
                        key={mode.id}
                        variant={readingMode === mode.id ? 'default' : 'outline'}
                        onClick={() => setReadingMode(mode.id)}
                        className="flex flex-col h-auto py-3"
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{mode.label}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="two-column">Two Column Layout</Label>
                    <Switch
                      id="two-column"
                      checked={twoColumn}
                      onCheckedChange={setTwoColumn}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="cursive">Cursive Font</Label>
                    <Switch
                      id="cursive"
                      checked={cursive}
                      onCheckedChange={setCursive}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Book</Label>
                      <Input
                        value={testVerse.book}
                        onChange={(e) => setTestVerse({ ...testVerse, book: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chapter</Label>
                      <Input
                        type="number"
                        value={testVerse.chapter}
                        onChange={(e) => setTestVerse({ ...testVerse, chapter: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Verse</Label>
                      <Input
                        type="number"
                        value={testVerse.verse}
                        onChange={(e) => setTestVerse({ ...testVerse, verse: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      window.location.href = getReaderUrl();
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Test Reader with Settings
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Current Configuration:</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Mode: <span className="font-medium">{readingMode}</span></p>
                    <p>Two Column: <span className="font-medium">{twoColumn ? 'Yes' : 'No'}</span></p>
                    <p>Cursive: <span className="font-medium">{cursive ? 'Yes' : 'No'}</span></p>
                    <p>Reference: <span className="font-medium">{testVerse.book} {testVerse.chapter}:{testVerse.verse}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Link Tester
                </CardTitle>
                <CardDescription>Test navigation to all app pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {testLinks.map((link, index) => (
                    <RouterLink
                      key={link.path}
                      to={link.path}
                      onClick={() => handleLinkClick(index)}
                      className={`p-3 rounded-lg border transition-all ${
                        link.clicked
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{link.label}</span>
                        {link.clicked && (
                          <Badge variant="secondary" className="text-xs">✓</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{link.path}</p>
                    </RouterLink>
                  ))}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Link Test Results:</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Clicked: <span className="font-medium">{testLinks.filter(l => l.clicked).length} / {testLinks.length}</span></p>
                    <p>Remaining: <span className="font-medium">{testLinks.filter(l => !l.clicked).length}</span></p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      const newLinks = testLinks.map(l => ({ ...l, clicked: false }));
                      setTestLinks(newLinks);
                    }}
                  >
                    Reset Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}