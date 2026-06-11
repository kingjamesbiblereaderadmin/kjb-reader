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

// Wait for SW registration to exist (main.jsx registers on 'load')
async function getSwRegistration(timeoutMs = 4000) {
  if (!('serviceWorker' in navigator)) return null;
  let reg = await navigator.serviceWorker.getRegistration().catch(() => null);
  if (reg) return reg;
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const r = await navigator.serviceWorker.getRegistration().catch(() => null);
      if (r) { clearInterval(interval); clearTimeout(timer); resolve(r); }
    }, 150);
    const timer = setTimeout(() => { clearInterval(interval); resolve(null); }, timeoutMs);
  });
}

// Check if there's a waiting/installing SW that represents a new update
async function detectSwUpdate() {
  const reg = await getSwRegistration();
  if (!reg) return { hasUpdate: false, reg: null };

  // Already waiting
  if (reg.waiting) return { hasUpdate: true, reg };

  // Trigger update check and wait for result
  await reg.update().catch(() => {});

  // Check again after update()
  if (reg.waiting) return { hasUpdate: true, reg };

  // Wait for a new worker to install
  const hasUpdate = await new Promise((resolve) => {
    if (reg.waiting) { resolve(true); return; }

    const onInstalling = (worker) => {
      const onState = () => {
        if (worker.state === 'installed') { worker.removeEventListener('statechange', onState); resolve(true); }
        else if (worker.state === 'redundant') { worker.removeEventListener('statechange', onState); resolve(false); }
      };
      worker.addEventListener('statechange', onState);
    };

    if (reg.installing) {
      onInstalling(reg.installing);
      setTimeout(() => resolve(false), 5000);
      return;
    }

    const onFound = () => {
      reg.removeEventListener('updatefound', onFound);
      if (reg.installing) onInstalling(reg.installing);
      else resolve(false);
    };
    reg.addEventListener('updatefound', onFound);
    setTimeout(() => { reg.removeEventListener('updatefound', onFound); resolve(false); }, 5000);
  });

  return { hasUpdate, reg };
}

// Tell the waiting SW to activate. Does NOT cause a page reload —
// main.jsx's controllerchange listener is suppressed during splash.
async function applySwUpdate(reg) {
  const target = reg?.waiting || reg?.installing;
  if (target) {
    // Signal main.jsx to ignore this controllerchange (splash is handling it)
    window._kjbSplashApplyingUpdate = true;
    target.postMessage({ type: 'SKIP_WAITING' });
    // Wait for the new SW to actually become the controller
    await new Promise((resolve) => {
      const onController = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onController);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onController);
      setTimeout(resolve, 3000); // safety
    });
    window._kjbSplashApplyingUpdate = false;
  }
}

async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

const MIN_DISPLAY_MS = 2200;

export default function SplashScreen({ isFadingOut, onDone }) {
  const [statusText, setStatusText] = useState('Loading…');
  const doneRef = useRef(false);

  const step = (text, delay = 900) => new Promise((resolve) => {
    setStatusText(text);
    setTimeout(resolve, delay);
  });

  useEffect(() => {
    let cancelled = false;
    const safeStep = (text, delay) => cancelled ? Promise.resolve() : step(text, delay);

    const run = async () => {
      const isFirstVisit = checkIsFirstVisit();
      const startTime = Date.now();

      // Detect SW update and enforce minimum display time in parallel
      const [swResult] = await Promise.all([
        detectSwUpdate(),
        new Promise(r => setTimeout(r, MIN_DISPLAY_MS)),
      ]);

      if (cancelled) return;

      if (isFirstVisit) markVisited();

      const hasUpdate = swResult.hasUpdate;

      if (isFirstVisit) {
        // First ever visit
        await safeStep('Setting up…', 600);
        await downloadOfflineData();
        if (hasUpdate) {
          await safeStep('Installing updates…', 900);
          await applySwUpdate(swResult.reg);
          await safeStep('Up to date.', 700);
        }
        await safeStep(`Welcome to ${APP_NAME}.`, 1000);
      } else if (hasUpdate) {
        // Returning user with a new SW waiting
        await safeStep('Found app updates.', 800);
        await safeStep('Installing…', 900);
        await applySwUpdate(swResult.reg);
        await safeStep('Done. Welcome back.', 900);
      } else {
        // Returning user, no update
        await safeStep(`Welcome back to ${APP_NAME}.`, 900);
      }

      if (!cancelled && !doneRef.current) {
        doneRef.current = true;
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