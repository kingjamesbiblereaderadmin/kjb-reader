import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const STEP = 10000;
const SW_VER = 'v20260611_351';
const CURRENT_BIBLE_VERSION = 'v20260611_340';

export default function SplashScreenManager({ isReady, isFirstVisit, onComplete }) {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const logRef = useRef([]);
  const isReadyRef = useRef(isReady);
  const flowRunning = useRef(false);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    if (flowRunning.current) return;
    flowRunning.current = true;

    let cancelled = false;

    const logEntry = (msg) => {
      const ts = new Date().toISOString().slice(11, 23);
      logRef.current.push(`${ts} ${msg}`);
      console.log('[KJB Splash]', msg);
    };

    const emit = (msg) => {
      if (cancelled) return;
      setText(msg);
      logEntry(msg);
    };

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    const checkUpdates = async () => {
      let sw = false;
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update().catch(() => {});
            sw = !!(reg.waiting || reg.installing);
          }
        } catch {}
      }
      let bible = false;
      try {
        const local = localStorage.getItem('bible_cache_version');
        bible = local && local !== CURRENT_BIBLE_VERSION;
      } catch {}
      return sw || bible;
    };

    const applyUpdates = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const target = reg.waiting || reg.installing;
            if (target) target.postMessage({ type: 'SKIP_WAITING' });
          }
        } catch {}
      }
    };

    const waitForReady = async () => {
      while (!isReadyRef.current && !cancelled) {
        await wait(500);
      }
    };

    const getBibleVer = () => { try { return localStorage.getItem('bible_cache_version') || '(none)'; } catch { return '(none)'; } };

    const saveAndPrintSummary = (outcomeMsg) => {
      logEntry(outcomeMsg);
      try {
        const prev = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
        const next = [{ at: new Date().toISOString(), log: [...logRef.current] }, ...prev].slice(0, 5);
        localStorage.setItem('kjb-splash-log', JSON.stringify(next));

        const allRuns = next;
        const current = allRuns[0];
        const hasError = current.log.some(l => l.includes('❌'));
        const hasUpdate = current.log.some(l => l.includes('Found updates') || l.includes('Applying'));
        const outcome = hasError ? '❌ Error' : hasUpdate ? '🔄 Updated' : '✅ No updates';
        
        console.group(`[KJB Splash Summary] App loaded — ${outcome} — SW: ${SW_VER} | Bible: ${getBibleVer()}`);
        current.log.forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
        if (allRuns.length > 1) {
          console.groupCollapsed(`Previous ${allRuns.length - 1} run(s)`);
          allRuns.slice(1).forEach((run, i) => {
            const e = run.log.some(l => l.includes('❌'));
            const u = run.log.some(l => l.includes('Found updates') || l.includes('Applying'));
            const ro = e ? '❌' : u ? '🔄' : '✅';
            console.groupCollapsed(`Run -${i + 1} [${ro}] — ${run.at}`);
            run.log.forEach((l, j) => console.log(`  ${j + 1}. ${l}`));
            console.groupEnd();
          });
          console.groupEnd();
        }
        console.groupEnd();
      } catch {}
    };

    const finishFlow = async (welcomeMsg, outcomeMsg) => {
      await waitForReady();
      if (cancelled) return;
      emit(welcomeMsg);
      await wait(STEP);
      if (cancelled) return;
      
      saveAndPrintSummary(outcomeMsg);
      
      setIsFadingOut(true);
      await wait(600);
      if (cancelled) return;
      setVisible(false);
      onComplete();
    };

    const runInitialFlow = async () => {
      emit('Loading...');
      await wait(STEP);

      if (isFirstVisit) {
        emit('Downloading offline Bible data...');
        await wait(STEP);
      }

      emit('Checking for updates...');
      await wait(STEP);

      let hasUpdates = await checkUpdates();

      while (hasUpdates && !cancelled) {
        emit('Found updates...');
        await wait(STEP);
        emit('Installing updates...');
        await wait(STEP);
        emit('Applying updates...');
        await applyUpdates();
        await wait(STEP);
        emit('Checking for updates...');
        await wait(STEP); 
        hasUpdates = await checkUpdates();
      }

      if (!cancelled) {
        emit('No updates found');
        await wait(STEP);
        await finishFlow(
          isFirstVisit ? 'Welcome to KJB Reader!' : 'Welcome back to KJB Reader!',
          `✅ Load complete — SW: ${SW_VER} | Bible: ${getBibleVer()}`
        );
      }
    };

    runInitialFlow();

    // Tab Focus Logic
    let applyingTabFocus = false;
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible' || cancelled) return;
      if (visible) return; // Don't trigger if splash is already showing
      if (applyingTabFocus) return;

      const hasUpdates = await checkUpdates();
      if (hasUpdates) {
        applyingTabFocus = true;
        setVisible(true);
        setIsFadingOut(false);
        logRef.current = []; 

        let currentHasUpdates = hasUpdates;
        while (currentHasUpdates && !cancelled) {
          emit('Found updates...');
          await wait(STEP);
          emit('Installing updates...');
          await wait(STEP);
          emit('Applying updates...');
          await applyUpdates();
          await wait(STEP);
          emit('Checking for updates...');
          await wait(STEP);
          currentHasUpdates = await checkUpdates();
        }

        if (!cancelled) {
          emit('No updates found');
          await wait(STEP);
          await finishFlow(
            'Welcome back to KJB Reader!',
            `✅ Tab-focus update complete — SW: ${SW_VER} | Bible: ${getBibleVer()}`
          );
        }
        applyingTabFocus = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []); // Empty deps because we use refs for dynamic values to avoid re-running the flow

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[999999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col items-center justify-center -mt-16 w-full max-w-sm px-6">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <img 
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" 
            alt="KJB Reader" 
            className="relative w-32 h-32 object-contain drop-shadow-xl"
          />
        </div>
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/70" style={{ animationDuration: '2s' }} />
            <span className="font-sans text-xs text-foreground/70 font-medium tracking-[0.2em] uppercase">
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}