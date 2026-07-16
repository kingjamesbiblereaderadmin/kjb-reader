import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Mail, Globe, Youtube, ArrowRight, Heart, MonitorSmartphone } from 'lucide-react';
import LandingSetupWizard from '@/components/LandingSetupWizard';

const LAST_UPDATED = 'July 16th, 2026';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30 mb-4 hover:scale-105 active:scale-95 transition-transform">
            <img
              src="https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/1d77e5114_icon-512.png"
              alt="KJB Reader Logo"
              className="w-full h-full object-cover"
            />
          </Link>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Welcome to KJB Reader</h1>
          <p className="font-sans text-sm text-muted-foreground">Read the King James Bible — anytime, anywhere, even offline.</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        {/* CTA */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03] text-center">
          <p className="font-sans text-sm text-foreground/85 leading-relaxed mb-4">
            KJB Reader is a free, installable Bible reading app featuring the King James Bible
            (Pure Cambridge Edition). Enjoy daily verses, offline reading, search, bookmarks,
            and customizable typography — all with privacy at the forefront.
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                to="/"
                onClick={() => { try { localStorage.setItem('kjb-has-visited-app', 'true'); } catch {} }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Open KJB Reader
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Gospel — summary pill linking to dedicated page */}
        <Link
          to="/salvation"
          className="flex items-center gap-3 p-5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group mb-5"
        >
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-rose-500 to-pink-600">
            <Heart className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Are you saved?</p>
            <p className="font-sans text-xs text-muted-foreground">Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins. Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        {/* Step-by-step setup wizard */}
        <div className="mb-5">
          <LandingSetupWizard />
        </div>

        {/* Legal Links */}
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <Link
            to="/privacy"
            className="flex items-center gap-3 p-5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-violet-500 to-purple-600">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Privacy Policy</p>
              <p className="font-sans text-xs text-muted-foreground">How your data is handled</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link
            to="/terms"
            className="flex items-center gap-3 p-5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Terms of Service</p>
              <p className="font-sans text-xs text-muted-foreground">Rules for using this app</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link
            to="/legacy"
            className="flex items-center gap-3 p-5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-slate-500 to-slate-700">
              <MonitorSmartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Legacy Reader</p>
              <p className="font-sans text-xs text-muted-foreground">For old browsers (IE 11)</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Contact */}
        <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 shadow-lg shadow-black/[0.03]">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-3">Contact</h2>
          <div className="space-y-3 font-sans text-sm text-foreground/85">
            <a href="mailto:kingjamesbiblereader@outlook.sg" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail className="w-4 h-4 text-muted-foreground" />
              kingjamesbiblereader@outlook.sg
            </a>
            <a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Globe className="w-4 h-4 text-muted-foreground" />
              godisgracious1031ministries.com
            </a>
            <a href="https://youtube.com/@shawnr325av" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Youtube className="w-4 h-4 text-muted-foreground" />
              @shawnr325av
            </a>
          </div>
        </div>

        <p className="text-center font-sans text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} KJB Reader · Last updated: {LAST_UPDATED}
        </p>
      </div>
    </div>
  );
}