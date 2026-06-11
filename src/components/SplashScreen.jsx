import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb-has-visited-app';
const STEP_MS = 800; // pause between each status message

function checkIsFirstVisit() {
  try { return !localStorage.getItem(FIRST_VISIT_KEY); } catch { return false; }
}
function markVisited() {
  try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
}

// Get the SW registration, waiting up to 4s for it to appear
async function getSwRegistration(timeoutMs = 4000) {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
  if (reg) return reg;
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const r = await navigator.serviceWorker.getRegistration().catch(() => null);
      if (r) { clearInterval(interval); clearTimeout(timer); resolve(r); }
    }, 150);
    const timer = setTimeout(() => { clearInterval(interval); resolve(null); }, timeoutMs);
  });
}

// Trigger reg.update() and wait up to 5s to see if a new worker installs
async function checkForSwUpdate(reg) {
  if (!reg) return false;
  if (reg.waiting) return true;

  await reg.update().catch(() => {});
  if (reg.waiting) return true;

  return new Promise((resolve) => {
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
}

// Send SKIP_WAITING to waiting/installing SW and wait for it to become controller
async function applySwUpdate(reg) {
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
    setTimeout(resolve, 3000); // safety timeout
  });
  window._kjbSplashApplyingUpdate = false;
}

async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

// Install updates in a loop: check → apply → re-check → repeat until no more updates
async function installUpdatesLoop(reg, show) {
  let hasUpdate = await checkForSwUpdate(reg);
  if (!hasUpdate) {
    await show('No updates found.');
    return;
  }
  while (hasUpdate) {
    await show('Found app updates.');
    await show('Installing updates…');
    await applySwUpdate(reg);
    await show('Applying updates…');
    await show('Checking for updates…');
    // Re-fetch registration in case it changed
    reg = await getSwRegistration(2000);
    hasUpdate = reg ? await checkForSwUpdate(reg) : false;
  }
  await show('No updates found.');
}

export default function SplashScreen({ isFadingOut, onDone, mode = 'auto' }) {
  const [statusText, setStatusText] = useState('Loading…');
  const doneRef = useRef(false);
  const log = useRef([]);

  useEffect(() => {
    let cancelled = false;

    const show = (text) => {
      if (cancelled) return Promise.resolve();
      log.current.push(text);
      setStatusText(text);
      return new Promise(resolve => setTimeout(resolve, STEP_MS));
    };

    const run = async () => {
      log.current = ['Loading…'];

      // ── TEST MODES (simulated, no real SW/network ops) ──
      if (mode === 'first_load') {
        await show('Downloading offline Bible data…');
        await new Promise(r => setTimeout(r, 1200)); // simulate download
        await show('Checking for updates…');
        await show('No updates found.');
        await show(`Welcome to ${APP_NAME}.`);
        if (!cancelled && !doneRef.current) { doneRef.current = true; onDone?.(); }
        return;
      }
      if (mode === 'subsequent_with_updates') {
        await show('Checking for updates…');
        await show('Found app updates.');
        await show('Installing updates…');
        await new Promise(r => setTimeout(r, 1200));
        await show('Applying updates…');
        await show('Checking for updates…');
        await show('No updates found.');
        await show(`Welcome back to ${APP_NAME}.`);
        if (!cancelled && !doneRef.current) { doneRef.current = true; onDone?.(); }
        return;
      }

      const isFirstVisit = mode === 'auto' && checkIsFirstVisit();
      let reg = await getSwRegistration();

      if (isFirstVisit) {
        // ── FIRST LOAD (real) ──
        markVisited();
        await show('Downloading offline Bible data…');
        await downloadOfflineData();
        await show('Checking for updates…');
        await installUpdatesLoop(reg, show);
        await show(`Welcome to ${APP_NAME}.`);

      } else if (mode === 'home_update') {
        // ── HOME SCREEN / PWA update ──
        // Skip "Loading…" / "Checking…" — jump straight to update flow
        await show('Found app updates.');
        await show('Installing updates…');
        await applySwUpdate(reg);
        await show('Applying updates…');
        await show('Checking for updates…');
        reg = await getSwRegistration(2000);
        const hasMore = reg ? await checkForSwUpdate(reg) : false;
        if (hasMore) {
          await installUpdatesLoop(reg, show);
        } else {
          await show('No updates found.');
        }
        await show(`Welcome back to ${APP_NAME}.`);

      } else {
        // ── SUBSEQUENT VISIT ──
        await show('Checking for updates…');
        await installUpdatesLoop(reg, show);
        await show(`Welcome back to ${APP_NAME}.`);
      }

      if (!cancelled) {
        console.groupCollapsed('[KJB Splash] Steps completed');
        log.current.forEach((s, i) => console.log(`${i + 1}. ${s}`));
        console.groupEnd();
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