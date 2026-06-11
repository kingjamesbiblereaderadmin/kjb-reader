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

// Trigger a fresh SW update check and WAIT until we know whether a new worker
// is installing/waiting. Resolves true if a new worker becomes available.
async function waitForSwUpdate(timeoutMs = 8000) {
  const reg = await getSwReg();
  if (!reg) return false;

  // Already have a waiting worker ready to activate.
  if (reg.waiting) {
    console.log('[SW Update] Waiting worker found immediately');
    return true;
  }

  // Kick off a fresh check against the server for a new sw.js.
  console.log('[SW Update] Checking for updates...');
  try { await reg.update(); } catch (e) { console.error('[SW Update] Update check failed:', e); }
  
  // Wait a moment for the browser to detect the new worker
  await new Promise(r => setTimeout(r, 500));
  
  if (reg.waiting) {
    console.log('[SW Update] Waiting worker found after update check');
    return true;
  }
  
  if (reg.installing) {
    console.log('[SW Update] Installing worker detected, waiting...');
  }

  // A new worker is downloading — wait for it to finish installing.
  const installing = reg.installing;
  if (!installing) {
    console.log('[SW Update] No worker installing or waiting');
    return false;
  }

  return await new Promise((resolve) => {
    let settled = false;
    const finish = (val) => { if (!settled) { settled = true; resolve(val); } };
    const onState = () => {
      console.log('[SW Update] Worker state changed:', installing.state);
      if (installing.state === 'installed' || installing.state === 'activated') {
        console.log('[SW Update] Worker installed/activated');
        finish(true);
      } else if (installing.state === 'redundant') {
        console.log('[SW Update] Worker became redundant');
        finish(false);
      }
    };
    installing.addEventListener('statechange', onState);
    setTimeout(() => {
      console.log('[SW Update] Timeout - checking final state:', !!reg.waiting);
      finish(!!reg.waiting);
    }, timeoutMs);
  });
}

// Download the Bible data so the app works offline.
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

// Check if Bible data has updates available.
async function checkBibleUpdates() {
  try {
    const { checkForUpdates } = await import('@/lib/bibleCache');
    return await checkForUpdates().catch(() => false);
  } catch {
    return false;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SplashScreen({ isFadingOut, onDone, mode = 'auto' }) {
  const [statusText, setStatusText] = useState('Loading…');
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      const log = [];
      const step = async (text, effect) => {
        if (cancelled) return;
        setStatusText(text);
        console.log(`[KJB Splash] ${text}`);
        log.push(text);
        if (effect && mode === 'auto') await effect();
        await delay(STEP_MS);
      };

      // Determine scenario
      let isFirst = false;
      let hasAppUpdate = false;
      let hasBibleUpdate = false;

      if (mode === 'auto') {
        // Check if first visit
        let bibleCached = false;
        try {
          const { isBibleCached } = await import('@/lib/bibleCache');
          bibleCached = await isBibleCached().catch(() => false);
        } catch {}
        isFirst = isFirstVisit() || !bibleCached;
        if (isFirst) markVisited();

        console.log('[KJB Splash] First visit:', isFirst, 'Bible cached:', bibleCached);

        // Check for app updates (service worker)
        console.log('[KJB Splash] Checking for SW update...');
        hasAppUpdate = await waitForSwUpdate();
        console.log('[KJB Splash] SW update found:', hasAppUpdate);

        // Check for Bible data updates
        console.log('[KJB Splash] Checking for Bible update...');
        hasBibleUpdate = await checkBibleUpdates();
        console.log('[KJB Splash] Bible update found:', hasBibleUpdate);
      }

      const hasAnyUpdate = hasAppUpdate || hasBibleUpdate;
      console.log('[KJB Splash] Has any update:', hasAnyUpdate);

      // ── FIRST LOAD FLOW ─────────────────────────────────────────────────────
      if (isFirst) {
        await step('Loading…');
        await step('Downloading offline Bible data…', downloadOfflineData);
        await step('Checking for updates…');
        
        if (hasAnyUpdate) {
          await step('Found updates.');
          await step('Installing updates…');
          await step('Applying updates…', applyUpdates);
        } else {
          await step('No updates found.');
        }
        
        await step(`Welcome to ${APP_NAME}.`);
      }
      // ── SUBSEQUENT LOAD FLOW ───────────────────────────────────────────────
      else {
        await step('Loading…');
        await step('Checking for updates…');
        
        if (hasAnyUpdate) {
          await step('Found updates.');
          await step('Installing updates…');
          await step('Applying updates…', applyUpdates);
        } else {
          await step('No updates found.');
        }
        
        await step(`Welcome back to ${APP_NAME}.`);
      }

      // Log summary
      console.groupCollapsed(`[KJB Splash] Done — first:${isFirst} app:${hasAppUpdate} bible:${hasBibleUpdate}`);
      log.forEach((s, i) => console.log(`${i + 1}. ${s}`));
      console.groupEnd();

      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
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