import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Globe } from 'lucide-react';

const LAST_UPDATED = 'August 9th, 2026';

function AIDisclaimer() {
  return (
    <div className="bg-amber-500/10 border border-amber-500/35 rounded-2xl p-4 mb-6 flex items-start gap-3">
      <span className="text-lg shrink-0 leading-none mt-0.5">⚠️</span>
      <p className="font-sans text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
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

export default function ExtensionPrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 mb-4">
            <Globe className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
            KJB Reader Extension — Privacy Policy
          </h1>
          <p className="font-sans text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        {/* Back button */}
        <div className="text-center mb-6">
          <Link
            to="/extension"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border font-sans text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Extension
          </Link>
        </div>

        <AIDisclaimer />

        <Section title="Overview">
          <p>
            The KJB Reader browser extension ("KJB Reader - SidePanel") is a companion tool that
            detects King James Bible verse references on web pages and displays them in a browser
            side panel. Your privacy matters to us. The extension does not collect any personal
            information, does not require an account, and does not transmit your data to any
            server.
          </p>
        </Section>

        <Section title="Permissions and How They Are Used">
          <ul className="space-y-2.5 list-disc pl-5">
            <li>
              <strong>activeTab</strong>: Accesses the text content of the currently active tab only
              when you click the extension icon or use the right-click context menu. This allows the
              extension to scan the page for Bible verse references. No page content is stored or
              transmitted.
            </li>
            <li>
              <strong>contextMenus</strong>: Adds a "Look up verse in KJB Reader" option to the
              right-click menu so you can select text and look up Bible references instantly.
            </li>
            <li>
              <strong>sidePanel</strong>: Displays the Bible reader interface in the browser's side
              panel so you can read and search verses alongside the web page you are viewing.
            </li>
            <li>
              <strong>storage</strong>: Stores your preferences locally on your device (such as
              theme, font size, and sidebar settings). No personal data is stored.
            </li>
            <li>
              <strong>tabs</strong>: Used to open the sidebar panel and to navigate to
              kingjamesbiblereader.com for extension updates. The extension does not monitor or
              collect browsing history.
            </li>
          </ul>
        </Section>

        <Section title="Data We Collect">
          <p>
            We do not collect any personal information. The extension does not collect, store, or
            transmit your name, email, browsing history, page content, or any tracking
            identifiers. No analytics or tracking scripts are included in the extension.
          </p>
        </Section>

        <Section title="Data Stored On Your Device">
          <p>
            The following preferences are stored locally on your device using Chrome's storage API:
          </p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Theme and display settings</li>
            <li>Sidebar panel state</li>
          </ul>
          <p>
            No data is synced to the cloud. You can clear this data at any time by removing the
            extension or clearing your browser data.
          </p>
        </Section>

        <Section title="Internet Access">
          <p>
            The extension fetches Bible verse text and search results as JSON from the KJB Reader
            API hosted on base44.app. These requests deliver Bible content to your sidebar and are
            not used to track or profile you. No user data is sent to the server.
          </p>
        </Section>

        <Section title="Content Script">
          <p>
            The extension injects a content script into web pages to detect Bible verse references.
            This script reads the page's text to find references like "John 3:16" and converts them
            to clickable links. The page content is processed entirely on your device and is never
            sent to any server. The extension excludes kingjamesbiblereader.com from content script
            execution.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            The extension does not knowingly collect any personal information from anyone,
            including children. It is safe for all ages.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            If you have questions about this privacy policy, contact us at{' '}
            <a
              href="mailto:kingjamesbiblereader@outlook.sg"
              className="text-primary hover:underline font-medium"
            >
              kingjamesbiblereader@outlook.sg
            </a>
          </p>
        </Section>

        <div className="text-center mt-8">
          <Link
            to="/extension"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border font-sans text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Extension
          </Link>
        </div>
      </div>
    </div>
  );
}