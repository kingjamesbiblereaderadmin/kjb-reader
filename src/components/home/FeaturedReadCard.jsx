import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';

// The large featured hero tile for "Read the Bible" on the home bento grid.
// Links to /read with the exact original label/desc — no new text introduced.
// Photo-free: a rich indigo→violet gradient with soft glows carries the tile.
export default function FeaturedReadCard() {
  return (
    <Link
      to="/read"
      onClick={() => window.scrollTo({ top: 0 })}
      className="group print:hidden relative block overflow-hidden rounded-3xl border border-border/60 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300"
    >
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700" />
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-transparent to-violet-400/20" />
      {/* Decorative glows */}
      <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative p-6 sm:p-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl text-white shadow-lg bg-white/15 ring-2 ring-white/25 backdrop-blur-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <p className="font-serif font-bold text-xl sm:text-2xl leading-tight text-white drop-shadow-sm">Read the Bible</p>
            <p className="font-sans text-sm text-white/80 mt-0.5">KJB Pure Cambridge Edition</p>
          </div>
        </div>
        <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-2 ring-white/25 group-hover:scale-110 group-hover:rotate-[-12deg] transition-transform duration-300 backdrop-blur-sm">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}