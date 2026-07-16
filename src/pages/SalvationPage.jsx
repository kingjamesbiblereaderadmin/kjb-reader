import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import GospelContent from '@/components/GospelContent';

export default function SalvationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        <div className="text-center mb-6">
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Landing
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30 mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">How to Be Saved</h1>
          <p className="font-sans text-sm text-muted-foreground">The Gospel of Jesus Christ</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        <GospelContent />
      </div>
    </div>
  );
}