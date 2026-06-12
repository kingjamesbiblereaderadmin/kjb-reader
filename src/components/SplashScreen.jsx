import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { detectIncognito } from '@/lib/incognito';

const STEP_PAUSE_MS = 1500;

// mode: 'first_load' | 'subsequent' | 'home_update'
export default function SplashScreen({ isFadingOut, onDone, mode = 'first_load', isVisible = true }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isIncognito, setIsIncognito] = useState(false);
  const doneRef = useRef(false);
  const stepsLog = useRef([]);



  const setStep = (message) => {
    stepsLog.current.push(message);
    setCurrentMessage(message);
    console.log('[KJB Splash]', message);
    // Fire banner for ALL splash screen steps
    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message, status: message.includes('WELCOME') ? 'success' : 'loading' } }));
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  // The waiting worker we've already applied this session — used so the same
  // waiting SW is never treated as a "new" update again (prevents loops).
  const appliedWorkerRef = useRef(null);

  // Detect whether there's a NEW service-worker version waiting to activate.
  // A worker we already applied in this session does not count again.
  const hasSWUpdate = async () => {
    if (!navigator.onLine || !('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
      if (!reg) return false;
      await reg.update().catch(() => {});
      return !!reg.waiting && reg.waiting !== appliedWorkerRef.current;
    } catch { return false; }
  };

  // Run ONE strictly-linear update cycle: found → installing → applying → check.
  // Returns true only if a genuinely NEW worker is waiting afterwards.
  const runUpdateCycle = async () => {
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

    // Activate the waiting SW once and remember it (no page reload — the
    // controllerchange auto-reload was removed, so this can't loop).
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
        if (reg?.waiting) {
          appliedWorkerRef.current = reg.waiting;
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch {}
    }

    setStep('CHECKING FOR UPDATES...');
    await pause(STEP_PAUSE_MS);
    return await hasSWUpdate();
  };

  // Repeat the linear cycle only while a genuinely new worker keeps appearing.
  // Hard-capped at 3 iterations as a final safety guard against any loop.
  const runUpdateLoop = async () => {
    let more = true;
    let guard = 0;
    while (more && guard < 3) {
      more = await runUpdateCycle();
      guard++;
    }
  };

  useEffect(() => {
    if (!isVisible || doneRef.current) return;
    doneRef.current = true;

    (async () => {
      // Wait for incognito detection to complete before starting splash flow
      const detectedIncognito = await detectIncognito();
      setIsIncognito(detectedIncognito);
      console.log('[Splash] Incognito detection result:', detectedIncognito);
      
      // Trust the mode passed from App.jsx — it already checked flags and SW state
      let isHomeUpdate = mode === 'home_update';
      let isFirstVisit = mode === 'first_load';
      
      // In incognito/private mode, ALWAYS treat as first load (storage doesn't persist across sessions)
      // This prevents "WELCOME BACK" from showing in private windows
      if (detectedIncognito) {
        console.log('[Splash] Incognito detected — forcing first_load behavior, ignoring any flags');
        isFirstVisit = true;
        isHomeUpdate = false;
      }
      
      console.log('[Splash] Final mode:', { mode, isFirstVisit, isHomeUpdate, detectedIncognito });

      // === FIRST LOAD FLOW ===
      if (isFirstVisit) {
        // Set flags at START to survive SW reloads
        sessionStorage.setItem('kjb-first-load-flow', 'true');
        // Don't set hasVisited flag here — App.jsx now uses Bible cache only
        
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Downloading offline data - ALWAYS download on first_load (don't skip if cached)
        const { downloadBibleForOffline, isBibleCached } = await import('@/lib/bibleCache');
        let justDownloadedBible = false;
        
        if (!detectedIncognito) {
          setStep('DOWNLOADING OFFLINE DATA...', true);
          console.log('[Splash] Starting offline download...');
          try {
            await downloadBibleForOffline((pct, msg) => {
              console.log('[Splash] Download progress:', pct, msg);
            });
            console.log('[Splash] Offline download completed successfully');
            justDownloadedBible = true;
          } catch (err) {
            console.error('[Splash] Offline download failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);
        } else {
          console.log('[Splash] Incognito - skipping offline download');
        }

        // 3. Checking for updates - fire banner
        // Only check for SERVICE WORKER updates (Bible data was just downloaded if needed)
        setStep('CHECKING FOR UPDATES...');
        await pause(STEP_PAUSE_MS);

        // Repeat update cycles automatically until none remain, then welcome.
        if (await hasSWUpdate()) {
          await runUpdateLoop();
          console.log('[Splash] First load - update loop complete, proceeding to WELCOME');
        } else {
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 8. Welcome - fire banner (success)
        if (!detectedIncognito) {
          setStep('WELCOME TO KJB READER.', true);
        } else {
          console.log('[Splash] Incognito mode - skipping has-visited flag');
          setStep('WELCOME TO KJB READER.', true);
        }
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

        // Clear session flag - first_load flow complete
        sessionStorage.removeItem('kjb-first-load-flow');

        console.group('[Splash] Summary');
        stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
        console.groupEnd();
        onDone?.();
        return;
      }

      // === SUBSEQUENT VISIT FLOW ===
      if (!isHomeUpdate) {
        // 1. Loading (no banner)
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Download offline data if not cached (FIRE BANNER - same as first load)
        const { downloadBibleForOffline, isBibleCached } = await import('@/lib/bibleCache');
        const isActuallyCached = await isBibleCached();
        let justDownloadedBible = false;
        
        if (!detectedIncognito && !isActuallyCached) {
          setStep('DOWNLOADING OFFLINE DATA...', true);
          console.log('[Splash] Bible not cached — downloading...');
          try {
            await downloadBibleForOffline((pct, msg) => {
              console.log('[Splash] Download progress:', pct, msg);
            });
            console.log('[Splash] Offline download completed successfully');
            justDownloadedBible = true; // Mark that we just downloaded fresh data
          } catch (err) {
            console.error('[Splash] Offline download failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);
        }

        // 3. Checking for updates - ONLY if online (offline = no updates possible)
        if (navigator.onLine) {
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);

          // Detect updates (SW code, or Bible data if not just downloaded).
          let hasUpdates = await hasSWUpdate();
          if (!hasUpdates && !justDownloadedBible) {
            try {
              const { checkForUpdates } = await import('@/lib/bibleCache');
              hasUpdates = await checkForUpdates().catch(() => false);
            } catch {}
          }

          if (hasUpdates) {
            await runUpdateLoop();
            console.log('[Splash] Subsequent visit - update loop complete, proceeding to WELCOME');
          } else {
            setStep('NO UPDATES FOUND.');
            await pause(STEP_PAUSE_MS);
          }
        } else {
          // Offline - skip update check entirely, go straight to welcome
          console.log('[Splash] Offline - skipping update check');
        }

        // 8. Welcome back - fire banner (success)
        setStep('WELCOME BACK TO KJB READER.', true);
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

        console.group('[Splash] Summary');
        stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
        console.groupEnd();
        onDone?.();
        return;
      }

      // === HOME UPDATE FLOW ===
      if (isHomeUpdate) {
        // Run update cycles automatically until none remain (online only).
        if (navigator.onLine) {
          await runUpdateLoop();
          console.log('[Splash] Home update - update loop complete, proceeding to WELCOME');
        } else {
          console.log('[Splash] Home update but offline - skipping update flow');
        }

        // 5. Welcome back - fire banner (success)
        setStep('WELCOME BACK TO KJB READER.', true);
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

        console.group('[Splash] Summary');
        stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
        console.groupEnd();
        onDone?.();
        return;
      }
    })().catch((err) => {
      console.error('[Splash] Fatal error in splash flow:', err);
      // Fallback: show welcome and complete splash to prevent black screen
      setStep('WELCOME TO KJB READER.');
      setTimeout(() => {
        window.dispatchEvent(new Event('kjb-progress-clear'));
        onDone?.();
      }, 1500);
    });
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