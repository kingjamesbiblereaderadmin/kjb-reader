import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, Check, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getLiveWorkerVersion } from '@/lib/liveWorkerVersion';

// The DEV key that unlocks this page — also used to authorize the bumpVersion
// backend function so it works in a public/preview session (no admin login).
const DEV_KEY = 'KJB-DEV-2026';

// Read-only reference of the version strings baked into source files. Bumping
// those still needs a code change. The button below bumps a RUNTIME version
// (stored in an entity, served by the manifest) so all clients detect an update
// and refresh — without a deploy.
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
  const [next, setNext] = useState(suggestNext());
  const [liveVersion, setLiveVersion] = useState(null);
  const [swVersion, setSwVersion] = useState(null); // actual running service worker
  const [bumping, setBumping] = useState(false);
  const [msg, setMsg] = useState(null); // { ok: bool, text: string }

  // Load the current runtime version from the live manifest. Use the SDK invoke
  // (a raw fetch to /functions/manifest returns the app HTML on some hosts).
  const loadLive = async () => {
    try {
      const res = await base44.functions.invoke('manifest', {});
      setLiveVersion(res?.data?.version || null);
    } catch {
      setLiveVersion(null);
    }
  };

  useEffect(() => {
    loadLive();
    let cancelled = false;
    getLiveWorkerVersion().then(v => { if (!cancelled) setSwVersion(v); });
    return () => { cancelled = true; };
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(next); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  // Bump the runtime version AND refresh the manifest link so the install and
  // update-check pick it up immediately.
  const bumpAndRefresh = async () => {
    setBumping(true);
    setMsg(null);
    const version = suggestNext();
    try {
      const res = await base44.functions.invoke('bumpVersion', { key: DEV_KEY, version });
      if (res?.data?.success) {
        setLiveVersion(res.data.version);
        setNext(suggestNext());
        // Refresh the manifest <link> so the browser re-fetches it with the new
        // version — this is what makes the install/update reflect the bump.
        try {
          const link = document.getElementById('kjb-manifest-link');
          if (link) link.href = `/manifest.json?v=${version}`;
        } catch {}
        setMsg({ ok: true, text: `Bumped to ${res.data.version}. Manifest refreshed — clients will detect the update and refresh.` });
      } else {
        setMsg({ ok: false, text: res?.data?.error || 'Bump failed.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: err?.response?.data?.error || err.message || 'Bump failed.' });
    }
    setBumping(false);
  };

  return (
    <div className="space-y-4">
      {/* One-click runtime bump */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <p className="font-sans text-sm font-semibold text-foreground">Push a new version</p>
        <p className="font-sans text-xs text-muted-foreground">
          Bumps the runtime version and refreshes the manifest instantly — every client will detect an update and refresh. No code deploy needed.
        </p>
        <div className="text-xs mb-1">
          <span className="text-muted-foreground">Live service worker: </span>
          <code className="px-2 py-1 rounded bg-secondary text-foreground">{swVersion || 'not running'}</code>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-muted-foreground">Runtime version: </span>
            <code className="px-2 py-1 rounded bg-secondary text-foreground">{liveVersion || 'none set'}</code>
          </div>
          <button onClick={bumpAndRefresh} disabled={bumping}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {bumping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {bumping ? 'Bumping…' : 'Bump & Refresh'}
          </button>
        </div>
        {msg && (
          <p className={`text-xs flex items-center gap-1.5 ${msg.ok ? 'text-green-600' : 'text-destructive'}`}>
            {msg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {msg.text}
          </p>
        )}
      </div>

      {/* Suggested string for a code-level bump */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="font-sans text-sm font-semibold text-foreground mb-1">Code version string</p>
        <p className="font-sans text-xs text-muted-foreground mb-3">
          For a full deploy, these four spots in source must share the same string. Copy the suggested string below and tell me to apply it.
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