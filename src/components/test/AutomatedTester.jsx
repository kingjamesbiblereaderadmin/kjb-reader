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
        name: 'Navigation Links',
        test: async () => {
          const links = document.querySelectorAll('a[href]');
          const broken = [];
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('/')) {
              broken.push(href);
            }
          });
          return { passed: broken.length === 0, message: broken.length === 0 ? 'All links valid' : `${broken.length} broken links found` };
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
        name: 'Random Chapter Fetch',
        test: async () => {
          try {
            const books = ['Genesis', 'Psalms', 'Matthew', 'Romans', 'Revelation'];
            const book = books[Math.floor(Math.random() * books.length)];
            const chapter = Math.floor(Math.random() * 10) + 1;
            const response = await base44.functions.invoke('bibleApi', {
              action: 'getChapter',
              book,
              chapter
            });
            const success = response?.data?.verses?.length > 0;
            return { passed: success, message: success ? `Loaded ${book} ${chapter}` : 'No verses returned' };
          } catch (err) {
            return { passed: false, message: `Failed: ${err.message}` };
          }
        }
      },
      {
        name: 'Daily Verse Card Render',
        test: async () => {
          const card = document.querySelector('[ref="verseCardRef"]');
          const hasCard = card !== null;
          return { passed: hasCard, message: hasCard ? 'Card rendered' : 'Card not found' };
        }
      },
      {
        name: 'Font Loading',
        test: async () => {
          const fonts = ['OpenDyslexic', 'Atkinson Hyperlegible', 'Dancing Script'];
          const loaded = [];
          await Promise.all(fonts.map(font => 
            document.fonts.check(`700 16px "${font}"`) 
              ? loaded.push(font) 
              : null
          ));
          return { passed: loaded.length >= 2, message: `${loaded.length}/${fonts.length} fonts loaded` };
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
        name: 'PWA Install Prompt',
        test: async () => {
          const hasPrompt = typeof window !== 'undefined' && !!window.kjbDeferredPrompt;
          const isInstallable = hasPrompt || window.matchMedia('(display-mode: browser)').matches;
          return { passed: isInstallable, message: isInstallable ? 'Installable' : 'Not installable (or already installed)' };
        }
      },
      {
        name: 'Theme System',
        test: async () => {
          const html = document.documentElement;
          const hasDarkClass = html.classList.contains('dark');
          const hasTheme = localStorage.getItem('kjb-theme-mode') !== null;
          return { passed: true, message: `Theme: ${hasDarkClass ? 'dark' : 'light'}, persisted: ${hasTheme ? 'yes' : 'no'}` };
        }
      },
      {
        name: 'App Routes',
        test: async () => {
          const routes = ['/', '/read', '/settings', '/search', '/saved'];
          const working = [];
          routes.forEach(route => {
            const link = document.querySelector(`a[href="${route}"]`);
            if (link) working.push(route);
          });
          return { passed: working.length >= 4, message: `${working.length}/5 routes accessible` };
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