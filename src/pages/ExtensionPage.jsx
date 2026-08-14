import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Globe, ArrowLeft, Search, BookOpen, Sparkles, MousePointer2, Heart, Download, Chrome, Link2, Shield, Puzzle, FileText, Scale } from 'lucide-react';

// Built-in defaults — overridden by the admin-editable ExtensionConfig entity
// (Dev Tools → Extension Links). Each field falls back here when blank.
const DEFAULT_URLS = {
  chrome: 'https://chromewebstore.google.com/detail/kjb-reader-sidepanel/gbnipepkpenjgdpjfepgcgddmgbofmah',
  firefox: 'https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/ec57a7dee_kjb-reader-v04127-firefox.zip',
  opera: 'https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/eccbf229f_kjb-reader-v04127-opera.zip',
  edge: 'https://microsoftedge.microsoft.com/addons/detail/kjb-reader-sidepanel/bphmmbiepbhfnfijaapbmpimkkjdceee',
};
const DEFAULT_VERSION = 'v0.4.127';

const EXAMPLES = [
  {
    heading: 'Single Verses',
    items: ['Ephesians 1:13', 'Romans 3:25', 'Hebrews 9:12'],
  },
  {
    heading: 'Verse Ranges',
    items: ['1 Corinthians 15:1-4', 'Romans 3:23-25', 'Ephesians 2:8-9'],
  },
  {
    heading: 'Whole Chapters',
    items: ['Psalm 23', 'Isaiah 53', 'Psalm 119', 'Hebrews 13'],
  },
  {
    heading: 'Chapter Ranges',
    items: ['Romans 1-3', 'Ephesians 1-2'],
  },
];

const MOCKUPS = [
  {
    light: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/de194f2c0_image.png',
    dark: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2cd1a9033_image.png',
    label: 'Results',
  },
  {
    light: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/b530eb08a_image.png',
    dark: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/e1356f9fe_image.png',
    label: 'Read',
  },
  {
    light: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/043f4e33f_image.png',
    dark: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/56bb30b6a_image.png',
    label: 'Gospel',
  },
  {
    light: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/75bcdffe1_image.png',
    dark: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/4f7783201_image.png',
    label: 'Resources',
  },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Instant Verse Lookup',
    desc: 'Auto-detect Bible references on any web page. Verses become clickable links that open in the sidebar.',
  },
  {
    icon: BookOpen,
    title: 'Read the KJB',
    desc: 'Full King James Bible (Pure Cambridge Edition) with chapter navigation, verse numbers, and pilcrows.',
  },
  {
    icon: MousePointer2,
    title: 'Right-Click Search',
    desc: 'Select any text on a page, right-click, and look it up in the KJB sidebar instantly.',
  },
  {
    icon: Sparkles,
    title: 'Advanced Search',
    desc: 'Wildcards (? and *), whole-word match, case sensitivity, and Old/New Testament filtering.',
  },
  {
    icon: Heart,
    title: 'Gospel Tab',
    desc: 'Built-in salvation guide with 1 Corinthians 15:1-4, Romans 3:25, and verified KJB preachers.',
  },
  {
    icon: Link2,
    title: 'Resources Tab',
    desc: 'Quick links to KJBI.org, Discord bot, KJB defence materials, and ministry websites.',
  },
];

export default function ExtensionPage() {
  const [urls, setUrls] = useState(DEFAULT_URLS);
  const [version, setVersion] = useState(DEFAULT_VERSION);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await base44.entities.ExtensionConfig.list('-updated_date', 1);
        const cfg = rows && rows[0];
        if (cancelled || !cfg) return;
        setUrls({
          chrome: cfg.chrome || DEFAULT_URLS.chrome,
          edge: cfg.edge || DEFAULT_URLS.edge,
          firefox: cfg.firefox || DEFAULT_URLS.firefox,
          opera: cfg.opera || DEFAULT_URLS.opera,
        });
        if (cfg.version) setVersion(cfg.version);
        setShowInstructions(cfg.show_instructions !== false);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Back button */}
        <div className="mb-8">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border font-sans text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <img
            src="https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/679d87279_icon128.png"
            alt="KJB Reader SidePanel"
            className="block mx-auto w-16 h-16 rounded-2xl shadow-lg mb-5"
          />
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
            KJB Reader - SidePanel
          </h1>

          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 bg-primary/15 border border-primary/40">
            <span className="font-sans text-xs font-semibold text-primary">{version}</span>
          </div>

          {/* Browser compatibility notice */}
          <div className="max-w-2xl mx-auto rounded-xl px-4 py-3 mb-5 bg-primary/10 border border-primary/35">
            <p className="font-sans text-xs leading-relaxed text-primary">
              <strong>Desktop &amp; Edge Mobile</strong> — Available for Chrome, Edge, Brave, Firefox, and Opera on desktop. Also tested on Microsoft Edge mobile. Other mobile browsers may not support browser extensions.
            </p>
          </div>

          {/* Subtitle */}
          <p className="font-sans text-base mb-6 text-muted-foreground">
            Read, search, and look up Bible verses from any web page.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-center gap-3 w-full sm:w-auto">
            <a
              href={urls.chrome}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-sans text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-green-500 hover:bg-green-600"
            >
              <Puzzle className="w-5 h-5" />
              Get for Chrome/Brave
            </a>
            <a
              href={urls.edge}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-sans text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-green-500 hover:bg-green-600"
            >
              <Puzzle className="w-5 h-5" />
              Get for Microsoft Edge
            </a>
            <a
              href={urls.firefox}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-sans text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-green-500 hover:bg-green-600"
            >
              <Puzzle className="w-5 h-5" />
              Get for Firefox
            </a>
            <a
              href={urls.opera}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-sans text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-green-500 hover:bg-green-600"
            >
              <Puzzle className="w-5 h-5" />
              Get for Opera
            </a>
          </div>
        </div>

        {/* Sidebar preview mockups */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 text-center">See It In Action</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MOCKUPS.map((m) => (
              <div key={m.label} className="flex flex-col items-center">
                <img
                  src={m.light}
                  alt={m.label}
                  loading="lazy"
                  className="kjb-mockup-light w-full rounded-xl border border-border bg-card shadow-lg transition-transform duration-200 hover:scale-[1.02]"
                />
                <img
                  src={m.dark}
                  alt={m.label}
                  loading="lazy"
                  className="kjb-mockup-dark w-full rounded-xl border border-border bg-card shadow-lg transition-transform duration-200 hover:scale-[1.02]"
                />
                <p className="font-sans text-xs text-center mt-3 leading-relaxed text-muted-foreground">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Try These Examples */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2 text-center">Try These Examples</h2>
          <p className="font-sans text-sm text-center mb-6 text-muted-foreground">
            Install the extension, then click any reference below to look it up instantly in the side panel.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EXAMPLES.map((col) => (
              <div
                key={col.heading}
                className="p-5 rounded-2xl border border-border bg-card shadow-sm"
              >
                <p className="font-sans font-semibold text-sm text-foreground mb-4">{col.heading}</p>
                <div className="flex flex-col gap-3">
                  {col.items.map((ref) => (
                    <p
                      key={ref}
                      className="font-sans text-foreground"
                      style={{ fontSize: '18px', lineHeight: '1.4' }}
                    >
                      {ref}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-semibold text-sm text-foreground mb-1">{f.title}</p>
                    <p className="font-sans text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Installation Instructions */}
        {showInstructions && (
        <div className="rounded-2xl p-6 sm:p-7 mb-8 shadow-lg bg-card border border-border">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-5">Installation Instructions</h2>
          <ol className="space-y-3 font-sans text-sm leading-relaxed text-foreground/90">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary">1</span>
              <span>Download the .zip file using the button above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary">2</span>
              <span>Extract/unzip the downloaded file</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary">3</span>
              <span>Open Chrome and go to <code className="px-1.5 py-0.5 rounded font-sans text-xs bg-muted text-primary">chrome://extensions</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary">4</span>
              <span>Enable &lsquo;Developer mode&rsquo; (toggle in top right)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary">5</span>
              <span>Click &lsquo;Load unpacked&rsquo; and select the extracted folder</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary">6</span>
              <span>The KJB SidePanel icon will appear in your toolbar</span>
            </li>
          </ol>
        </div>
        )}

        {/* Legal documents — Privacy Policy, Terms of Service, License */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/extension-privacy"
            className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-card/70 backdrop-blur-xl shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-violet-500 to-purple-600">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">
                Extension Privacy Policy
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                How the extension handles your data
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-accent transition-colors" />
          </Link>
          <Link
            to="/extension-terms"
            className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-card/70 backdrop-blur-xl shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">
                Extension Terms of Service
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                Terms for using the extension
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-accent transition-colors" />
          </Link>
          <Link
            to="/extension-license"
            className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-card/70 backdrop-blur-xl shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-amber-500 to-orange-600">
              <Scale className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">
                Extension MIT License
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                Open-source license terms
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-accent transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}