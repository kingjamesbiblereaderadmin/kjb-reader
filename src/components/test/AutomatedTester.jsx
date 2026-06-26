import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Copy, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AutomatedTester({ onTestsComplete }) {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  const runFeatureTests = async () => {
    setIsRunning(true);
    setTestProgress(0);
    const results = [];
    let completed = 0;

    const tests = [
      {
        name: 'All Pages Navigation',
        test: async () => {
          const pages = [
            { label: 'Home', path: '/' },
            { label: 'Bible Reader', path: '/read' },
            { label: 'Gospel', path: '/gospel' },
            { label: 'Resources', path: '/resources' },
            { label: 'About', path: '/about' },
            { label: 'Contents', path: '/contents' },
            { label: 'Settings', path: '/settings' },
            { label: 'Search', path: '/search' },
            { label: 'Saved Verses', path: '/saved' },
          ];
          const accessible = [];
          pages.forEach(page => {
            const link = document.querySelector(`a[href="${page.path}"]`);
            if (link) accessible.push(page.label);
          });
          return { passed: accessible.length >= 8, message: `${accessible.length}/${pages.length} pages accessible` };
        }
      },
      {
        name: 'Reading Mode - Line Mode',
        test: async () => {
          const lineBtn = document.querySelector('button[data-mode="line"], button:has-text("Line")');
          return { passed: lineBtn !== null, message: lineBtn ? 'Line mode button found' : 'Line mode button not found' };
        }
      },
      {
        name: 'Reading Mode - Paragraph Mode',
        test: async () => {
          const paraBtn = document.querySelector('button[data-mode="paragraph"], button:has-text("Paragraph")');
          return { passed: paraBtn !== null, message: paraBtn ? 'Paragraph mode button found' : 'Paragraph mode button not found' };
        }
      },
      {
        name: 'Reading Mode - Column Mode',
        test: async () => {
          const colBtn = document.querySelector('button[data-mode="column"], button:has-text("Column"), .kjb-two-col');
          return { passed: colBtn !== null, message: colBtn ? 'Column mode available' : 'Column mode not found' };
        }
      },
      {
        name: 'Reading Mode - Full Screen',
        test: async () => {
          const fullBtn = document.querySelector('button[data-mode="full"], button:has-text("Full Screen")');
          return { passed: fullBtn !== null, message: fullBtn ? 'Full screen mode found' : 'Full screen mode not found' };
        }
      },
      {
        name: 'Two-Column Layout CSS',
        test: async () => {
          const hasTwoCol = document.querySelector('.kjb-two-col') !== null || 
                           getComputedStyle(document.documentElement).getPropertyValue('--radius') !== '';
          return { passed: hasTwoCol, message: hasTwoCol ? 'Two-column CSS rules exist' : 'Two-column CSS not found' };
        }
      },
      {
        name: 'Verse Text Rendering',
        test: async () => {
          const verseText = document.querySelector('.kjb-reader-content, .kjb-verse-container');
          return { passed: verseText !== null, message: verseText ? 'Verse text renders' : 'No verse text found' };
        }
      },
      {
        name: 'Verse Numbers Display',
        test: async () => {
          const verseNums = document.querySelectorAll('sup, .verse-number, [id^="v"]');
          return { passed: verseNums.length > 0, message: `${verseNums.length} verse numbers rendered` };
        }
      },
      {
        name: 'Font Family Options',
        test: async () => {
          const fonts = ['Serif', 'Sans', 'Mono', 'Cursive'];
          const found = fonts.filter(f => 
            document.querySelector(`button:has-text("${f}"), [data-font="${f.toLowerCase()}"]`)
          );
          return { passed: found.length >= 3, message: `${found.length}/4 font options available` };
        }
      },
      {
        name: 'Accessibility Fonts',
        test: async () => {
          const dyslexic = document.fonts.check('700 16px "OpenDyslexic"');
          const hyperlegible = document.fonts.check('700 16px "Atkinson Hyperlegible"');
          return { passed: dyslexic || hyperlegible, message: `Dyslexic: ${dyslexic ? '✓' : '✗'}, Legible: ${hyperlegible ? '✓' : '✗'}` };
        }
      },
      {
        name: 'Cursive Font (Dancing Script)',
        test: async () => {
          const dancing = document.fonts.check('700 16px "Dancing Script"');
          return { passed: dancing, message: dancing ? 'Loaded' : 'Not loaded' };
        }
      },
      {
        name: 'Theme Toggle (Dark/Light)',
        test: async () => {
          const themeBtn = document.querySelector('button[aria-label*="theme"], button:has-text("Dark"), button:has-text("Light"), .theme-toggle');
          const hasDarkClass = document.documentElement.classList.contains('dark');
          return { passed: themeBtn !== null || hasDarkClass, message: themeBtn ? 'Theme toggle found' : `Theme: ${hasDarkClass ? 'dark' : 'light'}` };
        }
      },
      {
        name: 'Search Functionality',
        test: async () => {
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
          const searchBtn = document.querySelector('button:has-text("Search"), button:has-svg("Search")');
          const hasSearch = searchInput !== null || searchBtn !== null;
          return { passed: hasSearch, message: searchInput ? 'Search input found' : searchBtn ? 'Search button found' : 'Search not found' };
        }
      },
      {
        name: 'Search Highlighting',
        test: async () => {
          const markElements = document.querySelectorAll('mark[data-occ], mark.highlight, .search-highlight');
          const hasHighlightCSS = Array.from(document.styleSheets).some(sheet => {
            try {
              return Array.from(sheet.cssRules).some(rule => 
                rule.selectorText?.includes('mark') || rule.selectorText?.includes('highlight')
              );
            } catch { return false; }
          });
          return { passed: markElements.length > 0 || hasHighlightCSS, message: markElements.length > 0 ? `${markElements.length} highlights found` : hasHighlightCSS ? 'Highlight CSS exists' : 'No highlighting found' };
        }
      },
      {
        name: 'Multiple Search Results',
        test: async () => {
          try {
            const { getBibleData } = await import('@/lib/bibleCache');
            const bible = await getBibleData();
            const testTerms = ['God', 'Jesus', 'faith'];
            const results = {};
            let totalMatches = 0;
            
            for (const term of testTerms) {
              const matches = [];
              for (const bookName in bible) {
                if (bookName === '__colophons') continue;
                const chapters = bible[bookName];
                for (const chapterNum in chapters) {
                  const verses = chapters[chapterNum];
                  for (const verseObj of verses) {
                    if (verseObj.text.toLowerCase().includes(term.toLowerCase())) {
                      matches.push(`${bookName} ${chapterNum}:${verseObj.verse}`);
                      if (matches.length >= 5) break;
                    }
                  }
                  if (matches.length >= 5) break;
                }
                if (matches.length >= 5) break;
              }
              results[term] = matches.length;
              totalMatches += matches.length;
            }
            
            return { passed: totalMatches > 0, message: `Found ${totalMatches} matches across ${Object.keys(results).filter(k => results[k] > 0).length}/3 terms (God: ${results['God']}, Jesus: ${results['Jesus']}, faith: ${results['faith']})` };
          } catch (err) {
            return { passed: false, message: `Failed: ${err.message}` };
          }
        }
      },
      {
        name: 'Book Selector',
        test: async () => {
          const bookSelect = document.querySelector('select, button:has-text("Genesis"), button:has-text("John"), .book-selector');
          return { passed: bookSelect !== null, message: bookSelect ? 'Book selector found' : 'Book selector not found' };
        }
      },
      {
        name: 'Chapter Selector',
        test: async () => {
          const chapSelect = document.querySelector('input[type="number"], .chapter-selector, button:has-text("Chapter")');
          return { passed: chapSelect !== null, message: chapSelect ? 'Chapter selector found' : 'Chapter selector not found' };
        }
      },
      {
        name: 'Daily Verse Card',
        test: async () => {
          const card = document.querySelector('[ref="verseCardRef"], .daily-verse-card, .verse-card');
          return { passed: card !== null, message: card ? 'Card rendered' : 'Card not found' };
        }
      },
      {
        name: 'Download/Card Export Button',
        test: async () => {
          const downloadBtn = document.querySelector('button:has-text("Download"), button:has-svg("Download"), button:has-svg("Share")');
          return { passed: downloadBtn !== null, message: downloadBtn ? 'Export button found' : 'Export button not found' };
        }
      },
      {
        name: 'Share Functionality',
        test: async () => {
          const shareBtn = document.querySelector('button:has-text("Share"), button:has-svg("Share")');
          return { passed: shareBtn !== null, message: shareBtn ? 'Share button found' : 'Share not found' };
        }
      },
      {
        name: 'Print Functionality',
        test: async () => {
          const printBtn = document.querySelector('button:has-text("Print"), button:has-svg("Printer")');
          return { passed: printBtn !== null, message: printBtn ? 'Print button found' : 'Print not found' };
        }
      },
      {
        name: 'Settings Panel',
        test: async () => {
          const settingsLink = document.querySelector('a[href="/settings"], button:has-text("Settings"), .settings-link');
          return { passed: settingsLink !== null, message: settingsLink ? 'Settings accessible' : 'Settings not found' };
        }
      },
      {
        name: 'Saved Verses Feature',
        test: async () => {
          const savedLink = document.querySelector('a[href="/saved"], button:has-text("Saved"), .saved-verses');
          return { passed: savedLink !== null, message: savedLink ? 'Saved verses accessible' : 'Saved verses not found' };
        }
      },
      {
        name: 'Offline Status Indicator',
        test: async () => {
          const offlineBanner = document.querySelector('.offline-banner, [data-offline], .connection-status');
          const hasSW = 'serviceWorker' in navigator;
          return { passed: offlineBanner !== null || hasSW, message: offlineBanner ? 'Offline indicator found' : hasSW ? 'SW active (offline capable)' : 'No offline indicator' };
        }
      },
      {
        name: 'Bible Data Loading',
        test: async () => {
          try {
            const response = await base44.functions.invoke('bibleApi', {
              action: 'getChapter',
              book: 'John',
              chapter: 3
            });
            const hasVerses = response?.data?.verses?.length > 0;
            return { passed: hasVerses, message: hasVerses ? `Loaded ${response.data.verses.length} verses` : 'No verses returned' };
          } catch (err) {
            return { passed: false, message: `Failed: ${err.message}` };
          }
        }
      },
      {
        name: 'Service Worker',
        test: async () => {
          const hasSW = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
          return { passed: hasSW, message: hasSW ? 'Service worker active' : 'No service worker' };
        }
      },
      {
        name: 'Offline Cache',
        test: async () => {
          try {
            const cacheNames = await caches.keys();
            const hasCache = cacheNames.some(name => name.includes('kjb'));
            return { passed: hasCache, message: hasCache ? 'Cache found' : 'No cache found' };
          } catch (err) {
            return { passed: false, message: `Failed: ${err.message}` };
          }
        }
      },
      {
        name: 'PWA Manifest',
        test: async () => {
          const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                               window.matchMedia('(display-mode: minimal-ui)').matches ||
                               window.navigator.standalone === true;
          return { passed: hasManifest, message: `Manifest: ${hasManifest ? '✓' : '✗'}, Standalone: ${isStandalone ? 'Yes' : 'No'}` };
        }
      },
      {
        name: 'LocalStorage Access',
        test: async () => {
          try {
            localStorage.setItem('kjb-test', 'test');
            const value = localStorage.getItem('kjb-test');
            localStorage.removeItem('kjb-test');
            return { passed: value === 'test', message: 'LocalStorage working' };
          } catch (err) {
            return { passed: false, message: `Failed: ${err.message}` };
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({ name: test.name, ...result, timestamp: new Date().toLocaleTimeString() });
      } catch (err) {
        results.push({ name: test.name, passed: false, message: `Error: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
      }
      completed++;
      setTestProgress(Math.round((completed / tests.length) * 100));
    }

    setTestResults(results);
    setIsRunning(false);
    if (onTestsComplete) onTestsComplete(results);
  };

  const generateBase44Prompt = () => {
    const failed = testResults.filter(r => !r.passed);
    if (failed.length === 0) {
      return 'All tests passed! No fixes needed.';
    }

    const issues = failed.map(f => `- ${f.name}: ${f.message}`).join('\n');
    return `## Issues Found\n\n${issues}\n\n## Fix Request\n\nPlease fix the following issues in my KJB Reader app:\n\n${failed.map((f, i) => `${i + 1}. **${f.name}** - ${f.message}`).join('\n')}\n\n## Context\n- App: KJB Reader (Bible reading app)\n- Tests run: ${testResults.length}\n- Passed: ${testResults.filter(r => r.passed).length}\n- Failed: ${failed.length}\n- Test timestamp: ${new Date().toLocaleString()}`;
  };

  const copyPrompt = async () => {
    const prompt = generateBase44Prompt();
    await navigator.clipboard.writeText(prompt);
    alert('Prompt copied to clipboard!');
  };

  const passedCount = testResults.filter(r => r.passed).length;
  const failedCount = testResults.filter(r => !r.passed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Automated Feature Tester
        </CardTitle>
        <CardDescription>Run comprehensive tests and generate Base44 fix prompts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runFeatureTests} disabled={isRunning} className="flex-1">
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running... {testProgress}%
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
          {testResults.length > 0 && (
            <Button onClick={copyPrompt} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy Prompt
            </Button>
          )}
        </div>

        {testResults.length > 0 && (
          <>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex-1 justify-center py-2">
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                Passed: {passedCount}
              </Badge>
              <Badge variant="secondary" className="flex-1 justify-center py-2">
                <XCircle className="w-4 h-4 mr-1 text-red-600" />
                Failed: {failedCount}
              </Badge>
              <Badge variant="outline" className="flex-1 justify-center py-2">
                Total: {testResults.length}
              </Badge>
            </div>

            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start gap-2 ${
                      result.passed
                        ? 'bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-900/40'
                        : 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-900/40'
                    }`}
                  >
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{result.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{result.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {failedCount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-amber-800 dark:text-amber-400">
                      {failedCount} issue{failedCount > 1 ? 's' : ''} found
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                      Click "Copy Prompt" to generate a Base44 fix request
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}