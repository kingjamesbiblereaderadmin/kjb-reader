import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb-has-visited-app';
const STEP_MS = 800;

function checkIsFirstVisit() {
  try { return !localStorage.getItem(FIRST_VISIT_KEY); } catch { return false; }
}
function markVisited() {
  try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
}

async function getSwReg(timeoutMs = 4000) {
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

async function checkForUpdate(reg) {
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
    if (reg.installing) { onInstalling(reg.installing); setTimeout(() => resolve(false), 5000); return; }
    const onFound = () => {
      reg.removeEventListener('updatefound', onFound);
      if (reg.installing) onInstalling(reg.installing);
      else resolve(false);
    };
    reg.addEventListener('updatefound', onFound);
    setTimeout(() => { reg.removeEventListener('updatefound', onFound); resolve(false); }, 5000);
  });
}

async function applyUpdate(reg) {
  const target = reg?.waiting || reg?.installing;
  if (!target) return;
  window._kjbSplashApplyingUpdate = true;
  target.postMessage({ type: 'SKIP_WAITING' });
  await new Promise((resolve) => {
    const onController = () => { navigator.serviceWorker.removeEventListener('controllerchange', onController); resolve(); };
    navigator.serviceWorker.addEventListener('controllerchange', onController);
    setTimeout(resolve, 3000);
  });
  window._kjbSplashApplyingUpdate = false;
}

async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

// ─────────────────────────────────────────────────────────────────

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

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    const done = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      console.groupCollapsed('[KJB Splash] Steps');
      log.current.forEach((s, i) => console.log(`${i + 1}. ${s}`));
      console.groupEnd();
      onDone?.();
    };

    const run = async () => {
      log.current = ['Loading…'];

      // ── Simulated test scenarios ──────────────────────────────

      if (mode === 'first_load') {
        // Scenario 1: brand new user
        await show('Downloading offline Bible data…');
        await delay(1200);
        await show('Checking for updates…');
        await show('No updates found.');
        await show(`Welcome to ${APP_NAME}.`);
        done(); return;
      }

      if (mode === 'subsequent') {
        // Scenario 2: returning user, no updates
        await show('Checking for updates…');
        await show('No updates found.');
        await show(`Welcome back to ${APP_NAME}.`);
        done(); return;
      }

      if (mode === 'subsequent_with_updates') {
        // Scenario 3: returning user, updates available
        await show('Checking for updates…');
        await show('Updates found.');
        await show('Installing updates…');
        await delay(1200);
        await show('Applying updates…');
        await show(`Welcome back to ${APP_NAME}.`);
        done(); return;
      }

      if (mode === 'home_update') {
        // Scenario 4: opened from home screen, update waiting
        await show('Checking for updates…');
        await show('Updates found.');
        await show('Installing updates…');
        await delay(1200);
        await show('Applying updates…');
        await show(`Welcome back to ${APP_NAME}.`);
        done(); return;
      }

      // ── Auto mode: real production logic ─────────────────────

      const isFirst = checkIsFirstVisit();
      if (isFirst) markVisited();

      let reg = await getSwReg();

      if (isFirst) {
        await show('Downloading offline Bible data…');
        await downloadOfflineData();
      }

      await show('Checking for updates…');
      const hasUpdate = await checkForUpdate(reg);

      if (hasUpdate) {
        await show('Updates found.');
        await show('Installing updates…');
        await applyUpdate(reg);
        await show('Applying updates…');
      } else {
        await show('No updates found.');
      }

      await show(isFirst ? `Welcome to ${APP_NAME}.` : `Welcome back to ${APP_NAME}.`);
      done();
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