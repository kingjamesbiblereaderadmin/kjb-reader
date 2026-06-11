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
    // Wait for a registration to exist (main.jsx registers on 'load', which
    // may not have fired yet when SplashScreen mounts). Poll up to 3s.
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await new Promise((resolve) => {
        const check = setInterval(async () => {
          const r = await navigator.serviceWorker.getRegistration().catch(() => null);
          if (r) { clearInterval(check); resolve(r); }
        }, 200);
        setTimeout(() => { clearInterval(check); resolve(null); }, 3000);
      });
    }
    if (!reg) return { hasUpdate: false };

    // Already has a worker queued up waiting to activate
    if (reg.waiting) {
      console.log('[SplashScreen] Waiting SW found immediately');
      return { hasUpdate: true, reg };
    }

    // Trigger a network fetch of sw.js, then wait up to 4s for a new worker
    // to finish installing (updatefound → installing → installed/waiting).
    await reg.update().catch(() => {});

    const hasUpdate = await new Promise((resolve) => {
      // Already installing by the time update() resolves
      if (reg.waiting) { resolve(true); return; }

      if (reg.installing) {
        const worker = reg.installing;
        const onState = () => {
          if (worker.state === 'installed' || worker.state === 'waiting') {
            worker.removeEventListener('statechange', onState);
            resolve(true);
          } else if (worker.state === 'redundant') {
            worker.removeEventListener('statechange', onState);
            resolve(false);
          }
        };
        worker.addEventListener('statechange', onState);
        setTimeout(() => { worker.removeEventListener('statechange', onState); resolve(false); }, 4000);
        return;
      }

      // No worker installing yet — wait for updatefound, then track its state
      const onFound = () => {
        reg.removeEventListener('updatefound', onFound);
        const worker = reg.installing;
        if (!worker) { resolve(false); return; }
        const onState = () => {
          if (worker.state === 'installed' || worker.state === 'waiting') {
            worker.removeEventListener('statechange', onState);
            resolve(true);
          } else if (worker.state === 'redundant') {
            worker.removeEventListener('statechange', onState);
            resolve(false);
          }
        };
        worker.addEventListener('statechange', onState);
        setTimeout(() => { worker.removeEventListener('statechange', onState); resolve(false); }, 4000);
      };
      reg.addEventListener('updatefound', onFound);
      setTimeout(() => { reg.removeEventListener('updatefound', onFound); resolve(false); }, 4000);
    });

    console.log('[SplashScreen] detectSwUpdate result:', hasUpdate, '| waiting:', !!reg.waiting, '| installing:', !!reg.installing, '| controller:', !!navigator.serviceWorker.controller);
    return { hasUpdate, reg };
  } catch (e) {
    console.error('[SplashScreen] detectSwUpdate error:', e);
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
        // but always display it for at least 2000ms so it's visible.
        setStatusText('Loading…');
        log('Loading…');
        console.log('[Splash] Starting. isFirstVisit:', isFirstVisit, 'controller:', !!navigator.serviceWorker?.controller);
        const [swRes] = await Promise.all([
          detectSwUpdate(),
          new Promise(r => setTimeout(r, 2000)),
        ]);
        swResult = swRes;
        console.log('[Splash] detectSwUpdate result:', JSON.stringify({ hasUpdate: swRes.hasUpdate, hasReg: !!swRes.reg, waiting: !!swRes.reg?.waiting, installing: !!swRes.reg?.installing }));
        if (isFirstVisit) resolvedMode = 'first_load';
        else if (swResult.hasUpdate) resolvedMode = 'subsequent_with_updates';
        else resolvedMode = 'subsequent';
        console.log('[Splash] resolvedMode:', resolvedMode);
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