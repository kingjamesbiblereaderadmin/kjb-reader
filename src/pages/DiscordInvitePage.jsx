import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Discord Bot invite links for the KJB Reader Bot (application_id
// 1529303667348606996). Kept here so kingjamesbiblereader.com/discord is the
// single canonical short link people share/click.
export const DISCORD_ADD_TO_SERVER_URL =
  'https://discord.com/api/oauth2/authorize?client_id=1529303667348606996&permissions=397821864976&scope=bot+applications.commands&redirect_uri=https%3A%2F%2Fsolene-c1cbdd64.base44.app%2Ffunctions%2FdiscordGuildJoin&response_type=code';

export const DISCORD_ADD_TO_APPS_URL =
  'https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=applications.commands&integration_type=1';

export const DISCORD_SUPPORT_SERVER_URL = 'https://kingjamesbiblereader.com/discord';

function DiscordIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const cardClass = "flex items-center gap-3 p-5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group";

export default function DiscordInvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to KJB Reader
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/30 mb-4 bg-gradient-to-br from-indigo-500 to-violet-600">
            <DiscordIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">KJB Reader Bot</h1>
          <p className="font-sans text-sm text-muted-foreground">For random, search, daily, and gospel sharing.</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        {/* Invite cards */}
        <div className="space-y-4">
          <a href={DISCORD_ADD_TO_SERVER_URL} target="_blank" rel="noopener noreferrer" className={cardClass}>
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-indigo-500 to-violet-600">
              <DiscordIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Add to Server</p>
              <p className="font-sans text-xs text-muted-foreground">Add the bot to a Discord server you manage — slash commands for daily verses and Bible search.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </a>

          <a href={DISCORD_ADD_TO_APPS_URL} target="_blank" rel="noopener noreferrer" className={cardClass}>
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-violet-500 to-purple-700">
              <DiscordIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Add to My Apps</p>
              <p className="font-sans text-xs text-muted-foreground">Install the bot as a personal Discord app — use slash commands in any server you're in.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </a>

          <a href={DISCORD_SUPPORT_SERVER_URL} target="_blank" rel="noopener noreferrer" className={cardClass}>
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
              <DiscordIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Support Server</p>
              <p className="font-sans text-xs text-muted-foreground">Join our Discord community for help, updates, and to share feedback.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
}