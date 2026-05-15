import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Heart, Library, Info, Moon, Sun, Settings, Menu, X } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import BibleSearchBar from '@/components/bible/BibleSearchBar';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/read', icon: BookOpen, label: 'Read' },
  { path: '/gospel', icon: Heart, label: 'Gospel' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMenuOpen(false)}>
            <BookOpen className="w-5 h-5 text-accent" />
            <span className="font-serif text-lg font-bold tracking-wide text-foreground hidden sm:block">
              King James Bible
            </span>
            <span className="font-serif text-lg font-bold tracking-wide text-foreground sm:hidden">
              KJB
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-xs">
            <BibleSearchBar onClose={() => setMenuOpen(false)} />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Open menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Dropdown nav menu */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-14 z-40 bg-background/95"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-14 right-0 left-0 z-50 bg-card backdrop-blur-md border-b border-border shadow-lg">
              <div className="max-w-4xl mx-auto px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-1">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const active = item.path === '/' ? pathname === '/' : pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}