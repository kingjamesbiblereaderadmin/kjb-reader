import React, { useState, useEffect } from 'react';
import { Database, Server, Cloud, Wifi, WifiOff, HardDrive, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, BookOpen, Copy } from 'lucide-react';
import { isBibleCached, clearBibleCache, downloadBibleForOffline, CACHE_VERSION, getBibleData } from '@/lib/bibleCache';

export default function DebugPage() {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [bibleCached, setBibleCached] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
  const [isChecking, setIsChecking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [localStorageData, setLocalStorageData] = useState({});
  const [serviceWorker, setServiceWorker] = useState(null);
  const [bookData, setBookData] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCopyDebugInfo = () => {
    let report = 'KJB Reader Debug Report\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Connection
    report += '== Connection Status ==\n';
    report += `Online: ${isOnline ? 'Yes' : 'No'}\n\n`;

    // Bible Cache
    report += '== Bible Cache ==\n';
    report += `Cached: ${bibleCached ? 'Yes' : 'No'}\n`;
    if (cacheStatus) {
        report += `Version: ${cacheStatus.version || 'N/A'}\n`;
        report += `Last Updated: ${cacheStatus.lastUpdated ? new Date(cacheStatus.lastUpdated).toLocaleString() : 'Never'}\n`;
    }
    report += '\n';

    // Service Worker
    report += '== Service Worker ==\n';
    if (serviceWorker) {
        report += `Active: ${serviceWorker.active ? 'Yes' : 'No'}\n`;
        report += `Waiting: ${serviceWorker.waiting ? 'Yes (Update pending)' : 'No'}\n`;
        report += `Scope: ${serviceWorker.scope}\n`;
    } else {
        report += 'Not supported or not registered.\n';
    }
    report += '\n';

    // Bible Books
    report += '== Bible Books Status ==\n';
    if (bookData) {
        report += `Total Books: ${bookData.bookCount} / 66\n`;
        if (bookData.bookCount < 66) {
             report += `WARNING: Incomplete cache - missing ${66 - bookData.bookCount} book(s).\n`;
        }
        report += `Colophons: ${bookData.colophonCount}\n`;
        report += '-------------------\n';
        Object.entries(bookData.books).sort((a,b) => a[0].localeCompare(b[0])).forEach(([book, data]) => {
            report += `${book}: ${data.chapters} chapters, ${data.totalVerses} verses\n`;
        });
    } else {
        report += 'No Bible data loaded.\n';
    }
    report += '\n';


    // LocalStorage
    report += '== LocalStorage (KJB Keys) ==\n';
    if (Object.keys(localStorageData).length > 0) {
        Object.entries(localStorageData).forEach(([key, data]) => {
            report += `${key} (${data.size} bytes)\n`;
        });
    } else {
        report += 'No KJB-related localStorage data found.\n';
    }

    navigator.clipboard.writeText(report).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
        console.error('Failed to copy debug info:', err);
    });
  };

  const checkAllStatus = async () => {
    setIsChecking(true);
    try {
      // Bible cache
      const cached = await isBibleCached().catch(() => false);
      setBibleCached(cached);
      const cachedVersion = localStorage.getItem('bible_cache_version');
      const lastRefresh = localStorage.getItem('bible_last_refresh');
      setCacheStatus({ version: cachedVersion || CACHE_VERSION, lastUpdated: lastRefresh ? new Date(parseInt(lastRefresh)).toISOString() : null });

      // LocalStorage
      const lsData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kjb-')) {
          try {
            const val = localStorage.getItem(key);
            lsData[key] = {
              size: new Blob([val]).size,
              preview: val.length > 100 ? val.substring(0, 100) + '...' : val
            };
          } catch {
            lsData[key] = { error: 'Cannot read' };
          }
        }
      }
      setLocalStorageData(lsData);

      // Bible books data
      try {
        const bible = await getBibleData();
        if (bible && Object.keys(bible).length > 1) {
          const books = {};
          Object.keys(bible).filter(k => k !== '__colophons').forEach(book => {
            const chapters = Object.keys(bible[book] || {});
            const totalVerses = chapters.reduce((sum, ch) => sum + (bible[book][ch]?.length || 0), 0);
            books[book] = {
              chapters: chapters.length,
              totalVerses,
              chapterList: chapters.sort((a, b) => parseInt(a) - parseInt(b))
            };
          });
          setBookData({
            bookCount: Object.keys(books).length,
            books,
            colophonCount: Object.keys(bible.__colophons || {}).length
          });
        }
      } catch (err) {
        console.error('Failed to load Bible data for debug:', err);
      }

      // Service Worker
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
        setServiceWorker({
          active: !!reg?.active,
          waiting: !!reg?.waiting,
          installing: !!reg?.installing,
          scope: reg?.scope || 'N/A'
        });
      }
    } catch (err) {
      console.error('Debug check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAllStatus();
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearBibleCache();
      await checkAllStatus();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadBible = async () => {
    setIsDownloading(true);
    try {
      await downloadBibleForOffline();
      await checkAllStatus();
    } catch (err) {
      console.error('Failed to download Bible:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Database className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">Debug & Cache Status</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          View application cache, API status, and localStorage data
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Connection Status */}
      <div className="bg-card border border-border rounded-2xl mb-6 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Wifi className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-serif text-lg font-bold text-foreground">Connection Status</h2>
        </div>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="font-sans text-sm font-medium text-green-700 dark:text-green-400">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="font-sans text-sm font-medium text-red-700 dark:text-red-400">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Bible Cache Status */}
      <div className="bg-card border border-border rounded-2xl mb-6 p-5">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-serif text-lg font-bold text-foreground">Bible Cache</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <span className="font-sans text-sm text-muted-foreground">Status</span>
            {bibleCached ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-sans text-sm font-medium">Cached</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                <span className="font-sans text-sm font-medium">Not Cached</span>
              </div>
            )}
          </div>
          {cacheStatus && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <span className="font-sans text-sm text-muted-foreground">Cache Version</span>
                <span className="font-sans text-sm font-medium text-foreground">{cacheStatus.version || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <span className="font-sans text-sm text-muted-foreground">Last Updated</span>
                <span className="font-sans text-sm font-medium text-foreground">
                  {cacheStatus.lastUpdated ? new Date(cacheStatus.lastUpdated).toLocaleString() : 'Never'}
                </span>
              </div>
            </>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDownloadBible}
              disabled={isDownloading || isOnline === false}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              {isDownloading ? 'Downloading...' : 'Download Bible'}
            </button>
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all"
            >
              {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </button>
          </div>
        </div>
      </div>

      {/* Service Worker Status */}
      <div className="bg-card border border-border rounded-2xl mb-6 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-serif text-lg font-bold text-foreground">Service Worker</h2>
        </div>
        {serviceWorker ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="font-sans text-sm text-muted-foreground">Active Worker</span>
              {serviceWorker.active ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-sans text-sm font-medium">Yes</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span className="font-sans text-sm font-medium">No</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="font-sans text-sm text-muted-foreground">Waiting Worker</span>
              {serviceWorker.waiting ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-sans text-sm font-medium">Pending Update</span>
                </div>
              ) : (
                <span className="font-sans text-sm text-muted-foreground">None</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="font-sans text-sm text-muted-foreground">Scope</span>
              <span className="font-sans text-sm font-medium text-foreground truncate max-w-[200px]">{serviceWorker.scope}</span>
            </div>
          </div>
        ) : (
          <p className="font-sans text-sm text-muted-foreground">Service Worker not supported or not registered</p>
        )}
      </div>

      {/* LocalStorage Data */}
      <div className="bg-card border border-border rounded-2xl mb-6 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-serif text-lg font-bold text-foreground">LocalStorage (KJB Keys)</h2>
        </div>
        {Object.keys(localStorageData).length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(localStorageData).map(([key, data]) => (
              <div key={key} className="p-3 rounded-lg bg-secondary border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans text-xs font-mono text-foreground break-all">{key}</span>
                  <span className="font-sans text-xs text-muted-foreground">{data.size} bytes</span>
                </div>
                {data.preview && (
                  <p className="font-sans text-xs text-muted-foreground font-mono break-all bg-background/50 rounded p-2">
                    {data.preview}
                  </p>
                )}
                {data.error && (
                  <p className="font-sans text-xs text-red-600">{data.error}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-muted-foreground">No KJB-related localStorage data found</p>
        )}
      </div>

      {/* Bible Books Status */}
      <div className="bg-card border border-border rounded-2xl mb-6 p-5">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-serif text-lg font-bold text-foreground">Bible Books Status</h2>
        </div>
        {bookData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="font-sans text-sm text-muted-foreground">Total Books</span>
              <span className="font-sans text-sm font-medium text-foreground">{bookData.bookCount} / 66</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="font-sans text-sm text-muted-foreground">Colophons</span>
              <span className="font-sans text-sm font-medium text-foreground">{bookData.colophonCount}</span>
            </div>
            {bookData.bookCount < 66 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="font-sans text-sm text-amber-800 dark:text-amber-300">
                  ⚠️ Incomplete cache - missing {66 - bookData.bookCount} book(s). Try clearing cache and re-downloading.
                </p>
              </div>
            )}
            <div className="max-h-96 overflow-y-auto space-y-1">
              {Object.entries(bookData.books).map(([book, data]) => (
                <div key={book} className="flex items-center justify-between p-2 rounded bg-background border border-border">
                  <span className="font-sans text-xs font-medium text-foreground">{book}</span>
                  <span className="font-sans text-xs text-muted-foreground">{data.chapters} ch • {data.totalVerses} v</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-sans text-sm text-muted-foreground">No Bible data loaded</p>
        )}
      </div>

      {/* Actions */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-serif text-lg font-bold text-foreground">Actions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={checkAllStatus}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isChecking ? 'Checking...' : 'Refresh Status'}
          </button>
          <button
            onClick={handleCopyDebugInfo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all"
          >
            {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copySuccess ? 'Copied!' : 'Copy Report'}
          </button>
        </div>
      </div>
    </div>
  );
}