import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Search, Type, Link, Shuffle, Eye, Columns, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link as RouterLink } from 'react-router-dom';

const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John',
  '3 John', 'Jude', 'Revelation'
];

const READING_MODES = [
  { id: 'line', label: 'Line', icon: Type },
  { id: 'paragraph', label: 'Paragraph', icon: Columns },
  { id: 'full', label: 'Full Screen', icon: Maximize2 },
];

export default function TestFeatures() {
  const [randomChapter, setRandomChapter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [testVerse, setTestVerse] = useState({
    book: 'John',
    chapter: 3,
    verse: 16
  });
  const [readingMode, setReadingMode] = useState('line');
  const [twoColumn, setTwoColumn] = useState(false);
  const [cursive, setCursive] = useState(false);
  const [testLinks, setTestLinks] = useState([
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
  ]);

  const fetchRandomChapter = async () => {
    setLoading(true);
    try {
      const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
      const randomChapter = Math.floor(Math.random() * 50) + 1;
      
      const response = await base44.functions.invoke('bibleApi', {
        action: 'getChapter',
        book: randomBook,
        chapter: randomChapter
      });
      
      if (response?.data?.verses) {
        setRandomChapter({
          book: randomBook,
          chapter: randomChapter,
          verses: response.data.verses,
          colophon: response.data.colophon
        });
      } else {
        // Retry with different chapter
        fetchRandomChapter();
      }
    } catch (err) {
      console.error('Failed to fetch random chapter:', err);
      alert('Failed to fetch chapter. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await base44.functions.invoke('bibleApi', {
        action: 'search',
        query: searchQuery
      });
      
      if (response?.data?.results) {
        setSearchResults(response.data.results.slice(0, 10));
      }
    } catch (err) {
      console.error('Search failed:', err);
      // Mock results for testing
      setSearchResults([
        { book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
        { book: 'Romans', chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
      ]);
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
    return `/read?book=${encodeURIComponent(testVerse.book)}&chapter=${testVerse.chapter}&verse=${testVerse.verse}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-serif">Feature Testing Page</h1>
            <p className="text-muted-foreground text-sm">Test Bible reading features, search, and navigation</p>
          </div>
        </div>

        <Tabs defaultValue="random" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="random">Random Chapter</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="read">Read Mode</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          {/* Random Chapter Tab */}
          <TabsContent value="random" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="w-5 h-5" />
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
          <TabsContent value="read" className="space-y-4">
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
                  <Link className="w-5 h-5" />
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