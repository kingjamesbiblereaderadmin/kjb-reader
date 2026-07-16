import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { detectIncognito } from '@/lib/incognito';

const STEP_PAUSE_MS = 1500;

// mode: 'first_load' | 'subsequent' | 'home_update'
export default function SplashScreen({ isFadingOut, onDone, mode = 'first_load', isVisible = true }) {
  const [currentMessage, setCurrentMessage] = useState('LOADING KJB READER...');
  const [isIncognito, setIsIncognito] = useState(false);
  // progress: 0-100 for a determinate bar (during downloads); null = indeterminate
  const [progress, setProgress] = useState(null);
  const doneRef = useRef(false);
  const stepsLog = useRef([]);



  const setStep = (message) => {
    stepsLog.current.push(message);
    setCurrentMessage(message);
    setProgress(null); // non-download steps use an indeterminate bar
    console.log('[KJB Splash]', message);
    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message, status: 'loading' } }));
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  // Check if the user is signed in. The actual sync runs inside runStep below
  // so the "SYNCING YOUR DATA..." banner is visible while it works.
  const isSignedIn = async () => {
    try {
      const base44 = (await import('@/api/base44Client')).base44;
      return await base44.auth.isAuthenticated().catch(() => false);
    } catch {
      return false;
    }
  };

  const doSync = async () => {
    try {
      const { syncSettingsFromCloud } = await import('@/lib/settingsSync');
      await syncSettingsFromCloud();
    } catch (err) {
      console.warn('[Splash] Settings sync failed:', err?.message);
    }
  };

  // Run a real async task while showing `label`. The banner stays visible for at
  // least MIN_VISIBLE_MS so it's readable, but it never advances before the real
  // work actually finishes — so every banner reflects real-time progress.
  const MIN_VISIBLE_MS = 600;
  const runStep = async (label, task) => {
    setStep(label);
    const start = Date.now();
    let result;
    try {
      result = await task();
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_VISIBLE_MS) await pause(MIN_VISIBLE_MS - elapsed);
    }
    return result;
  };

  // Download Bible data while live-updating the banner with real % progress.
  // Returns true on success, false on failure (e.g. WiFi drops mid-download) so
  // callers can stop pretending the update finished and fall back to whatever
  // is already cached, instead of silently marching on to "WELCOME".
  const downloadWithProgress = async (label) => {
    const { downloadBibleForOffline } = await import('@/lib/bibleCache');
    const start = Date.now();
    stepsLog.current.push(label);
    setCurrentMessage(label);
    setProgress(0);
    let ok = true;
    try {
      await downloadBibleForOffline((pct, msg) => {
        setProgress(pct);
        setCurrentMessage(`${label} ${pct}%`);
        window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: `${label} ${pct}%`, status: 'loading' } }));
      });
      setProgress(100);
    } catch (err) {
      console.error('[Splash] Download failed:', err.message);
      ok = false;
    }
    const elapsed = Date.now() - start;
    if (elapsed < MIN_VISIBLE_MS) await pause(MIN_VISIBLE_MS - elapsed);
    return ok;
  };

  // Tracks when we last applied an update in this flow. Re-checks within a short
  // cooldown after applying must IGNORE the just-activated service worker, which
  // otherwise lingers as waiting/installing for a moment and gets re-counted as a
  // "new" update — causing the endless FOUND → INSTALLING → CHECKING → FOUND loop.
  const justAppliedAt = useRef(0);
  const APPLY_COOLDOWN_MS = 12000;

  // Real update detection: SW registration, SW version, then Bible cache version.
  const checkRealUpdates = async (swUpdatedAtMount) => {
    let hasUpdates = !!swUpdatedAtMount;
    // Within the cooldown after applying, skip SW-registration detection so the
    // worker we just activated isn't mistaken for a brand-new update.
    const inCooldown = Date.now() - justAppliedAt.current < APPLY_COOLDOWN_MS;
    if (!hasUpdates && !inCooldown && navigator.onLine) {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
          if (reg) {
            await reg.update().catch(() => {});
            hasUpdates = !!(reg.waiting || reg.installing);
          }
        }
        if (!hasUpdates) {
          const { isSwUpdateAvailable } = await import('@/lib/swVersionCheck');
          hasUpdates = await isSwUpdateAvailable().catch(() => false);
        }
        if (!hasUpdates) {
          const { checkForUpdates } = await import('@/lib/bibleCache');
          hasUpdates = await checkForUpdates().catch(() => false);
        }
      } catch {}
    }
    return hasUpdates;
  };

  // Real SW activation. Also marks the deployed SW version as applied so the
  // NEXT "CHECKING FOR UPDATES" step in the loop doesn't re-detect the same
  // update we just installed (which caused an endless FOUND → INSTALLING →
  // CHECKING → FOUND loop until the guard cap).
  const applyServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        window._kjbSplashApplyingUpdate = true;
        const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
        if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch {}
    }
    try {
      const { markSwVersionApplied } = await import('@/lib/swVersionCheck');
      markSwVersionApplied();
    } catch {}
    // Mark Bible data version applied too so checkForUpdates() won't re-fire.
    try { localStorage.setItem('bible_last_refresh', String(Date.now())); } catch {}
    // Start the cooldown so the immediate next "CHECKING" step ignores the
    // worker we just activated (prevents the double FOUND loop).
    justAppliedAt.current = Date.now();
  };

  useEffect(() => {
    if (!isVisible || doneRef.current) return;
    doneRef.current = true;

    // Capture the SW-update flag IMMEDIATELY on mount, before any async pause —
    // otherwise a background controllerchange/reload in main.jsx could consume
    // or clear it before the splash reaches its "checking" step. Stash it so the
    // flows below can use it without racing.
    const swUpdatedAtMount = sessionStorage.getItem('kjb_sw_updated');
    if (swUpdatedAtMount) sessionStorage.removeItem('kjb_sw_updated');
    // Prevent main.jsx from reloading while the splash is running this flow.
    window._kjbSplashApplyingUpdate = true;

    // Safety net: no matter what happens inside the flow (a thrown error, a
    // hung import, etc.), the splash MUST hand off to the app. Without this,
    // any unhandled exception left the overlay stuck on its last message
    // (e.g. "NO UPDATES FOUND.") forever, blanking the whole app behind it.
    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      try { window.dispatchEvent(new Event('kjb-progress-clear')); } catch {}
      onDone?.();
    };
    // Absolute cap — if the flow ever stalls, force the hand-off after 20s.
    const hardTimeout = setTimeout(finishOnce, 20000);

    (async () => {
      // Wait for incognito detection to complete before starting splash flow
      const detectedIncognito = await detectIncognito();
      setIsIncognito(detectedIncognito);
      
      let isFirstVisit = mode === 'first_load';
      let isHomeUpdate = mode === 'home_update';
      
      console.log('[KJB Splash] Mode:', mode, 'Incognito:', detectedIncognito);

      // Helper: mark the app as visited so the NEXT visit is "subsequent".
      // IMPORTANT: this must only be called once a flow COMPLETES — never at the
      // start. If set early and the page reloads mid-flow (e.g. a SW update),
      // the reloaded splash would wrongly treat a first-time visitor as
      // returning (skipping "DOWNLOADING OFFLINE DATA", showing "WELCOME BACK").
      const markVisited = () => {
        if (!detectedIncognito) {
          try { localStorage.setItem('kjb-has-visited-app', 'true'); } catch {}
        }
      };

      // === FIRST LOAD FLOW ===
      if (isFirstVisit) {
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Skip offline download in incognito (cache won't persist)
        if (!detectedIncognito) {
          // 2. Downloading offline data (real-time % progress)
          const gotOfflineData = await downloadWithProgress('DOWNLOADING OFFLINE DATA...');

          // 2b. Offline data complete (or, if the connection dropped, say so
          // plainly instead of implying it finished)
          setStep(gotOfflineData ? 'OFFLINE BIBLE DATA COMPLETE.' : 'CONNECTION LOST — CONTINUING ONLINE-ONLY.');
          await pause(STEP_PAUSE_MS);
        } else {
          console.log('[Splash] Incognito mode detected — skipping offline download');
        }

        // 3. Checking for updates (real check)
        const hasUpdates = await runStep('CHECKING FOR UPDATES...', () => checkRealUpdates(swUpdatedAtMount));

        if (hasUpdates) {
          // Loop: Found → Installing → Applying → Checking, until no more updates.
          let more = true;
          let guard = 0;
          let downloadFailed = false;
          while (more && guard < 5) {
            guard++;
            setStep('FOUND UPDATES.');
            await pause(STEP_PAUSE_MS);
            const downloaded = await downloadWithProgress('INSTALLING UPDATES...');
            if (!downloaded) {
              // Connection dropped mid-update. The old cached data is untouched
              // (downloadBibleForOffline no longer wipes it before fetching), so
              // say so plainly and fall back to what's already on the device
              // rather than pretending the update succeeded.
              downloadFailed = true;
              setStep('CONNECTION LOST — USING SAVED DATA.');
              await pause(STEP_PAUSE_MS);
              break;
            }
            await runStep('APPLYING UPDATES...', applyServiceWorker);
            more = await runStep('CHECKING FOR UPDATES...', () => checkRealUpdates(false));
          }
          if (!downloadFailed) {
            setStep('NO UPDATES FOUND.');
            await pause(STEP_PAUSE_MS);
          }
        } else {
          // No updates
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 7b. Give the browser's install prompt a brief moment to fire so the
        // Install button is ready immediately (Edge fires beforeinstallprompt
        // late). Skip in incognito where install isn't available. Capped short
        // so it never noticeably delays the welcome.
        if (!detectedIncognito && !window.kjbDeferredPrompt) {
          await new Promise((resolve) => {
            let done = false;
            const finish = () => { if (!done) { done = true; window.removeEventListener('pwa-installable', finish); resolve(); } };
            window.addEventListener('pwa-installable', finish);
            setTimeout(finish, 1500);
          });
        }

        // 8. Sync cloud settings (skipped for guests — nothing to sync)
        if (await isSignedIn()) {
          await runStep('SYNCING YOUR DATA...', doSync);
          setStep('DATA SYNCED.');
          await pause(STEP_PAUSE_MS);
        }

        // 9. Welcome
        if (detectedIncognito) {
          setStep('WELCOME TO KJB READER (GUEST MODE)');
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'WELCOME TO KJB READER (GUEST MODE)', status: 'success' } }));
        } else {
          setStep('WELCOME TO KJB READER.');
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'WELCOME TO KJB READER.', status: 'success' } }));
        }
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

        console.group('[Splash] Summary');
        stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
        console.groupEnd();
        try { const { markSwVersionApplied } = await import('@/lib/swVersionCheck'); markSwVersionApplied(); } catch {}
        markVisited();
        finishOnce();
        return;
      }

      // === SUBSEQUENT VISIT FLOW ===
      if (!isHomeUpdate) {
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Checking for updates — real detection
        const hasUpdates = await runStep('CHECKING FOR UPDATES...', () => checkRealUpdates(swUpdatedAtMount));

        if (hasUpdates) {
          // Loop: Found → Installing → Applying → Checking, until no more updates.
          let more = true;
          let guard = 0;
          let downloadFailed = false;
          while (more && guard < 5) {
            guard++;
            setStep('FOUND UPDATES.');
            await pause(STEP_PAUSE_MS);
            const downloaded = await downloadWithProgress('INSTALLING UPDATES...');
            if (!downloaded) {
              // Connection dropped mid-update — old cached data is untouched, so
              // say so plainly and fall back to it instead of claiming success.
              downloadFailed = true;
              setStep('CONNECTION LOST — USING SAVED DATA.');
              await pause(STEP_PAUSE_MS);
              break;
            }
            await runStep('APPLYING UPDATES...', applyServiceWorker);
            more = await runStep('CHECKING FOR UPDATES...', () => checkRealUpdates(false));
          }
          if (!downloadFailed) {
            setStep('NO UPDATES FOUND.');
            await pause(STEP_PAUSE_MS);
          }
        } else {
          // No updates
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 7. Sync cloud settings (skipped for guests — nothing to sync)
        if (await isSignedIn()) {
          await runStep('SYNCING YOUR DATA...', doSync);
          setStep('DATA SYNCED.');
          await pause(STEP_PAUSE_MS);
        }

        // 8. Welcome back
        setStep('WELCOME BACK TO KJB READER.');
        window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'WELCOME BACK TO KJB READER.', status: 'success' } }));
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

        console.group('[Splash] Summary');
        stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
        console.groupEnd();
        try { const { markSwVersionApplied } = await import('@/lib/swVersionCheck'); markSwVersionApplied(); } catch {}
        markVisited();
        finishOnce();
        return;
      }

      // === HOME UPDATE FLOW ===
      if (isHomeUpdate) {
        // 1. Found updates (skip loading/checking)
        setStep('FOUND UPDATES.');
        await pause(STEP_PAUSE_MS);

        // 2. Installing updates
        setStep('INSTALLING UPDATES...');
        let homeDownloadOk = true;
        try {
          const { downloadBibleForOffline } = await import('@/lib/bibleCache');
          await downloadBibleForOffline();
        } catch (err) {
          console.error('[Splash] Data install failed:', err.message);
          homeDownloadOk = false;
        }
        await pause(STEP_PAUSE_MS);

        if (!homeDownloadOk) {
          // Connection dropped mid-update. downloadBibleForOffline() no longer
          // wipes the old cache before fetching, so whatever was already on the
          // device is still there — say so plainly and skip straight to Welcome
          // instead of pretending the update applied and re-checking online.
          setStep('CONNECTION LOST — USING SAVED DATA.');
          await pause(STEP_PAUSE_MS);
        } else {
          // 3. Applying updates
          setStep('APPLYING UPDATES...');
          await pause(STEP_PAUSE_MS);

          // Activate service worker (flag so main.jsx skips its reload)
          if ('serviceWorker' in navigator) {
            try {
              window._kjbSplashApplyingUpdate = true;
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }

          // 4. Checking for updates (repeat if found)
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);

          let hasMoreUpdates = false;
          if (navigator.onLine) {
            try {
              const { checkForUpdates } = await import('@/lib/bibleCache');
              hasMoreUpdates = await checkForUpdates().catch(() => false);
            } catch {}
          }

          if (hasMoreUpdates) {
            // Loop: Found → Installing → Applying → Checking
            setStep('FOUND UPDATES.');
            await pause(STEP_PAUSE_MS);
            setStep('INSTALLING UPDATES...');
            let ok2 = true;
            try {
              const { downloadBibleForOffline } = await import('@/lib/bibleCache');
              await downloadBibleForOffline();
            } catch (err) {
              console.error('[Splash] Data install failed:', err.message);
              ok2 = false;
            }
            await pause(STEP_PAUSE_MS);
            if (!ok2) {
              setStep('CONNECTION LOST — USING SAVED DATA.');
              await pause(STEP_PAUSE_MS);
            } else {
              setStep('APPLYING UPDATES...');
              await pause(STEP_PAUSE_MS);
              if ('serviceWorker' in navigator) {
                try {
                  window._kjbSplashApplyingUpdate = true;
                  const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
                  if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                } catch {}
              }
              setStep('CHECKING FOR UPDATES...');
              await pause(STEP_PAUSE_MS);
            }
          }

          // Confirm nothing more to apply before welcoming back.
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 5. Sync cloud settings (skipped for guests — nothing to sync)
        if (await isSignedIn()) {
          await runStep('SYNCING YOUR DATA...', doSync);
          setStep('DATA SYNCED.');
          await pause(STEP_PAUSE_MS);
        }

        // 6. Welcome back
        setStep('WELCOME BACK TO KJB READER.');
        window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'WELCOME BACK TO KJB READER.', status: 'success' } }));
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

        // Record the deployed SW version as applied, so the next home check
        // only re-triggers when a NEW version is deployed.
        try {
          const pending = sessionStorage.getItem('kjb-pending-sw-version');
          if (pending) {
            localStorage.setItem('kjb-applied-sw-version', pending);
            sessionStorage.removeItem('kjb-pending-sw-version');
          }
        } catch {}

        console.group('[Splash] Summary');
        stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
        console.groupEnd();
        markVisited();
        finishOnce();
        return;
      }
    })().catch((err) => {
      console.error('[Splash] flow error — handing off to app anyway:', err);
      finishOnce();
    }).finally(() => {
      clearTimeout(hardTimeout);
    });
  }, [isVisible, mode]);

  if (!isVisible) return null;

  // Theme-aware splash colors: light bg in light mode, dark bg in dark mode —
  // matching the boot placeholder in index.html so there's no flash/white box.
  const isDarkSplash = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const splashBg = isDarkSplash ? '#0f1117' : '#fef9f3';
  const trackBg = isDarkSplash ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textColor = isDarkSplash ? '#c8cdd8' : '#5a6472';

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: splashBg }}
    >
      <div className="flex flex-col items-center -mt-16" style={{ gap: '48px' }}>
        <img
          src="https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/1d77e5114_icon-512.png"
          alt="KJB Reader Logo"
          className="w-44 h-44 object-contain rounded-2xl p-3"
          style={{ background: splashBg }}
        />
        <div className="flex flex-col items-center gap-5 w-64">
          {/* Progress bar — determinate (download %) or indeterminate (other steps) */}
          <div
            className="w-full h-1.5 rounded-full overflow-hidden relative"
            style={{ background: trackBg }}
          >
            {progress === null ? (
              <div
                className="absolute top-0 h-full rounded-full"
                style={{ width: '40%', background: '#4f6aff', animation: 'kjb-splash-indeterminate 1.2s ease-in-out infinite' }}
              />
            ) : (
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, background: '#4f6aff' }}
              />
            )}
          </div>
          <span
            className="font-sans text-sm font-light tracking-[0.25em] uppercase transition-all duration-300 text-center"
            style={{ color: textColor }}
          >
            {currentMessage}
          </span>
        </div>
        <style>{`
          @keyframes kjb-splash-indeterminate {
            0% { left: -40%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}