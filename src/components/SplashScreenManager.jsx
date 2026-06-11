import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const STEP = 5000;
const SW_VER = 'v20260611_351';

export default function SplashScreenManager({ isReady, isFirstVisit, onComplete }) {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const logRef = useRef([]);
  const isReadyRef = useRef(isReady);
  const initialFlowDone = useRef(false);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    let cancelled = false;

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    const getBibleVer = () => {
      try { return localStorage.getItem('bible_cache_version') || '(none)'; } catch { return '(none)'; }
    };

    const logEntry = (msg) => {
      const ts = new Date().toLocaleTimeString('en-SG', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const entry = `${ts} ${msg}`;
      logRef.current.push(entry);
      console.log('[KJB Splash]', entry);
    };

    const emit = (msg) => {
      if (cancelled) return;
      setText(msg);
      logEntry(msg);
    };

    const checkUpdates = async () => {
      let sw = false;
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update().catch(() => {});
            // Wait briefly for installing state to settle
            await wait(800);
            sw = !!(reg.waiting || (reg.installing && reg.installing.state !== 'activated'));
          }
        } catch {}
      }
      return sw;
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
        await wait(300);
      }
    };

    const runUpdateLoop = async () => {
      // Returns true if any updates were applied
      let didUpdate = false;
      let hasUpdates = await checkUpdates();
      while (hasUpdates && !cancelled) {
        didUpdate = true;
        emit('Found updates...');
        await wait(STEP);
        if (cancelled) return didUpdate;
        emit('Installing updates...');
        await wait(STEP);
        if (cancelled) return didUpdate;
        emit('Applying updates...');
        await applyUpdates();
        await wait(STEP);
        if (cancelled) return didUpdate;
        emit('Checking for updates...');
        await wait(STEP);
        if (cancelled) return didUpdate;
        hasUpdates = await checkUpdates();
      }
      return didUpdate;
    };

    const printSummary = (outcomeLabel) => {
      const log = [...logRef.current];
      const bv = getBibleVer();
      try {
        const prev = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
        const entry = { at: new Date().toISOString(), log };
        const next = [entry, ...prev].slice(0, 5);
        localStorage.setItem('kjb-splash-log', JSON.stringify(next));
      } catch {}

      console.group(`[KJB Splash Summary] ${outcomeLabel} — SW: ${SW_VER} | Bible: ${bv}`);
      log.forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
      console.groupEnd();
    };

    const finish = async (welcomeMsg, outcomeLabel) => {
      await waitForReady();
      if (cancelled) return;
      emit(welcomeMsg);
      await wait(STEP);
      if (cancelled) return;
      printSummary(outcomeLabel);
      setIsFadingOut(true);
      await wait(600);
      if (cancelled) return;
      setVisible(false);
      onComplete();
    };

    // ── INITIAL FLOW ─────────────────────────────────────────────────────────
    const runInitialFlow = async () => {
      emit('Loading...');
      await wait(STEP);
      if (cancelled) return;

      if (isFirstVisit) {
        emit('Downloading offline Bible data...');
        await wait(STEP);
        if (cancelled) return;
      }

      emit('Checking for updates...');
      await wait(STEP);
      if (cancelled) return;

      const didUpdate = await runUpdateLoop();

      initialFlowDone.current = true;

      const welcome = isFirstVisit ? 'Welcome to KJB Reader!' : 'Welcome back to KJB Reader!';
      const outcome = didUpdate ? '🔄 Updated' : '✅ No updates';
      await finish(welcome, outcome);
    };

    runInitialFlow();

    // ── TAB FOCUS FLOW ───────────────────────────────────────────────────────
    let tabFocusRunning = false;
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      if (cancelled) return;
      if (!initialFlowDone.current) return; // Don't interfere with initial flow
      if (tabFocusRunning) return;

      const hasUpdates = await checkUpdates();
      if (!hasUpdates) return;

      tabFocusRunning = true;
      logRef.current = [];
      setVisible(true);
      setIsFadingOut(false);

      const didUpdate = await runUpdateLoop();
      if (!cancelled) {
        await finish('Welcome back to KJB Reader!', didUpdate ? '🔄 Tab-focus updated' : '✅ No tab-focus updates');
      }
      tabFocusRunning = false;
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center -mt-16 w-full max-w-sm px-6">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <img
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png"
            alt="KJB Reader"
            className="relative w-32 h-32 object-contain drop-shadow-xl"
          />
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2
            className="w-6 h-6 animate-spin text-primary/70"
            style={{ animationDuration: '2s' }}
          />
          <span className="font-sans text-xs text-foreground/70 font-medium tracking-[0.2em] uppercase min-h-[1.2em]">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}