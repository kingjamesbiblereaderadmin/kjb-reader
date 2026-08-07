import React from 'react';
import GospelContent from '@/components/GospelContent';

export default function GospelPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/5 to-background overflow-hidden">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-rose-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-10 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
        <GospelContent />
      </div>
    </div>
  );
}