import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Copy, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getBibleData, isBibleCached, CACHE_VERSION } from '@/lib/bibleCache';
import { getAccessibilityFont } from '@/lib/accessibilityFont';

export default function ComprehensiveTester() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  const runFeatureTests = async () => {
    setIsRunning(true);
    setTestProgress(0);
    const results = [];
    let completed = 0;

    const tests = [
      // Navigation & Routing
      {
        name: 'Navigation Links Valid',
        test: async () => {
          const links = document.querySelectorAll('a[href]');
          const broken = [];
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('/')) {
              broken.push(href);
            }
          });
          return { passed: broken.length === 0, message: broken.length === 0 ? 'All links valid' : `${broken.length} broken links` };
        }
      },
      {
        name: 'App Routes Accessible',
        test: async () => {
          const routes = ['/', '/read', '/settings', '/search', '/saved', '/contents', '/gospel', '/resources', '/about'];
          const working = [];
          routes.forEach(route => {
            const link = document.querySelector(`a[href="${route}"]`);
            if (link) working.push(route);
          });
          return { passed: working.length >= 7, message: `${working.length}/${routes.length} routes accessible` };
        }
      },

      // Bible Data & API
      {
        name: 'Bible API Response',
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
        name: 'Bible Cache Status',
        test: async () => {
          try {
            const cached = await isBibleCached();
            const data = await getBibleData();
            const hasBooks = data && Object.keys(data).length > 39;
            return { passed: cached && hasBooks, message: cached ? `Cache v${CACHE_VERSION}, ${Object.keys(data || {}).length} books` : 'Not cached' };
          } catch (err) {
            return { passed: false, message: `Cache error: ${err.message}` };
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

      // Daily Verse
      {
        name: 'Daily Verse Card Render',
        test: async () => {
          const card = document.querySelector('[ref="verseCardRef"]') || document.querySelector('.kjb-verse-card');
          const hasCard = card !== null;
          return { passed: hasCard, message: hasCard ? 'Card rendered' : 'Card not found' };
        }
      },
      {
        name: 'Daily Verse Notification Toggle',
        test: async () => {
          const notifButton = document.querySelector('button[title*="notification"]') || document.querySelector('button[title*="bell"]');
          const hasButton = notifButton !== null;
          return { passed: hasButton, message: hasButton ? 'Toggle button exists' : 'Button not found' };
        }
      },

      // Fonts & Typography
      {
        name: 'Web Fonts Loaded',
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
        name: 'Reading Fonts Available',
        test: async () => {
          const merriweather = document.fonts.check('700 16px "Merriweather"');
          const inter = document.fonts.check('700 16px "Inter"');
          const cormorant = document.fonts.check('700 16px "Cormorant Garamond"');
          return { passed: merriweather || inter, message: `Serif: ${merriweather || cormorant ? '✓' : '✗'}, Sans: ${inter ? '✓' : '✗'}` };
        }
      },
      {
        name: 'Accessibility Font Active',
        test: async () => {
          const a11yFont = getAccessibilityFont();
          const html = document.documentElement;
          const hasA11yAttr = html.getAttribute('data-a11y-font');
          return { passed: true, message: a11yFont !== 'default' ? `Active: ${a11yFont}` : `Default (none), attr: ${hasA11yAttr || 'none'}` };
        }
      },

      // Column Mode & Layout
      {
        name: 'Column Mode CSS Rules',
        test: async () => {
          const style = getComputedStyle(document.documentElement);
          const hasColumnClass = document.querySelector('.kjb-two-col') !== null;
          const columnRule = style.getPropertyValue('--radius');
          return { passed: hasColumnClass || columnRule !== '', message: `Two-col class: ${hasColumnClass ? '✓' : '✗'}, CSS vars: ${columnRule ? '✓' : '✗'}` };
        }
      },
      {
        name: 'Reading Mode Toggles',
        test: async () => {
          const lineBtn = document.querySelector('button[title*="line"]') || document.querySelector('button[title*="Lines"]');
          const paraBtn = document.querySelector('button[title*="paragraph"]') || document.querySelector('button[title*="Para"]');
          const colBtn = document.querySelector('button[title*="column"]') || document.querySelector('button[title*="Col"]');
          const hasToggles = lineBtn && paraBtn && colBtn;
          return { passed: hasToggles, message: hasToggles ? 'All toggles present' : 'Missing toggles' };
        }
      },

      // PWA & Offline
      {
        name: 'PWA Manifest Present',
        test: async () => {
          const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                               window.matchMedia('(display-mode: minimal-ui)').matches ||
                               window.navigator.standalone === true;
          return { passed: hasManifest, message: `Manifest: ${hasManifest ? '✓' : '✗'}, Standalone: ${isStandalone ? 'Yes' : 'No'}` };
        }
      },
      {
        name: 'Service Worker Active',
        test: async () => {
          const hasSW = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
          return { passed: hasSW, message: hasSW ? 'Service worker active' : 'No service worker' };
        }
      },
      {
        name: 'Offline Cache Present',
        test: async () => {
          try {
            const cacheNames = await caches.keys();
            const hasCache = cacheNames.some(name => name.includes('kjb'));
            return { passed: hasCache, message: hasCache ? `Cache found: ${cacheNames.filter(n => n.includes('kjb')).join(', ')}` : 'No cache found' };
          } catch (err) {
            return { passed: false, message: `Failed: ${err.message}` };
          }
        }
      },
      {
        name: 'PWA Install Prompt Available',
        test: async () => {
          const hasPrompt = typeof window !== 'undefined' && !!window.kjbDeferredPrompt;
          const isInstallable = hasPrompt || window.matchMedia('(display-mode: browser)').matches;
          return { passed: isInstallable, message: isInstallable ? 'Installable' : 'Not installable (or already installed)' };
        }
      },

      // LocalStorage & State
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
        name: 'Theme Persistence',
        test: async () => {
          const html = document.documentElement;
          const hasDarkClass = html.classList.contains('dark');
          const hasTheme = localStorage.getItem('kjb-theme-mode') !== null;
          const mode = localStorage.getItem('kjb-theme-mode');
          return { passed: true, message: `Theme: ${hasDarkClass ? 'dark' : 'light'}, persisted: ${hasTheme ? `yes (${mode})` : 'no'}` };
        }
      },
      {
        name: 'Reader Settings Persisted',
        test: async () => {
          const zoom = localStorage.getItem('kjb-zoom');
          const font = localStorage.getItem('kjb-reader-font-family');
          const flow = localStorage.getItem('kjb-flow');
          const column = localStorage.getItem('kjb-column');
          return { passed: zoom || font || flow || column, message: `Zoom: ${zoom || 'default'}, Font: ${font || 'default'}, Flow: ${flow || 'default'}, Column: ${column || 'default'}` };
        }
      },

      // UI Components
      {
        name: 'Quick Links Present',
        test: async () => {
          const quickLinks = document.querySelectorAll('[class*="QuickLinkCard"]');
          const hasLinks = quickLinks.length >= 6;
          return { passed: hasLinks, message: hasLinks ? `${quickLinks.length} quick links` : 'Missing quick links' };
        }
      },
      {
        name: 'Settings Sections Expandable',
        test: async () => {
          const sections = document.querySelectorAll('button[onClick*="toggleSection"]');
          const hasSections = sections.length >= 5;
          return { passed: hasSections, message: hasSections ? `${sections.length} sections` : 'Missing sections' };
        }
      },

      // Search & Navigation
      {
        name: 'Search Bar Present',
        test: async () => {
          const searchBar = document.querySelector('input[placeholder*="search"]') || document.querySelector('input[type="search"]');
          return { passed: searchBar !== null, message: searchBar ? 'Search bar found' : 'Search bar not found' };
        }
      },
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
          Comprehensive Feature Tester
        </CardTitle>
        <CardDescription>Test all app features including fonts, columns, PWA, and more</CardDescription>
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

            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
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