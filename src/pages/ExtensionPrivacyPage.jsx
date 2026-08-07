import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Globe } from 'lucide-react';

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
    <div className="relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 border-border/60 rounded-3xl p-6 sm:p-7 mb-5 shadow-lg shadow-black/[0.03] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
      <h2 className="relative font-serif text-xl sm:text-2xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="font-sans text-sm text-foreground/85 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function ExtensionPrivacyPage() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/5 to-background overflow-hidden">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>
      <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/30 to-cyan-600/30 blur-xl" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
              <Globe className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">KJB Reader Extension Privacy Policy</h1>
          <p className="font-sans text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        </div>

        <div className="text-center mb-6">
          <Link
            to="/extension"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:bg-accent/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Extension
          </Link>
        </div>

        <AIDisclaimer />

        <Section title="Overview">
          <p>
            This privacy policy applies to the KJB Reader Chrome Extension (KJB Reader -
            SidePanel), available on the Chrome Web Store. The KJB Reader Chrome Extension is a
            free Bible study tool that provides search, reading, and verse lookup from a sidebar
            panel in your browser. Your privacy matters to us. The extension does not collect
            personal information and does not require an account.
          </p>
        </Section>

        <Section title="Permissions Used">
          <ul className="space-y-2 list-disc pl-5">
            <li><strong>activeTab</strong>: Detects Bible verse references (e.g., "John 3:16") in the text of the current web page so you can click them to look up the verse.</li>
            <li><strong>contextMenus</strong>: Adds a right-click menu item to look up selected text as a Bible verse reference.</li>
            <li><strong>sidePanel</strong>: Displays the Bible reader interface in Chrome's built-in side panel.</li>
            <li><strong>storage</strong>: Stores your extension preferences locally on your device.</li>
            <li><strong>tabs</strong>: Opens the KJB Reader website and legal pages in new browser tabs when you click links.</li>
          </ul>
        </Section>

        <Section title="Data We Collect">
          <p>
            The extension does not collect any personal information. No account is needed, and we
            do not ask for your name, email, location, or any tracking identifiers.
          </p>
        </Section>

        <Section title="Data Stored On Your Device">
          <p>
            The extension stores only your API configuration preference locally using Chrome's
            storage API. This can be cleared at any time by uninstalling the extension or
            clearing your browser data.
          </p>
        </Section>

        <Section title="Website Content Access">
          <p>
            The extension's content script runs on web pages to detect Bible verse references in
            page text. No page content is collected, transmitted, or stored. Only verse reference
            strings are parsed locally on your device. The extension excludes
            kingjamesbiblereader.com to avoid conflicts.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>
            The extension communicates with the KJB Reader API hosted on Base44 (base44.app) to
            retrieve Bible verse data as JSON. No user-identifying information is sent in these
            requests.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            The extension does not knowingly collect any personal information from anyone,
            including children.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            If you have questions about this privacy policy, contact us at{' '}
            <a href="mailto:kingjamesbiblereader@outlook.sg" className="text-primary hover:underline">
              kingjamesbiblereader@outlook.sg
            </a>.
          </p>
        </Section>

        <div className="text-center mt-8">
          <Link
            to="/extension"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent hover:bg-accent/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Extension
          </Link>
        </div>
      </div>
    </div>
  );
}