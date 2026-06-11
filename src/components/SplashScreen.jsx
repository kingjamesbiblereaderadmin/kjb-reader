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
        // Set flag IMMEDIATELY so it survives any SW-triggered reloads during the flow
        if (!detectedIncognito) {
          localStorage.setItem('kjb-has-visited-app', 'true');
        }
        
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Downloading offline data if not cached - fire banner
        const { downloadBibleForOffline, isBibleCached } = await import('@/lib/bibleCache');
        const isActuallyCached = await isBibleCached();
        let justDownloadedBible = false;
        
        if (!detectedIncognito && !isActuallyCached) {
          setStep('DOWNLOADING OFFLINE DATA...', true);
          console.log('[Splash] Starting offline download...');
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
        } else {
          console.log('[Splash] Skipping offline download (incognito or already cached)');
        }

        // 3. Checking for updates - fire banner
        // Only check for SERVICE WORKER updates (Bible data was just downloaded if needed)
        setStep('CHECKING FOR UPDATES...');
        await pause(STEP_PAUSE_MS);

        // Check for service worker code updates only
        let hasUpdates = false;
        if (navigator.onLine && 'serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
            if (reg) {
              await reg.update().catch(() => {});
              // Only count as update if there's a WAITING worker (newer version found)
              hasUpdates = !!reg.waiting;
            }
          } catch {}
        }

        if (hasUpdates) {
          // 4. Found updates - fire banner
          setStep('FOUND UPDATES.', true);
          await pause(STEP_PAUSE_MS);

          // 5. Installing updates - fire banner
          setStep('INSTALLING UPDATES...', true);
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);

          // 6. Applying updates - fire banner
          setStep('APPLYING UPDATES...', true);
          await pause(STEP_PAUSE_MS);

          // Activate service worker
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }

          // 7. Final check - no banner, no loop on first_load
          // Skip re-checking to prevent infinite reload loop on fresh installs
          console.log('[Splash] First load - skipping update re-check to prevent loop');
        } else {
          // No updates - fire banner
          setStep('NO UPDATES FOUND.', true);
          await pause(STEP_PAUSE_MS);
        }

        // 8. Welcome - fire banner (success)
        // Flag was already set at start of first_load (survives reloads)
        if (!detectedIncognito) {
          setStep('WELCOME TO KJB READER.', true);
        } else {
          console.log('[Splash] Incognito mode - skipping has-visited flag');
          setStep('WELCOME.', true);
        }
        await pause(STEP_PAUSE_MS);
        window.dispatchEvent(new Event('kjb-progress-clear'));

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

        // 3. Checking for updates (no banner - checking silently)
        // Only check for SERVICE WORKER updates, NOT Bible data (we just downloaded it if needed)
        setStep('CHECKING FOR UPDATES...');
        await pause(STEP_PAUSE_MS);

        // Check for service worker code updates only
        let hasUpdates = false;
        if (navigator.onLine) {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                hasUpdates = !!reg.waiting;
              }
            }
            // Skip Bible data update check if we just downloaded fresh data
            if (!hasUpdates && !justDownloadedBible) {
              const { checkForUpdates } = await import('@/lib/bibleCache');
              hasUpdates = await checkForUpdates().catch(() => false);
            }
          } catch {}
        }

        if (hasUpdates) {
          // 4. Found updates - fire banner
          setStep('FOUND UPDATES.', true);
          await pause(STEP_PAUSE_MS);

          // 5. Installing updates - fire banner
          setStep('INSTALLING UPDATES...', true);
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);

          // 6. Applying updates - fire banner
          setStep('APPLYING UPDATES...', true);
          await pause(STEP_PAUSE_MS);

          // Activate service worker
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }

          // 7. Final check - no banner, no loop on subsequent visits
          // Skip re-checking to prevent infinite reload loop
          console.log('[Splash] Subsequent visit - skipping update re-check to prevent loop');
        } else {
          // No updates - fire banner
          setStep('NO UPDATES FOUND.', true);
          await pause(STEP_PAUSE_MS);
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
        // 1. Found updates - fire banner
        setStep('FOUND UPDATES.', true);
        await pause(STEP_PAUSE_MS);

        // 2. Installing updates - fire banner
        setStep('INSTALLING UPDATES...', true);
        try {
          const { downloadBibleForOffline } = await import('@/lib/bibleCache');
          await downloadBibleForOffline();
        } catch (err) {
          console.error('[Splash] Data install failed:', err.message);
        }
        await pause(STEP_PAUSE_MS);

        // 3. Applying updates - fire banner
        setStep('APPLYING UPDATES...', true);
        await pause(STEP_PAUSE_MS);

        // Activate service worker
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
            if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch {}
        }

        // 4. Final check - no banner, no loop on home updates
        // Skip re-checking to prevent infinite reload loop
        console.log('[Splash] Home update - skipping update re-check to prevent loop');

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