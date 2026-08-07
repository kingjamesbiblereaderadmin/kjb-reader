import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, Search, BookOpen, Sparkles, Bell, MousePointer2, Heart, Download } from 'lucide-react';

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
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">KJB Reader - SidePanel</h1>
          <p className="mt-1 max-w-xl mx-auto rounded-xl bg-amber-100 dark:bg-amber-900/20 px-4 py-2 font-sans text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Desktop Only — This extension is designed for desktop browsers only (Chrome, Edge, Brave on Windows, macOS, and Linux). It is not available on mobile browsers.
          </p>
          <p className="mt-3 mb-3 font-sans text-sm text-muted-foreground">Read, search, and look up Bible verses from any web page.</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#DBEAFE' }}>
            <span className="font-sans text-xs font-semibold" style={{ color: '#1E40AF' }}>Coming to Chrome Web Store</span>
          </div>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        {/* Description card */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03] text-center">
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mb-4">
            The KJB Reader - SidePanel brings the King James Bible directly into your browser. Look up any
            verse reference you encounter online, search the scriptures, and read the full Bible —
            all from a convenient sidebar.
          </p>
          <a
            href="https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/23620054b_KJB-Reader-SidePanel-v030.zip"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-sans text-sm font-semibold text-white hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
            style={{ backgroundColor: '#16A34A' }}
          >
            <Download className="w-4 h-4" />
            Download KJB Reader - SidePanel (.zip)
          </a>
          <p className="font-sans text-xs text-muted-foreground mt-3">
            Coming soon to the Chrome Web Store. Download the .zip to install manually in developer mode.
          </p>
          <p className="font-sans text-xs text-muted-foreground mt-2">
            <Link to="/extension-privacy" className="text-primary hover:underline font-medium">
              Extension Privacy Policy
            </Link>
          </p>
        </div>

        {/* Installation Instructions */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03]">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-4">Installation Instructions</h2>
          <ol className="space-y-3 font-sans text-sm text-foreground/85 leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
              <span>Download the .zip file using the button above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>Extract/unzip the downloaded file</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
              <span>Open Chrome and go to <code className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-sans text-xs">chrome://extensions</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
              <span>Enable &lsquo;Developer mode&rsquo; (toggle in top right)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">5</span>
              <span>Click &lsquo;Load unpacked&rsquo; and select the extracted folder</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">6</span>
              <span>The KJB SidePanel icon will appear in your toolbar</span>
            </li>
          </ol>
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

        {/* Screenshot */}
        <div className="flex flex-col items-center mb-5">
          <img
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/cc7bde00a_Screenshot2026-08-07190320.png"
            alt="KJB SidePanel in action"
            className="w-full max-w-2xl rounded-2xl border border-border/60 shadow-lg"
          />
          <p className="font-sans text-xs text-muted-foreground mt-3">KJB SidePanel in action</p>
        </div>
      </div>
    </div>
  );
}