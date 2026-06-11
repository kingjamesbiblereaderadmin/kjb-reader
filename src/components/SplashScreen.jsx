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
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    (async () => {
      let isFirstVisit;
      let forceUpdates = false;
      let forceHomeUpdate = false;

      if (mode === 'first_load') {
        isFirstVisit = true;
      } else if (mode === 'subsequent') {
        isFirstVisit = false;
      } else if (mode === 'subsequent_with_updates') {
        isFirstVisit = false;
        forceUpdates = true;
      } else if (mode === 'home_update') {
        isFirstVisit = false;
        forceHomeUpdate = true;
      } else {
        isFirstVisit = !localStorage.getItem('kjb-has-visited-app');
        if (isFirstVisit) localStorage.setItem('kjb-has-visited-app', 'true');
      }

      // Step 1: Loading
      setStep('Loading…');
      await pause(STEP_PAUSE_MS);

      // Step 2 (first visit): Download Bible
      if (isFirstVisit) {
        setStep('Downloading offline Bible data…');
        if (mode === 'auto') {
          try {
            const { isBibleCached, downloadBibleForOffline } = await import('@/lib/bibleCache');
            const cached = await isBibleCached().catch(() => false);
            if (!cached && navigator.onLine) {
              await downloadBibleForOffline().catch(() => {});
            }
          } catch {}
        }
        await pause(STEP_PAUSE_MS);
      }

      // Step 3: Update check loop
      const maxChecks = 3;
      let checkRound = 0;

      while (checkRound < maxChecks) {
        checkRound++;
        setStep('Checking for updates…');
        await pause(STEP_PAUSE_MS);

        let swUpdated = false;
        let bibleNeedsUpdate = false;

        if (forceUpdates) {
          swUpdated = true;
          bibleNeedsUpdate = true;
        } else if (forceHomeUpdate) {
          swUpdated = true;
        } else if (mode === 'auto' && navigator.onLine) {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
              if (reg) {
                await reg.update().catch(() => {});
                swUpdated = !!(reg.waiting || reg.installing);
              }
            }
          } catch {}
          try {
            const { checkForUpdates } = await import('@/lib/bibleCache');
            bibleNeedsUpdate = await checkForUpdates().catch(() => false);
          } catch {}
        }

        const hasUpdate = swUpdated || bibleNeedsUpdate;

        if (!hasUpdate) {
          setStep('No updates found.');
          await pause(STEP_PAUSE_MS);
          break;
        }

        const updateLabel = swUpdated && bibleNeedsUpdate
          ? 'Found app & Bible updates.'
          : bibleNeedsUpdate ? 'Found Bible data updates.' : 'Found app updates.';
        setStep(updateLabel);
        await pause(STEP_PAUSE_MS);

        setStep('Installing updates…');
        if (mode === 'auto') {
          try {
            if (bibleNeedsUpdate) {
              const { downloadBibleForOffline } = await import('@/lib/bibleCache');
              localStorage.removeItem('bible_cache_version');
              localStorage.removeItem('bible_last_refresh');
              await downloadBibleForOffline().catch(() => {});
            }
          } catch {}
        }
        await pause(STEP_PAUSE_MS);

        setStep('Applying updates…');
        await pause(STEP_PAUSE_MS);

        if (mode === 'auto' && swUpdated && 'serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
            sessionStorage.setItem('kjb_sw_updated', 'app');
            if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch {}
        }

        if (mode !== 'auto') break;
      }

      // Step 4: Welcome
      const welcomeMsg = isFirstVisit ? 'Welcome to KJB Reader.' : 'Welcome back to KJB Reader.';
      setStep(welcomeMsg);
      await pause(STEP_PAUSE_MS);

      // Console summary
      console.group('[KJB Splash] Summary');
      stepsLog.current.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
      console.groupEnd();

      onDone?.();
    })();
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-8 -mt-16">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <img
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png"
            alt="KJB Reader"
            className="relative w-28 h-28 object-contain drop-shadow-xl"
          />
        </div>

        {/* Spinner + updating text */}
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary/60" style={{ animationDuration: '1.5s' }} />
          <span className="font-sans text-sm text-foreground/70 tracking-wide transition-all duration-300">
            {currentMessage}
          </span>
        </div>
      </div>
    </div>
  );
}