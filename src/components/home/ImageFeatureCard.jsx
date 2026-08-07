import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// A medium feature tile. Photo-free: the tile uses a coloured gradient
// (derived from `iconGradient`) with soft glows. Behaviour mirrors
// QuickLinkCard: a <Link> that scrolls to top on click.
export default function ImageFeatureCard({ to, icon: Icon, label, desc, iconGradient }) {
  return (
    <Link
      to={to}
      onClick={() => window.scrollTo({ top: 0 })}
      className="group print:hidden relative block overflow-hidden rounded-3xl border border-border/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 h-full"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${iconGradient}`} />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/15" />
      <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative p-5 sm:p-6 flex items-center gap-3">
        <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-white shadow-md bg-white/15 ring-2 ring-white/25 backdrop-blur-sm">
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif font-bold text-base sm:text-lg leading-tight text-white truncate">{label}</p>
          <p className="font-sans text-xs text-white/80 mt-0.5 truncate">{desc}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
      </div>
    </Link>
  );
}