import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, FileText, MonitorSmartphone, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import LandingSetupWizard from '@/components/LandingSetupWizard';
import ContactLinks from '@/components/ContactLinks';
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

        {/* Legal — Privacy / Terms / Legacy, collapsed by default */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '180ms', animationFillMode: 'both' }}>
          <Collapsible defaultOpen={false}>
            <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-lg shadow-black/[0.03]">
              <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 text-center group">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-1 text-center">Legal & Legacy</h3>
                  <p className="font-sans text-xs text-muted-foreground text-center">Privacy, terms, and the legacy reader for old browsers (e.g. IE11)</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-sm mx-auto mt-4">
                  {[
                    { to: '/privacy', icon: Shield, title: 'Privacy', sub: 'Privacy Policy', bg: 'from-slate-500 to-slate-700' },
                    { to: '/terms', icon: FileText, title: 'Terms', sub: 'Terms of Service', bg: 'from-amber-500 to-orange-600' },
                    { to: '/legacy', icon: MonitorSmartphone, title: 'Legacy', sub: 'Old-browser reader', bg: 'from-sky-500 to-blue-600' },
                  ].map(({ to, icon: Icon, title, sub, bg }) => (
                    <Link
                      key={to}
                      to={to}
                      className="group flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:border-accent/50 transition-all"
                    >
                      <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-white bg-gradient-to-br ${bg} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans font-semibold text-xs text-foreground truncate">{title}</p>
                        <p className="font-sans text-[11px] text-muted-foreground truncate">{sub}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent ml-auto shrink-0" />
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        {/* Contact — rich link cards, collapsed by default */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '240ms', animationFillMode: 'both' }}>
          <Collapsible defaultOpen={false}>
            <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-lg shadow-black/[0.03]">
              <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 text-center group">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-1 text-center">Links & Contact</h3>
                  <p className="font-sans text-xs text-muted-foreground text-center">Ways to reach us and follow the ministry</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4">
                  <ContactLinks />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        <p className="text-center font-sans text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} KJB Reader · Last updated: {LAST_UPDATED}
        </p>
      </div>
    </div>
  );
}