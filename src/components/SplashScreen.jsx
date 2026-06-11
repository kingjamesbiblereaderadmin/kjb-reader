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
    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message, status: 'loading' } }));
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    if (!isVisible || doneRef.current) return;
    doneRef.current = true;

    (async () => {
      // Wait for incognito detection to complete before starting splash flow
      const detectedIncognito = await detectIncognito();
      setIsIncognito(detectedIncognito);
      
      let isFirstVisit = mode === 'first_load';
      let isHomeUpdate = mode === 'home_update';
      
      console.log('[KJB Splash] Mode:', mode, 'Incognito:', detectedIncognito);

      // Set has-visited flag for subsequent visits
      if (!isFirstVisit && !isHomeUpdate) {
        localStorage.setItem('kjb-has-visited-app', 'true');
      }

      // === FIRST LOAD FLOW ===
      if (isFirstVisit) {
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Check if Bible is already cached (use localStorage version check for reliability)
        const { downloadBibleForOffline } = await import('@/lib/bibleCache');
        const cachedVersion = localStorage.getItem('bible_cache_version');
        const alreadyCached = !!cachedVersion;
        
        if (!detectedIncognito && !alreadyCached) {
          // 2. Downloading offline data (only if not already cached)
          setStep('DOWNLOADING OFFLINE DATA...');
          try {
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Offline download failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);
        } else if (detectedIncognito) {
          console.log('[Splash] Incognito mode detected — skipping offline download');
        } else {
          console.log('[Splash] Bible already cached (version:', cachedVersion, ') — skipping download');
        }

        // 3. Checking for updates
        setStep('CHECKING FOR UPDATES...');
        await pause(STEP_PAUSE_MS);

        // Check for updates
        let hasUpdates = false;
        if (navigator.onLine) {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                hasUpdates = !!(reg.waiting || reg.installing);
              }
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

          // Activate service worker
          if ('serviceWorker' in navigator) {
            try {
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
          setStep('WELCOME (PRIVATE MODE).');
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'WELCOME (PRIVATE MODE).', status: 'success' } }));
        } else {
          setStep('WELCOME TO KJB READER.');
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'WELCOME TO KJB READER.', status: 'success' } }));
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
        // 1. Loading
        setStep('LOADING KJB READER...');
        await pause(STEP_PAUSE_MS);

        // 2. Checking for updates
        setStep('CHECKING FOR UPDATES...');
        await pause(STEP_PAUSE_MS);

        let hasUpdates = false;
        if (navigator.onLine) {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                hasUpdates = !!(reg.waiting || reg.installing);
              }
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

          // Activate service worker
          if ('serviceWorker' in navigator) {
            try {
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
        onDone?.();
        return;
      }

      // === HOME UPDATE FLOW ===
      if (isHomeUpdate) {
        // Set has-visited flag
        localStorage.setItem('kjb-has-visited-app', 'true');
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

        // Activate service worker
        if ('serviceWorker' in navigator) {
          try {
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