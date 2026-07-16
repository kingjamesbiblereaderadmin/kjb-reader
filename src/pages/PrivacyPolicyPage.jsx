import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'July 16th, 2026';

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

        <AIDisclaimer />

        <Section title="Overview">
        <p>
          KJB Reader is a free, public-domain King James Bible reading app. Your privacy
          matters to us. The App works entirely on your own device by default — no account is
          required. If you choose to sign in for cross-device syncing, a limited set of your data
          is also stored securely in the cloud so it appears on your other devices. We do not sell
          or share your personal information with third parties.
        </p>
      </Section>

      <Section title="Information We Collect">
        <p>If you choose to create an account and sign in, we collect:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>Your email address (used for authentication and account management).</li>
          <li>Your saved verses, reading progress, and app settings (synced to the cloud so they appear on your other devices).</li>
        </ul>
        <p>
          If you use the App without signing in, no personal information is collected. Your data
          stays only on your device. We do not collect your name, location, contacts, device files,
          or any tracking identifiers.
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
        </ul>
        <p>
          If you are signed in, this same data is also synced to your cloud account so it is
          available on other devices. You can clear local data at any time using the "Reset All
          Settings" or "Clear Cache" options in Settings, or by clearing your browser data.
          Clearing local data does not delete data already synced to the cloud.
        </p>
      </Section>

      <Section title="Cloud Sync & Data Storage">
        <p>
          When you sign in, your saved verses, reading progress, and app settings are synced to our
          secure cloud backend (hosted by Base44). This data is associated with your account and is
          only accessible by you. It is used solely to provide the cross-device sync feature — it is
          not analysed, sold, or shared with third parties.
        </p>
        <p>
          Your data is transmitted over encrypted (HTTPS) connections. You can request deletion of
          your synced data at any time by contacting us. Account authentication is handled by our
          platform provider; we do not store your password in plain text.
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

      <div className="flex items-center justify-center gap-4 mt-8">
        <Link
          to="/landing"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Landing
        </Link>
        <Link
          to="/terms"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
        >
          Terms of Service
        </Link>
      </div>
    </div>
    </div>
  );
}