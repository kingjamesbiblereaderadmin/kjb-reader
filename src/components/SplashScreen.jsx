import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { detectIncognito } from '@/lib/incognito';

const STEP_PAUSE_MS = 1500;

// mode: 'first_load' | 'subsequent' | 'home_update'
export default function SplashScreen({ isFadingOut, onDone, mode = 'first_load', isVisible = true }) {
  const [currentMessage, setCurrentMessage] = useState('LOADING KJB READER...');
  const [isIncognito, setIsIncognito] = useState(false);
  const doneRef = useRef(false);
  const stepsLog = useRef([]);



  const setStep = (message) => {
    stepsLog.current.push(message);
    setCurrentMessage(message);
    console.log('[KJB Splash]', message);
    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message, status: 'loading' } }));
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));

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
          // 2. Downloading offline data
          setStep('DOWNLOADING OFFLINE DATA...');
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Offline download failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);

          // 3. Checking for updates
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
        } else {
          // Incognito mode: skip download, go straight to update check
          console.log('[Splash] Incognito mode detected — skipping offline download');
          // 2. Checking for updates (renumbered for incognito)
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
        }

        // Honour the SW-update flag captured at mount (main.jsx sets it when a
        // freshly-bumped, auto-activated SW takes over), since by now there's
        // often no `waiting`/`installing` worker left to detect.
        let hasUpdates = !!swUpdatedAtMount;
        if (!hasUpdates && navigator.onLine) {
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

        if (hasUpdates) {
          // 4. Found updates
          setStep('FOUND UPDATES.');
          await pause(STEP_PAUSE_MS);

          // 5. Installing updates
          setStep('INSTALLING UPDATES...');
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);

          // 6. Applying updates
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

          // 7. Check again (loop)
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
        } else {
          // No updates
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 8. Welcome
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
        onDone?.();
        return;
      }

      // === SUBSEQUENT VISIT FLOW ===
      if (!isHomeUpdate) {
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Checking for updates
        setStep('CHECKING FOR UPDATES...');
        await pause(STEP_PAUSE_MS);

        // Honour the SW-update flag captured at mount so the "Found updates"
        // sequence still plays after a freshly-bumped SW auto-activated.
        let hasUpdates = !!swUpdatedAtMount;
        if (!hasUpdates && navigator.onLine) {
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

        if (hasUpdates) {
          // 3. Found updates
          setStep('FOUND UPDATES.');
          await pause(STEP_PAUSE_MS);

          // 4. Installing updates
          setStep('INSTALLING UPDATES...');
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);

          // 5. Applying updates
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

          // 6. Check again (loop if more updates)
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
        } else {
          // No updates
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 7. Welcome back
        setStep('WELCOME BACK TO KJB READER.');
        window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'WELCOME BACK TO KJB READER.', status: 'success' } }));
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

        console.group('[Splash] Summary');
        stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
        console.groupEnd();
        try { const { markSwVersionApplied } = await import('@/lib/swVersionCheck'); markSwVersionApplied(); } catch {}
        markVisited();
        onDone?.();
        return;
      }

      // === HOME UPDATE FLOW ===
      if (isHomeUpdate) {
        // 1. Found updates (skip loading/checking)
        setStep('FOUND UPDATES.');
        await pause(STEP_PAUSE_MS);

        // 2. Installing updates
        setStep('INSTALLING UPDATES...');
        try {
          const { downloadBibleForOffline } = await import('@/lib/bibleCache');
          await downloadBibleForOffline();
        } catch (err) {
          console.error('[Splash] Data install failed:', err.message);
        }
        await pause(STEP_PAUSE_MS);

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
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);
          setStep('APPLYING UPDATES...');
          await pause(STEP_PAUSE_MS);
          if ('serviceWorker' in navigator) {
            try {
              window._kjbSplashApplyingUpdate = true;
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }
        }

        // 5. Welcome back
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
        onDone?.();
        return;
      }
    })();
  }, [isVisible, mode]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: '#0f1117' }}
    >
      <div className="flex flex-col items-center -mt-16" style={{ gap: '48px' }}>
        <img
          src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png"
          alt="KJB Reader Logo"
          className="w-44 h-44 object-contain rounded-2xl"
        />
        <div className="flex flex-col items-center gap-5">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: '#4f6aff', animationDuration: '1.2s' }}
          />
          <span
            className="font-sans text-sm font-light tracking-[0.25em] uppercase transition-all duration-300"
            style={{ color: '#c8cdd8' }}
          >
            {currentMessage}
          </span>
        </div>
      </div>
    </div>
  );
}