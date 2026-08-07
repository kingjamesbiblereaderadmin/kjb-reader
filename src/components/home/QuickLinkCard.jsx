import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// A compact navigation tile used in the home bento grid. Supports both
// <Link> navigation and a plain onClick (e.g. Random Chapter button).
// Visual-only refresh — the prop contract and behaviour are unchanged.
export default function QuickLinkCard({ to, onClick, icon: Icon, label, desc, iconGradient, className: extraClassName = '' }) {
  const inner = (
    <>
      <div className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br ring-1 ring-black/5 dark:ring-white/15 ${iconGradient}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif font-bold text-base leading-tight text-foreground truncate">{label}</p>
        <p className="font-sans text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-accent transition-all" />
    </>
  );

  const className =
    `group relative flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 shadow-sm hover:shadow-lg hover:border-accent/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 h-full overflow-hidden ${extraClassName}`;

  if (onClick) {
    return (
      <button onClick={onClick} className={`${className} text-left w-full`}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={to} onClick={() => window.scrollTo({ top: 0 })} className={className}>
      {inner}
    </Link>
  );
}