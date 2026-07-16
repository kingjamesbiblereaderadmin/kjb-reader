import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Wrench, Image, CalendarDays, BookOpen, Tag, Smartphone, LogOut, Loader2 } from 'lucide-react';
import VerseImageTester from '@/components/dev/VerseImageTester';
import DailyVerseSchedule from '@/components/dev/DailyVerseSchedule';
import BibleTextEditor from '@/components/dev/BibleTextEditor';
import VersionInfo from '@/components/dev/VersionInfo';
import ManifestEditor from '@/components/dev/ManifestEditor';
import DevToolErrorBoundary from '@/components/dev/DevToolErrorBoundary';
import DevToolsSignIn from '@/components/dev/DevToolsSignIn';

// NOTE: The page is protected by admin authentication (base44.auth.me() +
// role === 'admin'). Backend saves also require a real admin session.
const TABS = [
  { id: 'image', label: 'Verse Image', icon: Image },
  { id: 'schedule', label: 'Daily Verses', icon: CalendarDays },
  { id: 'text', label: 'Edit Bible Text', icon: BookOpen },
  { id: 'manifest', label: 'Manifest & Icons', icon: Smartphone },
  { id: 'version', label: 'Version', icon: Tag },
];

export default function DevToolsPage() {
  const [tab, setTab] = useState('image');
  const { user, isLoadingAuth } = useAuth();

  // Checking auth session.
  if (isLoadingAuth) {
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
    base44.auth.logout('/dev-tools');
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