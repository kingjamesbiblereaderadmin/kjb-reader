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

// Trigger a fresh SW update check and WAIT until we know whether a new worker
// is installing/waiting. Without this wait, the splash reads reg.waiting too
// early (before the browser has fetched the new sw.js) and always sees "no
// update". Resolves true if a new worker becomes available within `timeoutMs`.
async function waitForSwUpdate(timeoutMs = 4000) {
  const reg = await getSwReg();
  if (!reg) return false;

  // Already have a waiting/installed worker ready to activate.
  if (reg.waiting) return true;

  // Kick off a fresh check against the server for a new sw.js.
  try { await reg.update(); } catch {}
  if (reg.waiting) return true;

  // A new worker is downloading — wait for it to finish installing.
  const installing = reg.installing;
  if (!installing) return false;

  return await new Promise((resolve) => {
    let settled = false;
    const finish = (val) => { if (!settled) { settled = true; resolve(val); } };
    const onState = () => {
      if (installing.state === 'installed' || installing.state === 'activated') finish(true);
      else if (installing.state === 'redundant') finish(false);
    };
    installing.addEventListener('statechange', onState);
    setTimeout(() => finish(!!reg.waiting), timeoutMs);
  });
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

// "Checking for updates…" / "No updates found." are intentionally NEVER shown.
// Update-related steps only appear when there's an ACTUAL update to apply.
const SCENARIOS = {
  // first_load: the update steps are injected at runtime (right before Welcome)
  // ONLY if a waiting service-worker app update exists — see __FIRST_LOAD_UPDATE_STEP__.
  first_load: [
    'Loading…',
    'Downloading offline data…',
    '__FIRST_LOAD_UPDATE_STEP__',
    `Welcome to ${APP_NAME}.`,
  ],
  // No updates → no "Checking", just straight to welcome.
  subsequent: [
    'Loading…',
    `Welcome back to ${APP_NAME}.`,
  ],
  subsequent_with_updates: [
    'Found app & data updates.',
    'Installing updates…',
    'Applying updates…',
    `Welcome back to ${APP_NAME}.`,
  ],
  home_update: [
    'Found app updates.',
    'Installing updates…',
    'Applying updates…',
    `Welcome back to ${APP_NAME}.`,
  ],
};

// Auto-detect which scenario applies on a real production load.
async function detectAutoScenario() {
  // First visit = the Bible isn't cached on this device yet. This is the most
  // reliable signal (the localStorage flag alone gave false negatives because
  // it was often already set from a prior session). We still flip the flag for
  // good measure.
  let bibleCached = false;
  try {
    const { isBibleCached } = await import('@/lib/bibleCache');
    bibleCached = await isBibleCached().catch(() => false);
  } catch {}
  const first = isFirstVisit() || !bibleCached;
  if (first) markVisited();

  if (first) {
    // Brand new user (or no offline data yet) → download + welcome flow.
    return 'first_load';
  }

  // Returning user: WAIT for the service worker update check to resolve so we
  // don't read reg.waiting before the browser has fetched the new sw.js.
  const hasAppUpdate = await waitForSwUpdate();

  // Content/data version update available?
  let hasDataUpdate = false;
  try {
    const { checkForUpdates } = await import('@/lib/bibleCache');
    hasDataUpdate = await checkForUpdates().catch(() => false);
  } catch {}

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

    const runSteps = async (scenario, steps, preShown = []) => {
      const log = [...preShown];
      // Expand the first_load placeholder: if a waiting app update exists, inject
      // the found→installing→applying steps; otherwise drop the placeholder
      // entirely (no "Checking"/"No updates" filler).
      const expanded = [];
      for (const s of steps) {
        if (s === '__FIRST_LOAD_UPDATE_STEP__') {
          const hasAppUpdate = mode === 'auto' ? await waitForSwUpdate() : false;
          if (hasAppUpdate) expanded.push('Found app updates.', 'Installing updates…', 'Applying updates…');
        } else {
          expanded.push(s);
        }
      }

      for (const step of expanded) {
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
      // Show "Loading…" immediately while we detect the scenario (detection can
      // take a few seconds waiting for the SW update check).
      setStatusText('Loading…');
      console.log('[KJB Splash] Loading…');
      const scenario = mode === 'auto' ? await detectAutoScenario() : mode;
      if (cancelled) return;
      console.log('[KJB Splash] Scenario:', scenario);
      const fullSteps = SCENARIOS[scenario] || SCENARIOS.subsequent;
      // If the scenario starts with "Loading…", we've already shown+paused on it
      // during detection, so skip it (and record it in the log). home_update
      // starts directly at "Found app updates." — don't skip anything there.
      const startsWithLoading = fullSteps[0] === 'Loading…';
      const steps = startsWithLoading ? fullSteps.slice(1) : fullSteps;
      const preShown = startsWithLoading ? ['Loading…'] : [];
      await runSteps(scenario, steps, preShown);
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