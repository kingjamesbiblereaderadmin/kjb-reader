import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wrench, Image, CalendarDays, BookOpen, Tag, Smartphone, LogOut, Loader2 } from 'lucide-react';
import VerseImageTester from '@/components/dev/VerseImageTester';
import DailyVerseSchedule from '@/components/dev/DailyVerseSchedule';
import BibleTextEditor from '@/components/dev/BibleTextEditor';
import VersionInfo from '@/components/dev/VersionInfo';
import ManifestEditor from '@/components/dev/ManifestEditor';
import DevToolErrorBoundary from '@/components/dev/DevToolErrorBoundary';
import DevToolsSignIn from '@/components/dev/DevToolsSignIn';

// Secret key required in the URL: /dev-tools?key=KJB-DEV-2026
// Wrong or missing key renders a plain 404-style page so the tools stay hidden.
// NOTE: this key only hides the page — backend saves require a real admin
// session (base44.auth.me() + role === 'admin').
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let done = false;
    base44.auth.me()
      .then(u => { if (!done) { setUser(u); setAuthLoading(false); } })
      .catch(() => { if (!done) { setUser(null); setAuthLoading(false); } });
    return () => { done = true; };
  }, []);

  // Wrong/missing URL key → 404-style page.
  if (key !== SECRET_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-sans text-sm text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  // Checking auth session.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary/70" />
      </div>
    );
  }

  // Not signed in (or not an admin) → show the inline sign-in form.
  if (!user || user.role !== 'admin') {
    return <DevToolsSignIn />;
  }

  const handleLogout = () => {
    const keyParam = new URLSearchParams(window.location.search).get('key');
    const qs = keyParam ? `?key=${keyParam}` : '';
    base44.auth.logout(`/dev-tools${qs}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 py-8 pb-24">
      <div className="flex items-center justify-between mb-1 gap-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h1 className="font-serif text-2xl font-bold text-foreground">Dev Tools</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent/20 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
      <p className="font-sans text-xs text-muted-foreground mb-6">
        Signed in as {user.email || user.full_name || 'admin'} · Private admin utilities.
      </p>

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