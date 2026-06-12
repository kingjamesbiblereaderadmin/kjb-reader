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

          // Activate service worker (triggers reload to get new code)
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }

          // Final check for chained updates
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
          let hasMoreUpdates = false;
          if (navigator.onLine && 'serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                hasMoreUpdates = !!reg.waiting;
              }
            } catch {}
          }
          if (hasMoreUpdates) {
            // Found chained update — trigger reload to restart the splash flow from beginning
            console.log('[Splash] Chained update found — reloading to restart splash flow');
            sessionStorage.setItem('kjb-first-load-flow', 'true');
            setTimeout(() => {
              window.location.href = window.location.pathname + '?refresh=' + Date.now();
            }, 500);
            return; // Don't continue to WELCOME
          }
          console.log('[Splash] First load - no more updates, proceeding to WELCOME');
        } else {
          // No updates - fire banner
          setStep('NO UPDATES FOUND.', true);
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

          // Check for service worker code updates only
          let hasUpdates = false;
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

            // Activate service worker (triggers reload to get new code)
            if ('serviceWorker' in navigator) {
              try {
                const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
                if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              } catch {}
            }

            // Final check for chained updates
            setStep('CHECKING FOR UPDATES...');
            await pause(STEP_PAUSE_MS);
            let hasMoreUpdates = false;
            if (navigator.onLine && 'serviceWorker' in navigator) {
              try {
                const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
                if (reg) {
                  await reg.update().catch(() => {});
                  hasMoreUpdates = !!reg.waiting;
                }
              } catch {}
            }
            if (hasMoreUpdates) {
              // Found chained update — trigger reload to restart the splash flow from beginning
              console.log('[Splash] Chained update found — reloading to restart splash flow');
              setTimeout(() => {
                window.location.href = window.location.pathname + '?refresh=' + Date.now();
              }, 500);
              return; // Don't continue to WELCOME
            }
            console.log('[Splash] Subsequent visit - no more updates, proceeding to WELCOME');
          } else {
            // No updates - fire banner
            setStep('NO UPDATES FOUND.', true);
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
        // Only proceed with update flow if online
        if (navigator.onLine) {
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

          // Activate service worker (triggers reload to get new code)
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }

          // Final check for chained updates
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
          let hasMoreUpdates = false;
          if (navigator.onLine && 'serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                hasMoreUpdates = !!reg.waiting;
              }
            } catch {}
          }
          if (hasMoreUpdates) {
            // Found chained update — trigger reload to restart the splash flow
            console.log('[Splash] Home update - chained update found, reloading to restart splash flow');
            localStorage.setItem('kjb-splash-home-update', 'true');
            sessionStorage.setItem('kjb-splash-home-update', 'true');
            setTimeout(() => {
              window.location.href = window.location.pathname + '?refresh=' + Date.now();
            }, 500);
            return; // Don't continue to WELCOME
          }
          console.log('[Splash] Home update - no more updates, proceeding to WELCOME');
        } else {
          // Offline - skip update flow entirely
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