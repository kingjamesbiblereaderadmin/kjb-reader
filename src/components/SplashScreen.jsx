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
      
      // Trust the mode passed from App.jsx — it already checked flags and SW state
      let isHomeUpdate = mode === 'home_update';
      let isFirstVisit = mode === 'first_load';
      
      // In incognito mode, ALWAYS treat as first load (storage doesn't persist)
      // This prevents "WELCOME BACK" from showing in private windows
      if (detectedIncognito) {
        console.log('[Splash] Incognito detected — forcing first_load behavior');
        isFirstVisit = true;
        isHomeUpdate = false;
      }
      
      console.log('[Splash] Mode from App.jsx:', mode, { isFirstVisit, isHomeUpdate, detectedIncognito });

      // Set has-visited flag for subsequent visits (not home updates, which already have it)
      if (!isFirstVisit && !isHomeUpdate && !detectedIncognito) {
        localStorage.setItem('kjb-has-visited-app', 'true');
      }

      // === FIRST LOAD FLOW ===
      if (isFirstVisit) {
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Downloading offline data if not cached - FIRE BANNER
        // Always show this step in first_load, but skip actual download in incognito
        const { downloadBibleForOffline, isBibleCached } = await import('@/lib/bibleCache');
        const isActuallyCached = await isBibleCached();
        
        setStep('DOWNLOADING OFFLINE DATA...', true);
        if (!detectedIncognito && !isActuallyCached) {
          console.log('[Splash] Starting offline download...');
          try {
            await downloadBibleForOffline((pct, msg) => {
              console.log('[Splash] Download progress:', pct, msg);
            });
            console.log('[Splash] Offline download completed successfully');
          } catch (err) {
            console.error('[Splash] Offline download failed:', err.message);
          }
        } else if (detectedIncognito) {
          console.log('[Splash] Incognito mode detected — skipping download (storage not persistent)');
        } else {
          console.log('[Splash] Bible already cached — skipping download');
        }
        await pause(STEP_PAUSE_MS);

        // 3. Checking for updates - FIRE BANNER
        setStep('CHECKING FOR UPDATES...', true);
        await pause(STEP_PAUSE_MS);

        // Check for updates
        let hasUpdates = false;
        if (navigator.onLine) {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                // Only count as update if there's a WAITING worker (newer version found)
                // reg.installing on first load is just initial install, not an update
                hasUpdates = !!reg.waiting;
              }
            }
            if (!hasUpdates) {
              const { checkForUpdates } = await import('@/lib/bibleCache');
              hasUpdates = await checkForUpdates().catch(() => false);
            }
          } catch {}
        }

        if (hasUpdates) {
          // 4. Found updates - FIRE BANNER
          setStep('FOUND UPDATES.', true);
          await pause(STEP_PAUSE_MS);

          // 5. Installing updates - FIRE BANNER
          setStep('INSTALLING UPDATES...', true);
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);

          // 6. Applying updates - FIRE BANNER
          setStep('APPLYING UPDATES...', true);
          await pause(STEP_PAUSE_MS);

          // Activate service worker
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }

          // 7. Check again (loop) - no banner
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
        } else {
          // No updates
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 8. Welcome - FIRE BANNER (success)
        if (detectedIncognito) {
          setStep('WELCOME.', true);
        } else {
          setStep('WELCOME TO KJB READER.', true);
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

        // 2. Checking for updates (no banner)
        setStep('CHECKING FOR UPDATES...');
        await pause(STEP_PAUSE_MS);

        let hasUpdates = false;
        if (navigator.onLine) {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                // Only count as update if there's a WAITING worker (newer version found)
                // reg.installing on first load is just initial install, not an update
                hasUpdates = !!reg.waiting;
              }
            }
            if (!hasUpdates) {
              const { checkForUpdates } = await import('@/lib/bibleCache');
              hasUpdates = await checkForUpdates().catch(() => false);
            }
          } catch {}
        }

        if (hasUpdates) {
          // 3. Found updates - FIRE BANNER
          setStep('FOUND UPDATES.', true);
          await pause(STEP_PAUSE_MS);

          // 4. Installing updates - FIRE BANNER
          setStep('INSTALLING UPDATES...', true);
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);

          // 5. Applying updates - FIRE BANNER
          setStep('APPLYING UPDATES...', true);
          await pause(STEP_PAUSE_MS);

          // Activate service worker
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }

          // 6. Check again (loop if more updates) - no banner
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
        } else {
          // No updates
          setStep('NO UPDATES FOUND.');
          await pause(STEP_PAUSE_MS);
        }

        // 7. Welcome back - FIRE BANNER (success)
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
        // Set has-visited flag
        localStorage.setItem('kjb-has-visited-app', 'true');
        // 1. Found updates (skip loading/checking) - FIRE BANNER
        setStep('FOUND UPDATES.', true);
        await pause(STEP_PAUSE_MS);

        // 2. Installing updates - FIRE BANNER
        setStep('INSTALLING UPDATES...', true);
        try {
          const { downloadBibleForOffline } = await import('@/lib/bibleCache');
          await downloadBibleForOffline();
        } catch (err) {
          console.error('[Splash] Data install failed:', err.message);
        }
        await pause(STEP_PAUSE_MS);

        // 3. Applying updates - FIRE BANNER
        setStep('APPLYING UPDATES...', true);
        await pause(STEP_PAUSE_MS);

        // Activate service worker
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
            if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch {}
        }

        // 4. Checking for updates (repeat if found) - no banner
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
          // Loop: Found → Installing → Applying → Checking - FIRE BANNERS
          setStep('FOUND UPDATES.', true);
          await pause(STEP_PAUSE_MS);
          setStep('INSTALLING UPDATES...', true);
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);
          setStep('APPLYING UPDATES...', true);
          await pause(STEP_PAUSE_MS);
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } catch {}
          }
          // Check again after applying - no banner
          setStep('CHECKING FOR UPDATES...');
          await pause(STEP_PAUSE_MS);
        }

        // 5. Welcome back - FIRE BANNER (success)
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