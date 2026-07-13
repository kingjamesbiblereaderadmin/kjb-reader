import React, { useState } from 'react';
import { Wrench, Image, CalendarDays, BookOpen, Tag, Smartphone } from 'lucide-react';
import VerseImageTester from '@/components/dev/VerseImageTester';
import DailyVerseSchedule from '@/components/dev/DailyVerseSchedule';
import BibleTextEditor from '@/components/dev/BibleTextEditor';
import VersionInfo from '@/components/dev/VersionInfo';
import ManifestEditor from '@/components/dev/ManifestEditor';
import DevToolErrorBoundary from '@/components/dev/DevToolErrorBoundary';

// Secret key required in the URL: /dev-tools?key=KJB-DEV-2026
// Wrong or missing key renders a plain 404-style page so the tools stay hidden.
const SECRET_KEY = 'KJB-DEV-2026';

const TABS = [
  { id: 'image', label: 'Verse Image', icon: Image },
  { id: 'schedule', label: 'Daily Verses', icon: CalendarDays },
  { id: 'text', label: 'Edit Bible Text', icon: BookOpen },
  { id: 'manifest', label: 'Manifest & Icons', icon: Smartphone },
  { id: 'version', label: 'Version', icon: Tag },
];

export default function DevToolsPage() {
  const key = new URLSearchParams(window.location.search).get('key');
  const [tab, setTab] = useState('image');

  if (key !== SECRET_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-sans text-sm text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 py-8 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <Wrench className="w-5 h-5 text-primary" />
        <h1 className="font-serif text-2xl font-bold text-foreground">Dev Tools</h1>
      </div>
      <p className="font-sans text-xs text-muted-foreground mb-6">Private admin utilities. Keep this URL secret.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent/20'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <DevToolErrorBoundary resetKey={tab}>
        {tab === 'image' && <VerseImageTester />}
        {tab === 'schedule' && <DailyVerseSchedule />}
        {tab === 'text' && <BibleTextEditor />}
        {tab === 'manifest' && <ManifestEditor />}
        {tab === 'version' && <VersionInfo />}
      </DevToolErrorBoundary>
    </div>
  );
}