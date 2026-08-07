import React from 'react';
import { Link } from 'react-router-dom';
import { Puzzle, ArrowLeft, CheckCircle, Search, BookOpen, Sparkles, Bell, MousePointer2, Heart } from 'lucide-react';

const LAST_UPDATED = 'August 7th, 2026';

const FEATURES = [
  {
    icon: Search,
    title: 'Instant Verse Lookup',
    desc: 'Look up any Bible reference from any web page — no need to open a new tab.',
  },
  {
    icon: BookOpen,
    title: 'Read the KJB',
    desc: 'Full King James Bible (Pure Cambridge Edition) text in a handy sidebar.',
  },
  {
    icon: MousePointer2,
    title: 'Right-Click Search',
    desc: 'Select any text and right-click to instantly search the King James Bible.',
  },
  {
    icon: Sparkles,
    title: 'Advanced Search',
    desc: 'Search with wildcards, whole-word matching, and Old/New Testament filtering.',
  },
  {
    icon: Heart,
    title: 'Gospel & Resources',
    desc: 'Quick access to gospel presentation, preacher links, and Bible study resources.',
  },
  {
    icon: Bell,
    title: 'Daily Verse',
    desc: 'A new verse each day to encourage and inspire.',
  },
];

export default function ExtensionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30 mb-4">
            <Puzzle className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">KJB SidePanel</h1>
          <p className="font-sans text-sm text-muted-foreground">Read, search, and look up Bible verses from any web page.</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#DCFCE7' }}>
            <CheckCircle className="w-3.5 h-3.5" style={{ color: '#166534' }} />
            <span className="font-sans text-xs font-semibold" style={{ color: '#166534' }}>Available Now</span>
          </div>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        {/* Description card */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03] text-center">
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mb-4">
            KJB SidePanel is a free Chrome extension for reading and searching the King James Bible.
            It brings the full scriptures directly into your browser — look up any verse reference
            you encounter online, search the scriptures, and read the whole Bible from a convenient
            sidebar, without leaving the page you're on.
          </p>
          <a
            href="https://chromewebstore.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-semibold hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/30"
          >
            <Puzzle className="w-4 h-4" />
            Add to Chrome
          </a>
          <p className="font-sans text-xs text-muted-foreground mt-3">
            Free on the Chrome Web Store.
          </p>
        </div>

        {/* KJB SidePanel section header */}
        <div className="text-center mb-5">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">KJB SidePanel</h2>
          <p className="font-sans text-sm text-muted-foreground max-w-xl mx-auto">
            A free Chrome extension for reading and searching the King James Bible — built with all
            the features you love from KJB Reader, right in your browser sidebar.
          </p>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex items-start gap-3 p-5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-blue-500 to-cyan-600">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-sm text-foreground mb-1">{f.title}</p>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status note */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 shadow-lg shadow-black/[0.03]">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground mb-1">Now Available</h2>
              <p className="font-sans text-sm text-foreground/85 leading-relaxed">
                KJB SidePanel is now live on the Chrome Web Store. Install it with one click to start
                reading and searching the King James Bible from any web page. The listing ID will be
                updated here once the store listing is fully approved.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Page Scanning */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03]">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Privacy &amp; Page Scanning</h2>
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mb-4">
            The KJB Reader Web Extension scans web pages you visit to detect Bible verse references
            (e.g. &ldquo;John 3:16&rdquo;) and highlights them for quick lookup.{' '}
            <span className="font-semibold text-foreground">No page content is collected, stored, or sent to any server.</span>{' '}
            All detection happens locally in your browser.
          </p>
          <p className="font-sans font-medium text-sm text-foreground mb-2">How to exclude sites:</p>
          <ul className="space-y-2 font-sans text-sm text-foreground/85 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Right-click the extension icon in your toolbar → &ldquo;Don&rsquo;t run on this site&rdquo;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Or go to <code className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-sans text-xs">chrome://extensions</code> → KJB Reader → Details → Site access and remove specific sites</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>This extension is already configured to <span className="font-semibold">NOT</span> run on kingjamesbiblereader.com</span>
            </li>
          </ul>
        </div>

        <p className="text-center font-sans text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} KJB Reader · Last updated: {LAST_UPDATED}
        </p>
      </div>
    </div>
  );
}