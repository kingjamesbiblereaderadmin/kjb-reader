import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Server } from 'lucide-react';

// Discord Bot invite links for the KJB Reader Bot (application_id
// 1529303667348606996). Kept here so kingjamesbiblereader.com/discord is the
// single canonical short link people share/click.
export const DISCORD_PERSONAL_INSTALL_URL =
  'https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=applications.commands&integration_type=1';

export const DISCORD_SERVER_INSTALL_URL =
  'https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=bot+applications.commands&permissions=378494381072';

export const DISCORD_SUPPORT_SERVER_URL = 'https://kingjamesbiblereader.com/discord';

function DiscordIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const cardClass = "group relative flex items-center gap-3 p-5 rounded-3xl bg-card/70 backdrop-blur-xl border-2 border-border/60 shadow-sm hover:shadow-xl hover:border-accent/40 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden";

export default function DiscordInvitePage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/5 to-background overflow-hidden">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Back link */}
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:bg-accent/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to KJB Reader
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '60ms', animationFillMode: 'both' }}>
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-violet-600/30 blur-xl" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
              <DiscordIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">KJB Reader Bot</h1>
          <p className="font-sans text-sm text-muted-foreground">For random, search, daily, and gospel sharing.</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        {/* Install buttons — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '100ms', animationFillMode: 'both' }}>
          <a href={DISCORD_PERSONAL_INSTALL_URL} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center text-center gap-3 p-6 rounded-3xl bg-card/70 backdrop-blur-xl border-2 border-border/60 shadow-sm hover:shadow-xl hover:border-violet-400/50 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-transparent" />
            <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br from-violet-500 to-purple-700 ring-1 ring-white/15">
              <User className="w-6 h-6" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="font-sans font-semibold text-base text-foreground group-hover:text-accent transition-colors mb-1">📱 Personal Install</p>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">Adds slash commands to your Discord account — works in DMs, group DMs, and any server.</p>
            </div>
          </a>

          <a href={DISCORD_SERVER_INSTALL_URL} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center text-center gap-3 p-6 rounded-3xl bg-card/70 backdrop-blur-xl border-2 border-border/60 shadow-sm hover:shadow-xl hover:border-indigo-400/50 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 to-transparent" />
            <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br from-indigo-500 to-violet-600 ring-1 ring-white/15">
              <Server className="w-6 h-6" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="font-sans font-semibold text-base text-foreground group-hover:text-accent transition-colors mb-1">🏠 Server Install</p>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">Bot joins a server for daily verse delivery and /setup.</p>
            </div>
          </a>
        </div>

        {/* Support server + email */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '140ms', animationFillMode: 'both' }}>
          <a href={DISCORD_SUPPORT_SERVER_URL} target="_blank" rel="noopener noreferrer" className={cardClass}>
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 opacity-[0.12] blur-2xl" />
            <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-white/15">
              <DiscordIcon className="w-5 h-5" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Support Server</p>
              <p className="font-sans text-xs text-muted-foreground">Join our Discord community for help, updates, and to share feedback.</p>
            </div>
            <ArrowRight className="relative w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </a>

          <a href="mailto:Kingjamesbiblereader@outlook.sg" className={cardClass}>
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.12] blur-2xl" />
            <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-amber-500 to-orange-600 ring-1 ring-white/15">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Support Email</p>
              <p className="font-sans text-xs text-muted-foreground">Kingjamesbiblereader@outlook.sg</p>
            </div>
            <ArrowRight className="relative w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </a>
        </div>

        {/* Credits & Attribution — left-aligned, links, British spelling */}
        <div className="mt-10 pt-6 border-t border-border/40 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '180ms', animationFillMode: 'both' }}>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Built With</h2>
          <ul className="space-y-2.5 text-xs text-muted-foreground/80">
            <li className="flex flex-wrap items-baseline gap-x-1.5">
              <a href="https://bibleprotector.com" target="_blank" rel="noopener noreferrer" className="font-serif font-medium text-accent hover:underline transition-colors">King James Bible (KJB) text</a>
              <span className="text-muted-foreground/70">— public domain, 1900 Pure Cambridge Edition, sourced from Bible Protector.</span>
            </li>
            <li className="flex flex-wrap items-baseline gap-x-1.5">
              <a href="https://discord.js.org" target="_blank" rel="noopener noreferrer" className="font-sans font-medium text-accent hover:underline transition-colors">Discord.js</a>
              <span className="text-muted-foreground/70">— open-source Node.js library (MIT licence) powering the bot's Discord integration.</span>
            </li>
            <li className="flex flex-wrap items-baseline gap-x-1.5">
              <a href="https://discloud.app" target="_blank" rel="noopener noreferrer" className="font-sans font-medium text-accent hover:underline transition-colors">Discloud</a>
              <span className="text-muted-foreground/70">— hosting provider running the bot's always-on Discord gateway connection.</span>
            </li>
            <li className="flex flex-wrap items-baseline gap-x-1.5">
              <a href="https://kingjamesbiblereader.com" target="_blank" rel="noopener noreferrer" className="font-sans font-medium text-accent hover:underline transition-colors">KJB Reader Bible API (kingjamesbiblereader.com)</a>
              <span className="text-muted-foreground/70">— the API powering verse lookup, search, and daily verse delivery.</span>
            </li>
            <li className="flex flex-wrap items-baseline gap-x-1.5">
              <a href="https://github.com/node-cron/node-cron" target="_blank" rel="noopener noreferrer" className="font-sans font-medium text-accent hover:underline transition-colors">node-cron</a>
              <span className="text-muted-foreground/70">— open-source scheduling library used for daily verse delivery timing.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}