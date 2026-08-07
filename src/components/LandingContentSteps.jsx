import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, GraduationCap, Globe, ArrowRight, Shield, FileText,
  MonitorSmartphone, Mail, Youtube, Link2, Instagram, PlayCircle,
} from 'lucide-react';

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.72a4.85 4.85 0 01-1.01-.03z" />
    </svg>
  );
}

function DiscordIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const CONTACTS = [
  { href: 'mailto:kingjamesbiblereader@outlook.sg', icon: Mail, label: 'Email' },
  { href: 'https://godisgracious1031ministriescom.odoo.com/', icon: Globe, label: 'Website' },
  { href: 'https://youtube.com/@shawnr325av', icon: Youtube, label: 'YouTube' },
  { href: 'https://www.tiktok.com/@svdbyfaithinr325av', icon: TikTokIcon, label: 'TikTok' },
  { href: 'https://www.instagram.com/svdbyfaithinhisbloodr325av/', icon: Instagram, label: 'Instagram' },
  { href: 'https://rumble.com/user/Godisgracious1031', icon: PlayCircle, label: 'Rumble' },
  { href: 'https://discord.com/users/shawn_faithinhisbloodr325av', icon: DiscordIcon, label: 'Discord' },
  { href: 'https://linktr.ee/shawnr325av', icon: Link2, label: 'Linktree' },
];

export function GospelStep({ onDone }) {
  return (
    <div className="text-center">
      <div className="mx-auto w-11 h-11 flex items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br from-primary to-accent ring-1 ring-white/15 mb-3">
        <Heart className="w-5 h-5" />
      </div>
      <h3 className="font-serif text-lg font-bold text-foreground mb-2">Are you saved?</h3>
      <div className="font-sans text-xs text-muted-foreground leading-relaxed space-y-2 max-w-sm mx-auto mb-4 text-left">
        <p>Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins according to the scriptures.</p>
        <p>Trust Christ's blood, death, burial and resurrection on the third day according to the scriptures for your sins, and be eternally saved.</p>
      </div>
      <Link
        to="/salvation"
        onClick={onDone}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border-2 border-primary/20 text-primary font-sans text-sm font-medium hover:bg-primary/20 transition-all"
      >
        Read the Gospel <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export function ResourcesStep({ onDone }) {
  return (
    <div className="text-center">
      <h3 className="font-serif text-lg font-bold text-foreground mb-1">Go Deeper</h3>
      <p className="font-sans text-xs text-muted-foreground mb-4">Free resources to grow in God's Word</p>
      <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto text-left">
        <a
          href="https://kjbi.org"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onDone}
          className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-accent/50 transition-all"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-xl text-white bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-xs text-foreground">KJBI.org</p>
            <p className="font-sans text-[11px] text-muted-foreground">Free online Bible college</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent ml-auto shrink-0" />
        </a>
        <Link
          to="/extension"
          onClick={onDone}
          className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-accent/50 transition-all"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-xl text-white bg-gradient-to-br from-blue-500 to-cyan-600 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-xs text-foreground">KJB Reader SidePanel</p>
            <p className="font-sans text-[11px] text-muted-foreground">Chrome extension</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent ml-auto shrink-0" />
        </Link>
      </div>
      <div className="mt-4 max-w-sm mx-auto text-left">
        <p className="font-sans text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
          <DiscordIcon className="w-3.5 h-3.5" /> Discord Bot
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href="https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=applications.commands&integration_type=1"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDone}
            className="p-2.5 rounded-xl border border-border bg-card hover:border-accent/50 transition-all text-center"
          >
            <p className="font-sans font-semibold text-[11px] text-foreground">Personal</p>
            <p className="font-sans text-[10px] text-muted-foreground">Slash commands</p>
          </a>
          <a
            href="https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=bot+applications.commands&permissions=378494381072"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDone}
            className="p-2.5 rounded-xl border border-border bg-card hover:border-accent/50 transition-all text-center"
          >
            <p className="font-sans font-semibold text-[11px] text-foreground">Server</p>
            <p className="font-sans text-[10px] text-muted-foreground">Daily verse bot</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export function LegalContactStep({ onDone }) {
  return (
    <div className="text-center">
      <h3 className="font-serif text-lg font-bold text-foreground mb-1">Links & Contact</h3>
      <p className="font-sans text-xs text-muted-foreground mb-4">Legal info and ways to reach us</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto mb-4">
        <Link to="/privacy" onClick={onDone} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-sans text-foreground hover:border-accent/50 transition-all">
          <Shield className="w-3.5 h-3.5" /> Privacy
        </Link>
        <Link to="/terms" onClick={onDone} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-sans text-foreground hover:border-accent/50 transition-all">
          <FileText className="w-3.5 h-3.5" /> Terms
        </Link>
        <Link to="/legacy" onClick={onDone} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-sans text-foreground hover:border-accent/50 transition-all">
          <MonitorSmartphone className="w-3.5 h-3.5" /> Legacy
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {CONTACTS.map((c) => {
          const Icon = c.icon;
          return (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onDone}
              title={c.label}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-card hover:border-accent/50 transition-all"
            >
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="font-sans text-[9px] text-muted-foreground">{c.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}