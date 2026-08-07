import React from 'react';
import { Link } from 'react-router-dom';
import { Puzzle, ArrowLeft, CheckCircle, Search, BookOpen, Sparkles, Bell } from 'lucide-react';

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
    icon: Sparkles,
    title: 'Quick Search',
    desc: 'Search verses by keyword, phrase, or wildcard across the whole Bible.',
  },
  {
    icon: Bell,
    title: 'Verse of the Day',
    desc: 'A daily verse delivered right to your sidebar for encouragement.',
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
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">KJB Reader Chrome Extension</h1>
          <p className="font-sans text-sm text-muted-foreground">Read, search, and look up Bible verses from any web page.</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-sans text-xs font-semibold text-accent">Coming Soon!</span>
          </div>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        {/* Description card */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03] text-center">
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mb-4">
            The KJB Reader Chrome Extension brings the King James Bible directly into your browser.
            Look up any verse reference you encounter online, search the scriptures, and read the
            full Bible — all from a convenient sidebar, without leaving the page you're on.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] opacity-60 cursor-not-allowed"
            aria-disabled="true"
          >
            <Puzzle className="w-4 h-4" />
            Get the KJB Reader Chrome Extension
          </a>
          <p className="font-sans text-xs text-muted-foreground mt-3">
            Available on the Chrome Web Store once published.
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
              <h2 className="font-serif text-lg font-semibold text-foreground mb-1">In Development</h2>
              <p className="font-sans text-sm text-foreground/85 leading-relaxed">
                The KJB Reader Chrome Extension is currently in development. Once published to the
                Chrome Web Store, you'll be able to install it with one click. Check back soon —
                this page will be updated with the install link.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center font-sans text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} KJB Reader · Last updated: {LAST_UPDATED}
        </p>
      </div>
    </div>
  );
}