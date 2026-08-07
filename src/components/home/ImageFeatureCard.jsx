import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// A medium feature tile backed by an AI-generated image. Used for the
// secondary bento cards (e.g. Table of Contents, Resources). Behaviour
// mirrors QuickLinkCard: a <Link> that scrolls to top on click.
export default function ImageFeatureCard({ to, image, icon: Icon, label, desc, iconGradient }) {
  return (
    <Link
      to={to}
      onClick={() => window.scrollTo({ top: 0 })}
      className="group print:hidden relative block overflow-hidden rounded-3xl border border-border/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 h-full"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-center gap-3">
        <div className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br ring-2 ring-white/15 ${iconGradient}`}>
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif font-bold text-base sm:text-lg leading-tight text-foreground truncate">{label}</p>
          <p className="font-sans text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/70 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-accent transition-all" />
      </div>
    </Link>
  );
}