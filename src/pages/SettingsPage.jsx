import React, { useState, useEffect } from 'react';
import { Settings, Download, Trash2, CheckCircle, Loader2, HardDrive, RefreshCw } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchChapter } from '@/lib/bibleApi';

const CACHE_PREFIX = 'kjb-offline-';
const LAST_REVISED = 'May 2026'; // PCE last revision tracking

function getCacheKey(abbr, chapter) {
  return `${CACHE_PREFIX}${abbr}-${chapter}`;
}

function isBookCached(abbr, totalChapters) {
  for (let c = 1; c <= totalChapters; c++) {
    if (!localStorage.getItem(getCacheKey(abbr, c))) return false;
  }
  return true;
}

function getBookCacheProgress(abbr, totalChapters) {
  let count = 0;
  for (let c = 1; c <= totalChapters; c++) {
    if (localStorage.getItem(getCacheKey(abbr, c))) count++;
  }
  return count;
}

function deleteBook(abbr, totalChapters) {
  for (let c = 1; c <= totalChapters; c++) {
    localStorage.removeItem(getCacheKey(abbr, c));
  }
}

export default function SettingsPage() {
  const [tab, setTab] = useState('old');
  const [downloading, setDownloading] = useState({}); // abbr -> true
  const [progress, setProgress] = useState({}); // abbr -> downloaded chapter count
  const [cacheStatus, setCacheStatus] = useState({}); // abbr -> { cached, downloaded }
  const [storageUsed, setStorageUsed] = useState(0);

  const books = BIBLE_BOOKS.filter(b => b.testament === tab);

  const refreshStatus = () => {
    const status = {};
    let totalBytes = 0;
    BIBLE_BOOKS.forEach(book => {
      const downloaded = getBookCacheProgress(book.abbr, book.chapters);
      const cached = downloaded === book.chapters;
      status[book.abbr] = { cached, downloaded };
    });
    // Estimate storage
    try {
      let bytes = 0;
      for (let key in localStorage) {
        if (key.startsWith(CACHE_PREFIX)) {
          bytes += (localStorage.getItem(key) || '').length * 2;
        }
      }
      totalBytes = bytes;
    } catch {}
    setCacheStatus(status);
    setStorageUsed(totalBytes);
  };

  useEffect(() => { refreshStatus(); }, []);

  const downloadBook = async (book) => {
    if (downloading[book.abbr]) return;
    setDownloading(prev => ({ ...prev, [book.abbr]: true }));
    setProgress(prev => ({ ...prev, [book.abbr]: 0 }));

    for (let c = 1; c <= book.chapters; c++) {
      const key = getCacheKey(book.abbr, c);
      if (!localStorage.getItem(key)) {
        try {
          const verses = await fetchChapter(book.apiName, c);
          localStorage.setItem(key, JSON.stringify(verses));
        } catch {}
      }
      setProgress(prev => ({ ...prev, [book.abbr]: c }));
    }

    setDownloading(prev => ({ ...prev, [book.abbr]: false }));
    refreshStatus();
  };

  const removeBook = (book) => {
    deleteBook(book.abbr, book.chapters);
    refreshStatus();
  };

  const downloadAll = async () => {
    for (const book of BIBLE_BOOKS) {
      if (!cacheStatus[book.abbr]?.cached) {
        await downloadBook(book);
      }
    }
  };

  const clearAll = () => {
    BIBLE_BOOKS.forEach(book => deleteBook(book.abbr, book.chapters));
    refreshStatus();
  };

  const totalBooks = BIBLE_BOOKS.length;
  const cachedBooks = Object.values(cacheStatus).filter(s => s?.cached).length;
  const storageMB = (storageUsed / 1024 / 1024).toFixed(1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Settings className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="font-sans text-sm text-muted-foreground">Offline downloads & app information</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-2">
        <h2 className="font-serif text-lg font-semibold text-foreground">Bible Text</h2>
        <div className="flex justify-between font-sans text-sm">
          <span className="text-muted-foreground">Edition</span>
          <span className="text-foreground font-medium">King James Bible — Pure Cambridge Edition</span>
        </div>
        <div className="flex justify-between font-sans text-sm">
          <span className="text-muted-foreground">Last Revision</span>
          <span className="text-foreground font-medium">{LAST_REVISED}</span>
        </div>
        <div className="flex justify-between font-sans text-sm">
          <span className="text-muted-foreground">Source</span>
          <a href="https://www.bibleprotector.com" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">bibleprotector.com</a>
        </div>
      </div>

      {/* Offline Storage Summary */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Offline Library</h2>
          <button onClick={refreshStatus} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-serif text-2xl font-bold text-foreground">{cachedBooks}</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">Books cached</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-serif text-2xl font-bold text-foreground">{totalBooks - cachedBooks}</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">Not cached</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-serif text-2xl font-bold text-foreground">{storageMB}</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">MB used</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadAll}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
          <button
            onClick={clearAll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Per-book download */}
      <div className="mb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('old')}
            className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
              tab === 'old' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            Old Testament
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
              tab === 'new' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            New Testament
          </button>
        </div>

        <div className="space-y-2">
          {books.map(book => {
            const status = cacheStatus[book.abbr] || { cached: false, downloaded: 0 };
            const isDown = downloading[book.abbr];
            const prog = progress[book.abbr] || 0;

            return (
              <div key={book.abbr} className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base font-semibold text-foreground truncate">{book.shortName}</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {isDown
                      ? `Downloading… ${prog}/${book.chapters} chapters`
                      : status.cached
                      ? `${book.chapters} chapters cached`
                      : status.downloaded > 0
                      ? `${status.downloaded}/${book.chapters} chapters`
                      : `${book.chapters} chapters`}
                  </p>
                  {isDown && (
                    <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300 rounded-full"
                        style={{ width: `${(prog / book.chapters) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {status.cached && !isDown && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <button
                        onClick={() => removeBook(book)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {!status.cached && !isDown && (
                    <button
                      onClick={() => downloadBook(book)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  )}
                  {isDown && (
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center font-sans text-xs text-muted-foreground mt-4">
        Cached data is stored locally on your device and persists between sessions.
      </p>
    </div>
  );
}