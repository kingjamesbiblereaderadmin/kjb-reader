import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';

// The large featured hero tile for "Read the Bible" on the home bento grid.
// Links to /read with the exact original label/desc — no new text introduced.
const HERO_IMAGE =
  'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/a76ede377_generated_image.png';

export default function FeaturedReadCard() {
  return (
    <Link
      to="/read"
      onClick={() => window.scrollTo({ top: 0 })}
      className="group print:hidden relative block overflow-hidden rounded-3xl border border-border/60 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300"
    >
      {/* Image layer */}
      <div className="relative aspect-[16/10] sm:aspect-[2/1] lg:aspect-[5/2] w-full overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Readability + brand overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/45 via-transparent to-violet-950/35" />
        {/* Subtle top vignette for chrome legibility */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex items-end justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl text-white shadow-lg bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <p className="font-serif font-bold text-xl sm:text-2xl leading-tight text-foreground drop-shadow-sm">Read the Bible</p>
            <p className="font-sans text-sm text-muted-foreground mt-0.5">KJB Pure Cambridge Edition</p>
          </div>
        </div>
        <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white/15 group-hover:scale-110 group-hover:rotate-[-12deg] transition-transform duration-300">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}