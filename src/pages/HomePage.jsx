import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings } from 'lucide-react';
import { getDailyVerse } from '@/lib/dailyVerse';
import { registerSW, scheduleDailyNotification, getNotificationsEnabled } from '@/lib/notifications';

const QUICK_LINKS = [
  { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', color: 'bg-primary text-primary-foreground' },
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', color: 'bg-secondary text-secondary-foreground' },
  { path: '/gospel', icon: Heart, label: 'The Gospel', desc: 'How to be saved', color: 'bg-red-600 text-white' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'KJB defence & study', color: 'bg-secondary text-secondary-foreground' },
  { path: '/about', icon: Info, label: 'About', desc: 'Ministry & links', color: 'bg-secondary text-secondary-foreground' },
  { path: '/settings', icon: Settings, label: 'Settings', desc: 'Offline downloads & info', color: 'bg-secondary text-secondary-foreground' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const verse = getDailyVerse();

  useEffect(() => {
    registerSW();
    if (getNotificationsEnabled()) {
      scheduleDailyNotification(verse);
    }
  }, []);

  const handleVerseClick = () => {
    try {
      localStorage.setItem('kjb-position', JSON.stringify({ abbr: verse.abbr, chapter: verse.chapter, verse: verse.verse }));
    } catch {}
    navigate('/read');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Daily verse of the day */}
      <button
        onClick={handleVerseClick}
        className="w-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 md:p-12 mb-8 text-center hover:border-primary/40 hover:from-primary/15 hover:to-accent/15 transition-all cursor-pointer"
      >
        <p className="font-sans text-xs text-primary tracking-widest uppercase font-semibold mb-4">Verse of the Day</p>
        <blockquote className="font-serif text-2xl md:text-3xl font-bold text-foreground leading-relaxed italic mb-4">
          "{verse.text}"
        </blockquote>
        <p className="font-sans text-base font-semibold text-primary">— {verse.ref} (KJB)</p>
        <div className="mt-6 w-12 h-px bg-accent mx-auto" />
      </button>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {QUICK_LINKS.map(link => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:opacity-90 transition-opacity ${link.color}`}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-serif font-bold text-lg leading-tight">{link.label}</p>
                <p className="font-sans text-xs opacity-75 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Gospel call */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center">
        <p className="font-serif text-xl font-bold text-red-700 dark:text-red-400 mb-2">Are you saved?</p>
        <p className="font-sans text-sm text-foreground/80 mb-4">
          Jesus Christ died for your sins, shed his blood, was buried, and rose again on the third day. Trust the blood — believe the gospel and be saved.
        </p>
        <Link
          to="/gospel"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans text-sm font-medium transition-colors"
        >
          <Heart className="w-4 h-4" />
          Learn How to be Saved
        </Link>
      </div>
    </div>
  );
}