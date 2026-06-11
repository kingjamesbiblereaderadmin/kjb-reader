import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb_has_visited';
const STEP_MS = 10000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isFirstVisit() {
  try { return !localStorage.getItem(FIRST_VISIT_KEY); } catch { return false; }
}
function markVisited() {
  try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
}

async function getSwReg() {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.getRegistration(); } catch { return null; }
}

// Download the Bible data so the app works offline (first-visit only, auto mode).
async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

// Activate a waiting/installing service worker via SKIP_WAITING.
async function applyUpdates() {
  try {
    const reg = await getSwReg();
    const target = reg?.waiting || reg?.installing;
    if (!target) return;
    // Flag so main.jsx's controllerchange handler does NOT reload the page —
    // the splash applies the update in-place to avoid a jarring reload jump.
    window._kjbSplashApplyingUpdate = true;
    target.postMessage({ type: 'SKIP_WAITING' });
    await new Promise((resolve) => {
      const onCtrl = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onCtrl);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onCtrl);
      setTimeout(resolve, 3000);
    });
    window._kjbSplashApplyingUpdate = false;
  } catch {}
}

// ── Scenario step sequences ───────────────────────────────────────────────────

const SCENARIOS = {
  first_load: [
    'Loading…',
    'Downloading offline data…',
    'Checking for updates…',
    'No updates found.',
    `Welcome to ${APP_NAME}.`,
  ],
  subsequent: [
    'Loading…',
    'Checking for updates…',
    'No updates found.',
    `Welcome back to ${APP_NAME}.`,
  ],
  subsequent_with_updates: [
    'Loading…',
    'Checking for updates…',
    'Found app & data updates.',
    'Installing updates…',
    'Applying updates…',
    `Welcome back to ${APP_NAME}.`,
  ],
  home_update: [
    'Loading…',
    'Checking for updates…',
    'Found app updates.',
    'Installing updates…',
    'Applying updates…',
    `Welcome back to ${APP_NAME}.`,
  ],
};

// Auto-detect which scenario applies on a real production load.
async function detectAutoScenario() {
  const first = isFirstVisit();
  if (first) markVisited();

  // Service worker update available?
  const reg = await getSwReg();
  const hasAppUpdate = !!(reg?.waiting || reg?.installing);

  // Content/data version update available?
  let hasDataUpdate = false;
  try {
    const { checkForUpdates } = await import('@/lib/bibleCache');
    hasDataUpdate = await checkForUpdates().catch(() => false);
  } catch {}

  if (first) {
    // Brand new user always runs the first_load flow (download + welcome).
    return 'first_load';
  }
  if (hasAppUpdate && hasDataUpdate) return 'subsequent_with_updates';
  if (hasAppUpdate) return 'home_update';
  if (hasDataUpdate) return 'subsequent_with_updates';
  return 'subsequent';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SplashScreen({ isFadingOut, onDone, mode = 'auto' }) {
  const [statusText, setStatusText] = useState('Loading…');
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    const runSteps = async (scenario, steps) => {
      const log = [];
      for (const step of steps) {
        if (cancelled) return;
        setStatusText(step);
        console.log(`[KJB Splash] ${step}`);
        log.push(step);

        // Real side-effects (only run in auto mode — test modes are display-only).
        if (mode === 'auto') {
          if (step.includes('Downloading offline')) await downloadOfflineData();
          if (step.includes('Applying updates')) await applyUpdates();
        }

        await delay(STEP_MS);
        if (cancelled) return;
      }

      console.groupCollapsed(`[KJB Splash] Done — scenario: ${scenario}`);
      log.forEach((s, i) => console.log(`${i + 1}. ${s}`));
      console.groupEnd();

      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    };

    const run = async () => {
      const scenario = mode === 'auto' ? await detectAutoScenario() : mode;
      const steps = SCENARIOS[scenario] || SCENARIOS.subsequent;
      await runSteps(scenario, steps);
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: '#0f1117' }}
    >
      <div className="flex flex-col items-center -mt-16">
        <img
          src={LOGO_URL}
          alt={APP_NAME}
          className="rounded-2xl object-contain"
          style={{ width: 176, height: 176 }}
        />
        <div className="flex flex-col items-center gap-3" style={{ marginTop: 48 }}>
          <Loader2
            className="animate-spin"
            style={{ width: 32, height: 32, color: '#4f6aff', animationDuration: '1.2s' }}
          />
          <span
            className="font-sans font-light text-sm uppercase tracking-[0.25em] text-center px-6"
            style={{ color: '#c8cdd8' }}
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}