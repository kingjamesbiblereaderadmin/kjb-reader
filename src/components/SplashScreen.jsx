import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb_has_visited';
const STEP_MS = 1500;

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

async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

async function installUpdates() {
  // No-op hook — actual installation happens via SW registration flow
}

async function applyUpdates() {
  try {
    const reg = await getSwReg();
    const target = reg?.waiting || reg?.installing;
    if (!target) return;
    window._kjbSplashApplyingUpdate = true;
    target.postMessage({ type: 'SKIP_WAITING' });
    await new Promise((resolve) => {
      const onController = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onController);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onController);
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

async function detectAutoScenario() {
  const first = isFirstVisit();

  // Check for waiting/installing SW (update available)
  const reg = await getSwReg();
  const hasSwUpdate = !!(reg?.waiting || reg?.installing);

  // Check for data version mismatch
  let hasDataUpdate = false;
  try {
    const localVer = localStorage.getItem('kjb_data_version');
    const remoteVer = window.kjbRemoteDataVersion;
    if (remoteVer && localVer !== remoteVer) hasDataUpdate = true;
  } catch {}

  if (first) {
    markVisited();
    if (hasSwUpdate && hasDataUpdate) return 'subsequent_with_updates';
    if (hasSwUpdate) return 'home_update';
    return 'first_load';
  }

  if (hasSwUpdate && hasDataUpdate) return 'subsequent_with_updates';
  if (hasSwUpdate) return 'home_update';
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

    const runSteps = async (steps) => {
      const log = [];

      for (const step of steps) {
        if (cancelled) return;
        setStatusText(step);
        console.log(`[KJB Splash] ${step}`);
        log.push(step);

        // Side-effect hooks
        if (step.includes('Downloading offline')) await downloadOfflineData();
        if (step.includes('Installing updates')) await installUpdates();
        if (step.includes('Applying updates')) await applyUpdates();

        await delay(STEP_MS);
        if (cancelled) return;
      }

      // Log summary
      console.groupCollapsed('[KJB Splash] Steps completed');
      log.forEach((s, i) => console.log(`${i + 1}. ${s}`));
      console.groupEnd();

      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    };

    const run = async () => {
      let scenario = mode;
      if (mode === 'auto') {
        scenario = await detectAutoScenario();
      }
      const steps = SCENARIOS[scenario] || SCENARIOS.subsequent;
      await runSteps(steps);
    };

    run();
    return () => { cancelled = true; };
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
        <div className="flex flex-col items-center gap-3 mt-12">
          <Loader2
            style={{ width: 32, height: 32, color: '#4f6aff', animationDuration: '1.2s' }}
            className="animate-spin"
          />
          <span
            className="font-sans font-light text-sm tracking-[0.25em] uppercase"
            style={{ color: '#c8cdd8' }}
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}