import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { isBibleCached, downloadBibleForOffline, checkForUpdates } from '@/lib/bibleCache';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb-has-visited-app';
const STEP_DURATION = 10000; // 10 seconds per step

// ── Auto-detect which scenario applies ──────────────────────────────────────
async function detectMode() {
  const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY);

  let hasSWUpdate = false;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
      hasSWUpdate = !!(reg?.waiting && reg.active);
    }
  } catch {}

  let hasDataUpdate = false;
  try {
    hasDataUpdate = await checkForUpdates();
  } catch {}

  if (isFirstVisit) return 'first_load';
  if (hasSWUpdate && hasDataUpdate) return 'subsequent_with_updates';
  if (hasSWUpdate) return 'home_update';
  if (hasDataUpdate) return 'subsequent_with_updates';
  return 'subsequent';
}

// ── Build step list for a given mode ────────────────────────────────────────
function buildSteps(resolvedMode) {
  const welcome =
    resolvedMode === 'first_load'
      ? `Welcome to ${APP_NAME}.`
      : `Welcome back to ${APP_NAME}.`;

  switch (resolvedMode) {
    case 'first_load':
      return [
        'Loading…',
        'Downloading offline data…',
        'Checking for updates…',
        'No updates found.',
        welcome,
      ];
    case 'subsequent':
      return [
        'Loading…',
        'Checking for updates…',
        'No updates found.',
        welcome,
      ];
    case 'subsequent_with_updates':
      return [
        'Loading…',
        'Checking for updates…',
        'Found app & data updates.',
        'Installing updates…',
        'Applying updates…',
        welcome,
      ];
    case 'home_update':
      return [
        'Loading…',
        'Checking for updates…',
        'Found app updates.',
        'Installing updates…',
        'Applying updates…',
        welcome,
      ];
    default:
      return ['Loading…', welcome];
  }
}

// ── Side-effects for specific steps ──────────────────────────────────────────
async function runStepEffect(stepText, resolvedMode) {
  // First-load: trigger real Bible download when we show "Downloading…"
  if (resolvedMode === 'first_load' && stepText.startsWith('Downloading')) {
    try {
      const cached = await isBibleCached();
      if (!cached) {
        await downloadBibleForOffline();
      }
    } catch (e) {
      console.warn('[SplashScreen] Bible download failed:', e.message);
    }
  }

  // "Applying updates…" — activate the waiting service worker
  if (stepText.startsWith('Applying')) {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch {}
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SplashScreen({ isFadingOut = false, onDone, mode = 'auto' }) {
  const [statusText, setStatusText] = useState('Loading…');
  const logRef = useRef([]);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // 1. Resolve actual mode
      let resolvedMode = mode;
      if (mode === 'auto') {
        resolvedMode = await detectMode();
      }

      const steps = buildSteps(resolvedMode);
      logRef.current = [];

      for (let i = 0; i < steps.length; i++) {
        if (cancelled) return;
        const text = steps[i];
        setStatusText(text);
        logRef.current.push(text);

        // Fire side-effects in background (don't block the timer)
        runStepEffect(text, resolvedMode).catch(() => {});

        // Mark first visit after the first step
        if (i === 0 && resolvedMode === 'first_load') {
          try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
        }

        await new Promise(r => setTimeout(r, STEP_DURATION));
        if (cancelled) return;
      }

      // Log summary
      console.groupCollapsed(`[SplashScreen] Completed (mode: ${resolvedMode})`);
      logRef.current.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      console.groupEnd();

      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    }

    run();
    return () => { cancelled = true; };
  }, [mode, onDone]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: '#0f1117',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      <div className="flex flex-col items-center -mt-16">
        {/* Logo */}
        <img
          src={LOGO_URL}
          alt={APP_NAME}
          className="rounded-2xl"
          style={{ width: 176, height: 176, objectFit: 'contain' }}
        />

        {/* Spinner + status text */}
        <div
          className="flex flex-col items-center gap-3"
          style={{ marginTop: 48 }}
        >
          <Loader2
            style={{
              width: 32,
              height: 32,
              color: '#4f6aff',
              animation: 'spin 1.2s linear infinite',
            }}
          />
          <span
            className="tracking-[0.25em] font-light text-sm uppercase"
            style={{ color: '#c8cdd8' }}
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}