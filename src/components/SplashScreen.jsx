import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb-has-visited-app';

function checkIsFirstVisit() {
  try { return !localStorage.getItem(FIRST_VISIT_KEY); } catch { return false; }
}
function markVisited() {
  try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
}

async function detectSwUpdate() {
  if (!('serviceWorker' in navigator)) return { hasUpdate: false };
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return { hasUpdate: false };
    // Already has a queued update
    if (reg.waiting && navigator.serviceWorker.controller) {
      return { hasUpdate: true, reg };
    }
    // Trigger network check, wait up to 2s for updatefound
    await reg.update().catch(() => {});
    await new Promise((resolve) => {
      if (reg.installing || reg.waiting) { resolve(); return; }
      const onFound = () => { reg.removeEventListener('updatefound', onFound); resolve(); };
      reg.addEventListener('updatefound', onFound);
      setTimeout(() => { reg.removeEventListener('updatefound', onFound); resolve(); }, 2000);
    });
    const hasUpdate = !!(reg.waiting || reg.installing) && !!navigator.serviceWorker.controller;
    return { hasUpdate, reg };
  } catch {
    return { hasUpdate: false };
  }
}

async function applySwUpdate(reg) {
  try {
    const target = reg?.waiting || reg?.installing;
    if (target) target.postMessage({ type: 'SKIP_WAITING' });
  } catch {}
}

async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

const STEP_DELAY = 1000; // ms per step

export default function SplashScreen({ isFadingOut, onDone, mode = 'auto' }) {
  const [statusText, setStatusText] = useState('Loading…');
  const doneRef = useRef(false);
  const logRef = useRef([]);

  const log = (msg) => { logRef.current.push(msg); };
  const step = (text, delay = STEP_DELAY) => new Promise((resolve) => {
    setStatusText(text);
    log(text);
    setTimeout(resolve, delay);
  });

  useEffect(() => {
    let cancelled = false;
    const safeStep = (text, delay) => {
      if (cancelled) return Promise.resolve();
      return step(text, delay);
    };

    const run = async () => {
      const isFirstVisit = checkIsFirstVisit();
      let resolvedMode = mode;
      let swResult = null;

      if (mode === 'auto') {
        // Show "Loading…" while we detect the SW update in parallel,
        // but always display it for at least 1200ms so it's visible.
        setStatusText('Loading…');
        log('Loading…');
        const [swRes] = await Promise.all([
          detectSwUpdate(),
          new Promise(r => setTimeout(r, 1200)),
        ]);
        swResult = swRes;
        if (isFirstVisit) resolvedMode = 'first_load';
        else if (swResult.hasUpdate) resolvedMode = 'subsequent_with_updates';
        else resolvedMode = 'subsequent';
      }

      if (isFirstVisit) markVisited();

      // ── Scenario 1: Brand new user ──
      if (resolvedMode === 'first_load') {
        if (mode !== 'auto') await safeStep('Loading…', 800);
        await safeStep('Downloading offline data…', 400);
        await downloadOfflineData();
        await safeStep('Checking for updates…', 1000);
        if (!swResult) swResult = await detectSwUpdate();
        if (swResult?.hasUpdate) {
          await safeStep('Found app updates.', 900);
          await safeStep('Installing updates…', 1000);
          await safeStep('Applying updates…', 800);
          if (swResult?.reg) await applySwUpdate(swResult.reg);
        } else {
          await safeStep('No updates found.', 800);
        }
        await safeStep(`Welcome to ${APP_NAME}.`, 1000);
      }

      // ── Scenario 2: Returning user, no updates ──
      else if (resolvedMode === 'subsequent') {
        if (mode !== 'auto') await safeStep('Loading…', 800);
        await safeStep('Checking for updates…', 1000);
        if (!swResult) swResult = await detectSwUpdate();
        if (swResult?.hasUpdate) {
          // Reclassify if update found during manual mode
          await safeStep('Found app updates.', 900);
          await safeStep('Installing updates…', 1000);
          await safeStep('Applying updates…', 800);
          if (swResult?.reg) await applySwUpdate(swResult.reg);
        } else {
          await safeStep('No updates found.', 800);
        }
        await safeStep(`Welcome back to ${APP_NAME}.`, 1000);
      }

      // ── Scenario 3: Returning user with updates ──
      else if (resolvedMode === 'subsequent_with_updates') {
        if (mode !== 'auto') await safeStep('Loading…', 800);
        await safeStep('Checking for updates…', 900);
        if (!swResult) swResult = await detectSwUpdate();
        await safeStep('Found app & data updates.', 900);
        await safeStep('Installing updates…', 1000);
        await safeStep('Applying updates…', 800);
        if (swResult?.reg) await applySwUpdate(swResult.reg);
        await safeStep(`Welcome back to ${APP_NAME}.`, 1000);
      }

      // ── Scenario 4: Home screen launch, app update only ──
      else if (resolvedMode === 'home_update') {
        if (mode !== 'auto') await safeStep('Loading…', 800);
        await safeStep('Checking for updates…', 900);
        if (!swResult) swResult = await detectSwUpdate();
        await safeStep('Found app updates.', 900);
        await safeStep('Installing updates…', 1000);
        await safeStep('Applying updates…', 800);
        if (swResult?.reg) await applySwUpdate(swResult.reg);
        await safeStep(`Welcome back to ${APP_NAME}.`, 1000);
      }

      if (!cancelled && !doneRef.current) {
        doneRef.current = true;
        console.groupCollapsed('[SplashScreen] Steps summary');
        logRef.current.forEach(m => console.log(' •', m));
        console.groupEnd();
        onDone?.();
      }
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
          alt="KJB Reader"
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