import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LandingSetupWizard from '@/components/LandingSetupWizard';
import { LegalContactStep } from '@/components/LandingContentSteps';
import ScriptureBanner from '@/components/ScriptureBanner';

const LAST_UPDATED = 'July 16th, 2026';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/5 to-background overflow-hidden">
      {/* Decorative ambient background — purposeful colour, no images */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Hero header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 blur-xl" />
            <Link to="/" className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30 ring-1 ring-white/20 hover:scale-105 active:scale-95 transition-transform">
              <img
                src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/ef85a8765_8e738d108_cfb4bf781_Untitled.png"
                alt="KJB Reader Logo"
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Welcome to KJB Reader</h1>
          <p className="font-sans text-sm text-muted-foreground">Read the King James Bible — anytime, anywhere, even offline.</p>
          <div className="mt-5">
            <Link
              to="/"
              onClick={() => { try { localStorage.setItem('kjb-has-visited-app', 'true'); } catch {} }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-semibold hover:opacity-90 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-md"
            >
              Open KJB Reader
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Scripture banner */}
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '60ms', animationFillMode: 'both' }}>
          <ScriptureBanner />
        </div>

        {/* Setup wizard — Install, Theme, Fonts, Background, Notif, Gospel, Resources */}
        <div className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '120ms', animationFillMode: 'both' }}>
          <LandingSetupWizard />
        </div>

        {/* Links & Contact — outside the wizard, always visible below */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '180ms', animationFillMode: 'both' }}>
          <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-lg shadow-black/[0.03]">
            <LegalContactStep />
          </div>
        </div>

        <p className="text-center font-sans text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} KJB Reader · Last updated: {LAST_UPDATED}
        </p>
      </div>
    </div>
  );
}