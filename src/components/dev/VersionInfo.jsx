import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { getLiveWorkerVersion, getDeployedWorkerVersion } from '@/lib/liveWorkerVersion';

// Read-only reference of the version strings baked into source files. Bumping
// those needs a code change + deploy.
const VERSION_FILES = [
  { label: 'Service Worker (CACHE_NAME)', file: 'public/sw.js' },
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
  const [next, setNext] = useState(suggestNext());
  const [swVersion, setSwVersion] = useState(null); // actual running service worker

  // Load the ACTUAL running service worker version — from the DEPLOYED /sw.js
  // file (true source), falling back to the running worker only if that fails.
  const loadLive = async () => {
    const sw = await getDeployedWorkerVersion() || await getLiveWorkerVersion();
    setSwVersion(sw);
  };

  useEffect(() => {
    loadLive();
    window.addEventListener('focus', loadLive);
    const poll = setInterval(loadLive, 8000);
    return () => {
      window.removeEventListener('focus', loadLive);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(next); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Live worker version */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-2">
        <p className="font-sans text-sm font-semibold text-foreground">Live version</p>
        <div className="text-xs">
          <span className="text-muted-foreground">Live service worker (set by code deploy): </span>
          <code className="px-2 py-1 rounded bg-secondary text-foreground">{swVersion || 'not running'}</code>
        </div>
      </div>

      {/* Suggested string for a code-level bump */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="font-sans text-sm font-semibold text-foreground mb-1">Code version string</p>
        <p className="font-sans text-xs text-muted-foreground mb-3">
          For a full deploy, these spots in source must share the same string. Copy the suggested string below and tell me to apply it.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">{next}</code>
          <button onClick={copy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-accent/20">
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