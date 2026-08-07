import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import GospelContent from '@/components/GospelContent';

export default function SalvationPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/5 to-background overflow-hidden">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:bg-accent/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Landing
          </Link>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '80ms', animationFillMode: 'both' }}>
          <GospelContent showPreachers />
        </div>
      </div>
    </div>
  );
}