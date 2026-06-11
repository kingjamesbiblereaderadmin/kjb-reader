import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const STEP_PAUSE_MS = 10000;

// mode: 'auto' | 'first_load' | 'subsequent' | 'subsequent_with_updates' | 'home_update'
export default function SplashScreen({ isFadingOut, onDone, mode = 'auto' }) {
  const [currentMessage, setCurrentMessage] = useState('Loading…');
  const doneRef = useRef(false);
  const stepsLog = useRef([]);

  const setStep = (message) => {
    stepsLog.current.push(message);
    setCurrentMessage(message);
    console.log('[KJB Splash]', message);
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    (async () => {
      let isFirstVisit = false;
      let skipLoading = false;

      if (mode === 'first_load') {
        isFirstVisit = true;
        console.log('[KJB Splash] Mode: first_load');
      } else if (mode === 'subsequent_with_updates' || mode === 'home_update') {
        skipLoading = true;
        console.log('[KJB Splash] Mode:', mode, '(skip loading, start with updates)');
      } else if (mode === 'subsequent') {
        console.log('[KJB Splash] Mode: subsequent');
      } else {
        isFirstVisit = !localStorage.getItem('kjb-has-visited-app');
        if (isFirstVisit) localStorage.setItem('kjb-has-visited-app', 'true');
        console.log('[KJB Splash] Mode: auto — isFirstVisit:', isFirstVisit);
      }

      // Step 1: Loading (skip for home_update / subsequent_with_updates)
      if (!skipLoading) {
        setStep('Loading…');
        await pause(STEP_PAUSE_MS);

        // Step 2 (first visit): Download offline data
        if (isFirstVisit) {
          setStep('Downloading offline data…');
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Offline download failed:', err.message);
          }
          await pause(STEP_PAUSE_MS);
        }
      }

      // Step 3: Update check loop
      const maxChecks = 3;
      let checkRound = 0;

      while (checkRound < maxChecks) {
        checkRound++;

        // For modes starting with updates, skip first "Checking"
        if (skipLoading && checkRound === 1) {
          // Already know there are updates
        } else {
          setStep('Checking for updates…');
          await pause(STEP_PAUSE_MS);

          // Check for updates
          let swUpdated = false;
          let dataUpdated = false;
          if (navigator.onLine) {
            try {
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
                if (reg) {
                  await reg.update().catch(() => {});
                  swUpdated = !!(reg.waiting || reg.installing);
                }
              }
              const { checkForUpdates } = await import('@/lib/bibleCache');
              dataUpdated = await checkForUpdates().catch(() => false);
            } catch {}
          }

          if (!swUpdated && !dataUpdated) {
            setStep('No updates found.');
            await pause(STEP_PAUSE_MS);
            break;
          }
        }

        setStep('Found app updates.');
        await pause(STEP_PAUSE_MS);

        setStep('Installing updates…');
        try {
          const { downloadBibleForOffline } = await import('@/lib/bibleCache');
          await downloadBibleForOffline();
        } catch (err) {
          console.error('[Splash] Data install failed:', err.message);
        }
        await pause(STEP_PAUSE_MS);

        setStep('Applying updates…');
        await pause(STEP_PAUSE_MS);

        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
            if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch {}
        }
      }

      // Step 4: Welcome
      const welcomeMsg = isFirstVisit ? 'Welcome to KJB Reader.' : 'Welcome back to KJB Reader.';
      setStep(welcomeMsg);
      await pause(STEP_PAUSE_MS);

      console.group('[Splash] Summary');
      stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
      console.groupEnd();

      onDone?.();
    })();
  }, []);

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