import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb-has-visited-app';

// Detect first visit once (before any state mutation)
function checkIsFirstVisit() {
  try { return !localStorage.getItem(FIRST_VISIT_KEY); } catch { return false; }
}

function markVisited() {
  try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
}

// Check if there's a waiting or installing SW worker.
// After calling reg.update() we also wait briefly for `updatefound` so we
// catch the case where the new SW starts installing AFTER the update() call
// returns (common when the SW file was just changed on the server).
async function detectSwUpdate() {
  if (!('serviceWorker' in navigator)) return { hasUpdate: false };
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return { hasUpdate: false };

    // Fire the update check and wait up to 3 s for an updatefound event
    const updateFoundPromise = new Promise((resolve) => {
      if (reg.waiting || reg.installing) { resolve(); return; }
      const onFound = () => { reg.removeEventListener('updatefound', onFound); resolve(); };
      reg.addEventListener('updatefound', onFound);
      setTimeout(() => { reg.removeEventListener('updatefound', onFound); resolve(); }, 6000);
    });

    reg.update().catch(() => {});
    await updateFoundPromise;

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

// Simulate / trigger data prefetch
async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

async function runSteps(steps, onStep) {
  for (const step of steps) {
    onStep(step.text);
    if (step.action) await step.action();
    await new Promise(r => setTimeout(r, step.duration ?? 1000));
  }
}

export default function SplashScreen({ isFadingOut, onDone, mode = 'auto' }) {
  const [statusText, setStatusText] = useState('Loading…');
  const doneRef = useRef(false);
  const logRef = useRef([]);

  const log = (msg) => {
    logRef.current.push(msg);
    console.log('[SplashScreen]', msg);
  };

  useEffect(() => {
    let cancelled = false;

    const setStep = (text) => {
      if (cancelled) return;
      setStatusText(text);
      log(text);
    };

    const runScenario = async () => {
      const isFirstVisit = checkIsFirstVisit();

      let resolvedMode = mode;
      let swResult = null;

      if (mode === 'auto') {
        swResult = await detectSwUpdate();
        if (isFirstVisit) resolvedMode = 'first_load';
        else if (swResult.hasUpdate) resolvedMode = 'subsequent_with_updates';
        else resolvedMode = 'subsequent';
      }

      if (isFirstVisit) markVisited();

      // Scenario 1: Brand new user
      if (resolvedMode === 'first_load') {
        setStep('Loading…');
        await new Promise(r => setTimeout(r, 1000));
        setStep('Downloading offline data…');
        await downloadOfflineData();
        await new Promise(r => setTimeout(r, 1200));
        setStep('Checking for updates…');
        if (!swResult) swResult = await detectSwUpdate();
        await new Promise(r => setTimeout(r, 900));
        setStep('No updates found.');
        await new Promise(r => setTimeout(r, 800));
        setStep(`Welcome to ${APP_NAME}.`);
        await new Promise(r => setTimeout(r, 1000));
      }

      // Scenario 2: Returning user, no updates
      else if (resolvedMode === 'subsequent') {
        setStep('Loading…');
        await new Promise(r => setTimeout(r, 900));
        setStep('Checking for updates…');
        await new Promise(r => setTimeout(r, 900));
        setStep('No updates found.');
        await new Promise(r => setTimeout(r, 700));
        setStep(`Welcome back to ${APP_NAME}.`);
        await new Promise(r => setTimeout(r, 900));
      }

      // Scenario 3: Returning user with updates (app + data)
      else if (resolvedMode === 'subsequent_with_updates') {
        setStep('Loading…');
        await new Promise(r => setTimeout(r, 900));
        setStep('Checking for updates…');
        if (!swResult) swResult = await detectSwUpdate();
        await new Promise(r => setTimeout(r, 900));
        setStep('Found app & data updates.');
        await new Promise(r => setTimeout(r, 900));
        setStep('Installing updates…');
        await new Promise(r => setTimeout(r, 1000));
        setStep('Applying updates…');
        if (swResult?.reg) await applySwUpdate(swResult.reg);
        await new Promise(r => setTimeout(r, 900));
        setStep('Verifying update…');
        const recheck = await detectSwUpdate();
        await new Promise(r => setTimeout(r, 700));
        setStep(recheck.hasUpdate ? 'More updates pending…' : 'Update applied successfully.');
        await new Promise(r => setTimeout(r, 900));
        setStep(`Welcome back to ${APP_NAME}.`);
        await new Promise(r => setTimeout(r, 900));
      }

      // Scenario 4: Home screen / app update only
      else if (resolvedMode === 'home_update') {
        setStep('Found app updates.');
        await new Promise(r => setTimeout(r, 900));
        setStep('Installing updates…');
        await new Promise(r => setTimeout(r, 1000));
        setStep('Applying updates…');
        if (swResult?.reg) await applySwUpdate(swResult.reg);
        await new Promise(r => setTimeout(r, 900));
        setStep('Verifying update…');
        const recheck = await detectSwUpdate();
        await new Promise(r => setTimeout(r, 700));
        setStep(recheck.hasUpdate ? 'More updates pending…' : 'Update applied successfully.');
        await new Promise(r => setTimeout(r, 900));
        setStep(`Welcome back to ${APP_NAME}.`);
        await new Promise(r => setTimeout(r, 900));
      }

      if (!cancelled && !doneRef.current) {
        doneRef.current = true;
        console.groupCollapsed('[SplashScreen] Steps summary');
        logRef.current.forEach(m => console.log(' •', m));
        console.groupEnd();
        onDone?.();
      }
    };

    runScenario();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: '#0f1117' }}
    >
      <div className="flex flex-col items-center -mt-16">
        {/* Logo */}
        <img
          src={LOGO_URL}
          alt="KJB Reader"
          className="rounded-2xl object-contain"
          style={{ width: 176, height: 176 }}
        />

        {/* Spinner + status text */}
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