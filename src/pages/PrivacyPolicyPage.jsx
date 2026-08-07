import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'August 7th, 2026';

function AIDisclaimer() {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
      <span className="text-lg shrink-0 leading-none mt-0.5">⚠️</span>
      <p className="font-sans text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
        <strong className="font-semibold">AI-Generated Notice:</strong> This Privacy Policy was
        generated with the assistance of artificial intelligence (AI) and may contain errors or
        omissions. It is not a substitute for professional legal advice. If you have specific
        privacy or legal concerns, please consult a qualified professional.
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03]">
      <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="font-sans text-sm text-foreground/85 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
    <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg shadow-slate-500/30 mb-4">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="font-sans text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        <div className="text-center mb-6">
        <button
        onClick={goBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
        >
        <ArrowLeft className="w-4 h-4" />
        Back
        </button>
        </div>

        <AIDisclaimer />

        <Section title="Overview">
        <p>
          KJB Reader is a free, public-domain King James Bible reading app. Your privacy
          matters to us. The App works entirely on your own device — no account is
          required, and no personal information is collected. All your data stays only on
          your device. We do not sell or share your personal information with third parties.
        </p>
      </Section>

      <Section title="Information We Collect">
        <p>
          We do not collect any personal information. No account is needed to use the App,
          and we do not ask for your name, email address, location, contacts, device files,
          or any tracking identifiers. The App is fully functional without signing in.
        </p>
      </Section>

      <Section title="Data Stored On Your Device">
        <p>
          To make the app work offline and remember your preferences, the following are stored
          locally on your own device (using your browser's storage):
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>Your settings (theme, fonts, text size, daily verse style, custom background image).</li>
          <li>Saved verses and reading position.</li>
          <li>An offline copy of the Bible text, if you choose to download it.</li>
          <li>Notification preferences for the daily verse reminder.</li>
          <li>Extension preferences (API configuration) — stored locally via Chrome's storage API if you use the browser extension.</li>
        </ul>
        <p>
          All of this data stays only on your device. You can clear it at any time using the
          "Reset All Settings" or "Clear Cache" options in Settings, or by clearing your
          browser data.
        </p>
      </Section>

      <Section title="No Cloud Sync">
        <p>
          The core Bible-reading App does not sync any data to the cloud. There are no
          accounts, no sign-in, and no cloud storage. Everything you do in the App — your
          saved verses, reading progress, settings, and preferences — exists only on the
          device you are using. (The optional Discord bot integration, described below, is
          a separate feature that stores minimal server configuration on our servers.)
        </p>
      </Section>

      <Section title="KJB Reader Discord Bot">
        <p>
          KJB Reader offers an optional Discord bot that server administrators can add to their
          own Discord servers for slash-command Bible lookups and scheduled daily verse delivery.
          This is a separate, opt-in feature from the core reading app described above.
        </p>
        <p>
          When a server administrator installs and configures the bot, we store the following
          minimal server configuration on our servers: the Discord server (guild) ID and name,
          the configured channel name, a Discord webhook URL (used only to post messages to that
          channel), an optional role ID (used only for the daily verse ping), the chosen delivery
          time and timezone, and whether delivery is active. We do not store who configured the
          bot beyond a generic internal label — no personal identifiers of the person running setup
          are stored.
        </p>
        <p>
          The bot does not use Discord's privileged intents and does not collect profile
          information about server members. On servers where the bot is added, it reads message
          text solely to detect Bible references typed in natural language (e.g. "John 3:16") in
          order to reply with the verse — it does not store, log, or retain message content beyond
          the moment needed to generate that reply, and does not use messages for any other
          purpose.
        </p>
        <p>
          This server configuration data is used solely to deliver the scheduled daily verse and
          to respond to bot commands and mentions. It is never sold or shared with third parties.
          Server administrators can disable delivery at any time using the /setup disable command,
          or remove the bot from their server entirely to stop all data use; removing the bot
          deletes the stored configuration for that server.
        </p>
        <p>
          To request removal of a specific server's stored configuration, contact us at{' '}
          <a href="mailto:kingjamesbiblereader@outlook.sg" className="text-primary hover:underline">
            kingjamesbiblereader@outlook.sg
          </a>{' '}
          with the server name.
        </p>
      </Section>

      <Section title="Notifications">
        <p>
          If you enable daily verse reminders, your browser or device handles these notifications
          locally. We do not operate a push server and do not receive any information about you
          when a notification is shown.
        </p>
      </Section>

      <Section title="Internet Connection & Updates">
        <p>
          The app connects to the internet to download the Bible text and to automatically apply
          updates, typo corrections, and improvements. These requests deliver content to your
          device and are not used to track or profile you. Standard, non-identifying technical
          information (such as your IP address) may be processed by our hosting provider purely
          to deliver the app, as is normal for any website.
        </p>
      </Section>

      <Section title="Cookies & Analytics">
        <p>
          The App does not use cookies to track you. We do not use advertising or third-party
          tracking cookies. Anonymous, aggregated usage statistics (such as the number of times
          a page is viewed) may be collected solely to help us improve the site. These statistics
          are not linked to you or your device and cannot be used to identify anyone personally.
        </p>
      </Section>

      <Section title="Chrome Browser Extension">
        <p>
          The KJB Reader Chrome Extension (KJB Reader - SidePanel) is a companion browser
          extension available on the Chrome Web Store that provides Bible search, reading, and
          verse lookup from a sidebar panel in your browser. The extension uses these permissions:
          activeTab (detects Bible verse references on web pages), contextMenus (right-click verse
          lookup), sidePanel (displays the reader in Chrome side panel), storage (stores
          preferences locally), and tabs (opens website links in new tabs). No page content is
          collected or transmitted. The extension does not collect personal information and does
          not require an account. It fetches Bible verse data as JSON from the KJB Reader API on
          base44.app. No user data is sent to the server.
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>
          KJB Reader does not knowingly collect any personal information from anyone, including children.
          The app is safe for all ages.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Any changes will appear on this page
          with a revised "Last updated" date.
        </p>
      </Section>

      <Section title="AI Disclaimer">
        <p>
          This app was built with the assistance of artificial intelligence (AI). While great
          care has been taken to ensure accuracy, AI-generated code and content may contain
          errors. The King James Bible text itself is sourced from the Pure Cambridge Edition
          and is not AI-generated. If you notice any issue, please contact us so we can correct it.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>
          If you have any questions about this Privacy Policy, please contact us at{' '}
          <a href="mailto:kingjamesbiblereader@outlook.sg" className="text-primary hover:underline">
            kingjamesbiblereader@outlook.sg
          </a>.
        </p>
      </Section>

      <div className="text-center mt-8">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
    </div>
  );
}