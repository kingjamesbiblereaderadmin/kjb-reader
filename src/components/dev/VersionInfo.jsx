import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// Read-only reference of the version strings that must be kept in sync on every
// deploy. Editing them requires a code change (they live in source files and
// the service worker), so this panel shows the current values + which files to
// bump and offers a one-click copy of the next suggested version string.
const VERSION_FILES = [
  { label: 'Service Worker (CACHE_NAME)', file: 'public/sw.js' },
  { label: 'Manifest query param', file: 'index.html' },
  { label: 'Manifest function version', file: 'manifest function' },
  { label: 'Settings WORKER_VERSION', file: 'Settings page' },
];

function suggestNext() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `v${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export default function VersionInfo() {
  const [copied, setCopied] = useState(false);
  const next = suggestNext();

  const copy = async () => {
    try { await navigator.clipboard.writeText(next); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="font-sans text-sm font-semibold text-foreground mb-1">Version bump</p>
        <p className="font-sans text-xs text-muted-foreground mb-3">
          On every deploy these four spots must share the same version string. Ask me to "bump the version" and I'll update all of them for you — or copy the suggested string below and tell me to apply it.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">{next}</code>
          <button onClick={copy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {VERSION_FILES.map((f) => (
          <div key={f.label} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
            <span className="font-sans text-sm text-foreground">{f.label}</span>
            <span className="font-sans text-xs text-muted-foreground">{f.file}</span>
          </div>
        ))}
      </div>
    </div>
  );
}