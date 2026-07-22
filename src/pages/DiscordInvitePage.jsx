import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Discord Discovery page for the KJB Reader Bot (application_id
// 1529303667348606996). Kept in one place so kingjamesbiblereader.com/discord
// is the single canonical short link people share/click, instead of the raw
// discord.com URL living in multiple places across the site.
export const DISCORD_INVITE_URL =
  'https://discord.com/discovery/applications/1529303667348606996';

export default function DiscordInvitePage() {
  useEffect(() => {
    // Immediate redirect for real browsers/clicks.
    window.location.replace(DISCORD_INVITE_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary/70 mx-auto mb-3" />
        <p className="font-sans text-sm text-muted-foreground mb-1">Redirecting to Discord&hellip;</p>
        {/* Fallback for the rare case JS redirect doesn't fire (e.g. link preview bots) */}
        <a href={DISCORD_INVITE_URL} className="font-sans text-xs text-accent underline">
          Click here if you are not redirected
        </a>
      </div>
    </div>
  );
}
