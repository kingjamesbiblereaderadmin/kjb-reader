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
      let isFirstVisit;
      let forceUpdates = false;
      let forceHomeUpdate = false;

      if (mode === 'first_load') {
        isFirstVisit = true;
        console.log('[KJB Splash] Mode: first_load (simulated first visit)');
      } else if (mode === 'subsequent') {
        isFirstVisit = false;
        console.log('[KJB Splash] Mode: subsequent (returning user, no updates)');
      } else if (mode === 'subsequent_with_updates') {
        isFirstVisit = false;
        forceUpdates = true;
        console.log('[KJB Splash] Mode: subsequent_with_updates (simulated updates)');
      } else if (mode === 'home_update') {
        isFirstVisit = false;
        forceHomeUpdate = true;
        console.log('[KJB Splash] Mode: home_update (triggered from home page)');
      } else {
        isFirstVisit = !localStorage.getItem('kjb-has-visited-app');
        if (isFirstVisit) localStorage.setItem('kjb-has-visited-app', 'true');
        console.log('[KJB Splash] Mode: auto — isFirstVisit:', isFirstVisit);
      }

      // Step 1: Loading
      setStep('Loading…');
      await pause(STEP_PAUSE_MS);

      // Step 2 (first visit): Download offline data
      if (isFirstVisit) {
        setStep('Downloading offline data…');
        if (mode === 'auto') {
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Offline download failed:', err.message);
          }
        }
        await pause(STEP_PAUSE_MS);
      }

      // Step 3: Update check loop — re-checks after each update cycle
      const maxChecks = 3;
      let checkRound = 0;

      while (checkRound < maxChecks) {
        checkRound++;
        
        // Skip "Checking" on first iteration for home_update mode
        if (!(forceHomeUpdate && checkRound === 1)) {
          setStep('Checking for updates…');
          await pause(STEP_PAUSE_MS);
        }

        let swUpdated = false;
        let dataUpdated = false;

        if (forceUpdates) {
          swUpdated = true;
          dataUpdated = true;
          console.log('[KJB Splash] Force updates: swUpdated=true, dataUpdated=true');
        } else if (forceHomeUpdate) {
          swUpdated = true;
          console.log('[KJB Splash] Force home update: swUpdated=true');
        } else if (mode === 'auto' && navigator.onLine) {
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

        const hasUpdate = swUpdated || dataUpdated;

        if (!hasUpdate) {
          // Only show "No updates found" for auto/subsequent modes, NOT home_update
          if (!forceHomeUpdate) {
            setStep('No updates found.');
            await pause(STEP_PAUSE_MS);
          }
          break;
        }

        const updateLabel = swUpdated && dataUpdated
          ? 'Found app & data updates.'
          : dataUpdated ? 'Found data updates.' : 'Found app updates.';
        setStep(updateLabel);
        await pause(STEP_PAUSE_MS);

        setStep('Installing updates…');
        if (mode === 'auto' && dataUpdated) {
          try {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            await downloadBibleForOffline();
          } catch (err) {
            console.error('[Splash] Data install failed:', err.message);
          }
        }
        await pause(STEP_PAUSE_MS);

        setStep('Applying updates…');
        await pause(STEP_PAUSE_MS);

        if (mode === 'auto' && swUpdated && 'serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
            if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch {}
        }

        // Loop continues to re-check for more updates after applying
        if (mode !== 'auto') break;
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