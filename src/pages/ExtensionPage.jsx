import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, Search, BookOpen, Sparkles, MousePointer2, Heart, Download, Chrome, Link2 } from 'lucide-react';

const DOWNLOAD_URL = 'https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/cf192cb7b_kjb-reader-v0437-chrome.zip';
const VERSION = 'v0.4.37';

const EXAMPLES = [
  {
    heading: 'Single Verses',
    items: ['Ephesians 1:13', 'Romans 3:25', 'Acts 16:31', '1 John 5:13'],
  },
  {
    heading: 'Verse Ranges',
    items: ['1 Corinthians 15:1-4', 'Romans 3:23-26', 'Ephesians 2:8-9', 'Isaiah 53:3-6'],
  },
  {
    heading: 'Whole Chapters',
    items: ['Psalm 23', 'Isaiah 53', 'John 1', 'Matthew 5'],
  },
  {
    heading: 'Chapter Ranges',
    items: ['John 1-3', 'Romans 8', 'Genesis 1-2', 'Revelation 21-22'],
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
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f', color: '#ffffff' }}>
      <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Back button */}
        <div className="mb-8">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border font-sans text-sm font-medium hover:opacity-80 transition-all duration-200"
            style={{ borderColor: '#3f3f4a', color: '#a1a1aa' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-5"
            style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
          >
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
            KJB Reader - SidePanel
          </h1>

          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5" style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.4)' }}>
            <span className="font-sans text-xs font-semibold" style={{ color: '#60a5fa' }}>{VERSION}</span>
          </div>

          {/* Desktop-only warning box */}
          <div
            className="max-w-2xl mx-auto rounded-xl px-4 py-3 mb-5"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
          >
            <p className="font-sans text-xs leading-relaxed" style={{ color: '#fbbf24' }}>
              <strong>Desktop Only</strong> — This extension is designed for desktop browsers only (Chrome, Edge, Brave on Windows, macOS, and Linux). It is not available on mobile browsers.
            </p>
          </div>

          {/* Subtitle */}
          <p className="font-sans text-base mb-6" style={{ color: '#a1a1aa' }}>
            Read, search, and look up Bible verses from any web page.
          </p>

          {/* Download button */}
          <div className="flex flex-col items-center gap-3">
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-sans text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{ backgroundColor: '#22c55e' }}
            >
              <Download className="w-5 h-5" />
              Download for Chrome / Edge
            </a>
            <p className="font-sans text-xs" style={{ color: '#71717a' }}>
              <Link to="/extension-privacy" className="hover:underline font-medium" style={{ color: '#60a5fa' }}>
                Extension Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Sidebar preview mockups */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-white mb-6 text-center">See It In Action</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MOCKUPS.map((m) => (
              <div key={m.label} className="flex flex-col items-center">
                <img
                  src={m.light}
                  alt={m.label}
                  loading="lazy"
                  className="kjb-mockup-light w-full rounded-xl border shadow-lg transition-transform duration-200 hover:scale-[1.02]"
                  style={{ borderColor: '#3f3f4a', backgroundColor: '#1c1c24' }}
                />
                <img
                  src={m.dark}
                  alt={m.label}
                  loading="lazy"
                  className="kjb-mockup-dark w-full rounded-xl border shadow-lg transition-transform duration-200 hover:scale-[1.02]"
                  style={{ borderColor: '#3f3f4a', backgroundColor: '#1c1c24' }}
                />
                <p className="font-sans text-xs text-center mt-3 leading-relaxed" style={{ color: '#a1a1aa' }}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Try These Examples */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-white mb-2 text-center">Try These Examples</h2>
          <p className="font-sans text-sm text-center mb-6" style={{ color: '#a1a1aa' }}>
            Install the extension, then click any reference below to look it up instantly in the side panel.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EXAMPLES.map((col) => (
              <div
                key={col.heading}
                className="p-5 rounded-2xl border shadow-sm"
                style={{ backgroundColor: '#1c1c24', borderColor: '#3f3f4a' }}
              >
                <p className="font-sans font-semibold text-sm text-white mb-4">{col.heading}</p>
                <div className="flex flex-col gap-3">
                  {col.items.map((ref) => (
                    <p
                      key={ref}
                      className="font-sans text-white"
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
          <h2 className="font-serif text-2xl font-bold text-white mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-3 p-5 rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                  style={{ backgroundColor: '#1c1c24', borderColor: '#3f3f4a' }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-semibold text-sm text-white mb-1">{f.title}</p>
                    <p className="font-sans text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Installation Instructions */}
        <div
          className="rounded-2xl p-6 sm:p-7 mb-8 shadow-lg"
          style={{ backgroundColor: '#1c1c24', border: '1px solid #3f3f4a' }}
        >
          <h2 className="font-serif text-xl font-semibold text-white mb-5">Installation Instructions</h2>
          <ol className="space-y-3 font-sans text-sm leading-relaxed" style={{ color: '#d4d4d8' }}>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>1</span>
              <span>Download the .zip file using the button above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>2</span>
              <span>Extract/unzip the downloaded file</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>3</span>
              <span>Open Chrome and go to <code className="px-1.5 py-0.5 rounded font-sans text-xs" style={{ backgroundColor: '#0a0a0f', color: '#60a5fa' }}>chrome://extensions</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>4</span>
              <span>Enable &lsquo;Developer mode&rsquo; (toggle in top right)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>5</span>
              <span>Click &lsquo;Load unpacked&rsquo; and select the extracted folder</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>6</span>
              <span>The KJB SidePanel icon will appear in your toolbar</span>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <p className="font-sans text-xs text-center" style={{ color: '#71717a' }}>
          Printed from KJB Reader Web Extension — kingjamesbiblereader.com/extension
        </p>
      </div>
    </div>
  );
}