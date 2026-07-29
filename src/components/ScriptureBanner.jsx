import React from 'react';
import { BookOpen } from 'lucide-react';

export default function ScriptureBanner() {
  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/[0.03] mb-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-primary to-accent">
          <BookOpen className="w-5 h-5" />
        </div>
        <blockquote className="font-serif text-sm sm:text-base text-foreground/85 leading-relaxed max-w-xl">
          "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."
        </blockquote>
        <p className="font-sans text-xs text-muted-foreground">— 2 Timothy 2:15</p>
      </div>
    </div>
  );
}