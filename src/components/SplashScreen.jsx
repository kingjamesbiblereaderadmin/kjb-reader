import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Info } from 'lucide-react';

// Each step: { message, status: 'loading'|'done'|'error'|'info' }

const STEP_PAUSE_MS = 10000; // 10 second pause per step as requested

function StepIcon({ status }) {
  if (status === 'loading') return <Loader2 className="w-4 h-4 animate-spin text-primary/70 flex-shrink-0" style={{ animationDuration: '2s' }} />;
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === 'error') return <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />;
  if (status === 'info') return <Info className="w-4 h-4 text-primary/60 flex-shrink-0" />;
  return null;
}

export default function SplashScreen({ isFadingOut, onDone }) {
  const [steps, setSteps] = useState([]);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome to KJB Reader');
  const doneRef = useRef(false);

  const addStep = (message, status = 'loading') => {
    setSteps(prev => [...prev, { message, status, id: Date.now() + Math.random() }]);
  };

  const resolveLastStep = (status = 'done') => {
    setSteps(prev => {
      const copy = [...prev];
      if (copy.length > 0) copy[copy.length - 1] = { ...copy[copy.length - 1], status };
      return copy;
    });
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    (async () => {
      const isFirstVisit = !localStorage.getItem('kjb-has-visited-app');
      const isSubsequent = !isFirstVisit;

      // Mark visited
      if (isFirstVisit) localStorage.setItem('kjb-has-visited-app', 'true');

      // ── STEP 1: Loading ──
      addStep('Loading…', 'loading');
      await pause(STEP_PAUSE_MS);
      resolveLastStep('done');

      // ── STEP 2 (first load only): Downloading offline Bible data ──
      if (isFirstVisit) {
        addStep('Downloading offline Bible data…', 'loading');
        try {
          const { isBibleCached, downloadBibleForOffline } = await import('@/lib/bibleCache');
          const cached = await isBibleCached().catch(() => false);
          if (!cached && navigator.onLine) {
            await downloadBibleForOffline().catch(() => {});
          }
        } catch {}
        await pause(STEP_PAUSE_MS);
        resolveLastStep('done');
      }

      // ── STEP 3: Checking for updates (loop) ──
      let foundAnyUpdate = false;
      let checkRound = 0;
      const maxChecks = 3;

      while (checkRound < maxChecks) {
        checkRound++;
        addStep('Checking for updates…', 'loading');
        await pause(STEP_PAUSE_MS);

        let swUpdated = false;
        let bibleNeedsUpdate = false;

        if (navigator.onLine) {
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
          resolveLastStep('done');
          addStep('No updates found.', 'info');
          await pause(STEP_PAUSE_MS);
          resolveLastStep('info');
          break; // exit loop — no more to check
        }

        // Found updates
        resolveLastStep('done');
        foundAnyUpdate = true;

        const updateLabel = swUpdated && bibleNeedsUpdate
          ? 'Found app & Bible updates.'
          : bibleNeedsUpdate ? 'Found Bible data updates.' : 'Found app updates.';
        addStep(updateLabel, 'loading');
        await pause(STEP_PAUSE_MS);
        resolveLastStep('done');

        // Installing
        addStep('Installing updates…', 'loading');
        try {
          if (bibleNeedsUpdate) {
            const { downloadBibleForOffline } = await import('@/lib/bibleCache');
            localStorage.removeItem('bible_cache_version');
            localStorage.removeItem('bible_last_refresh');
            await downloadBibleForOffline().catch(() => {});
          }
        } catch {}
        await pause(STEP_PAUSE_MS);
        resolveLastStep('done');

        // Applying
        addStep('Applying updates…', 'loading');
        await pause(STEP_PAUSE_MS);
        resolveLastStep('done');

        // Activate SW if needed
        if (swUpdated && 'serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
            sessionStorage.setItem('kjb_sw_updated', 'app');
            if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch {}
        }

        // Loop back to check again (up to maxChecks)
      }

      // ── STEP 4: Welcome ──
      const welcomeMsg = isSubsequent ? 'Welcome back to KJB Reader.' : 'Welcome to KJB Reader.';
      setWelcomeMessage(welcomeMsg);
      addStep(welcomeMsg, 'loading');
      await pause(STEP_PAUSE_MS);
      resolveLastStep('done');

      // ── Show summary ──
      setSummaryVisible(true);
      await pause(STEP_PAUSE_MS);

      // Done — signal parent to reveal the app
      onDone?.();
    })();
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center w-full max-w-sm px-6 -mt-8">
        {/* Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <img
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png"
            alt="KJB Reader"
            className="relative w-24 h-24 object-contain drop-shadow-xl"
          />
        </div>

        {/* Steps list */}
        <div className="w-full space-y-2 mb-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 text-sm">
              <StepIcon status={step.status} />
              <span className={`font-sans ${
                step.status === 'done' ? 'text-foreground/50 line-through' :
                step.status === 'info' ? 'text-foreground/60' :
                step.status === 'error' ? 'text-destructive' :
                'text-foreground/80'
              }`}>{step.message}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        {summaryVisible && (
          <div className="w-full mt-4 rounded-xl border border-border bg-card p-4">
            <p className="font-sans text-xs font-semibold text-foreground/60 uppercase tracking-widest mb-3">Summary</p>
            <div className="space-y-1.5">
              {steps.map((step) => (
                <div key={step.id + '-s'} className="flex items-center gap-2 text-xs">
                  <StepIcon status={step.status === 'loading' ? 'done' : step.status} />
                  <span className="text-foreground/70">{step.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}