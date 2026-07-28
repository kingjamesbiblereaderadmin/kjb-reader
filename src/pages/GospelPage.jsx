import React from 'react';
import { Heart } from 'lucide-react';
import GospelContent from '@/components/GospelContent';

export default function GospelPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30 mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">The Gospel</h1>
          <p className="font-sans text-sm text-muted-foreground">How to be saved</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-black/[0.03]">
          <GospelContent />
        </div>
      </div>
    </div>
  );
}