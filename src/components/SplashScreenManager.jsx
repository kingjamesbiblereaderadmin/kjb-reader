import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const STEP = 8000;
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
      const ts = new Date().toLocaleTimeString('en-SG', { hour12: false });
      const entry = `${ts} ${msg}`;
      logRef.current.push(entry);
      console.log('[KJB Splash]', entry);
    };

    const emit = async (msg) => {
      if (cancelled) return;
      setText(msg);
      logEntry(msg);
      await wait(STEP);
    };

    const checkUpdates = async () => {
      if (!('serviceWorker' in navigator)) return false;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return false;
        await reg.update().catch(() => {});
        await wait(600);
        return !!(reg.waiting || (reg.installing && reg.installing.state !== 'activated'));
      } catch { return false; }
    };

    const applyUpdates = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        const target = reg.waiting || reg.installing;
        if (target) target.postMessage({ type: 'SKIP_WAITING' });
      } catch {}
    };

    const waitForReady = async () => {
      while (!isReadyRef.current && !cancelled) await wait(300);
    };

    // Runs the update loop: found → installing → applying → checking → repeat.
    // Returns true if at least one update cycle ran.
    const runUpdateLoop = async () => {
      let didUpdate = false;
      let hasUpdates = await checkUpdates();

      if (!hasUpdates) {
        await emit('No updates found');
        return didUpdate;
      }

      while (hasUpdates && !cancelled) {
        didUpdate = true;
        await emit('Found updates...');
        if (cancelled) return didUpdate;
        await emit('Installing updates...');
        if (cancelled) return didUpdate;
        emit('Applying updates...');
        await applyUpdates();
        await wait(STEP);
        if (cancelled) return didUpdate;
        await emit('Checking for updates...');
        if (cancelled) return didUpdate;
        hasUpdates = await checkUpdates();
        if (hasUpdates) continue;
        await emit('No updates found');
      }

      return didUpdate;
    };

    const printSummary = (outcomeLabel) => {
      const log = [...logRef.current];
      try {
        const prev = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
        const next = [{ at: new Date().toISOString(), log }, ...prev].slice(0, 5);
        localStorage.setItem('kjb-splash-log', JSON.stringify(next));
      } catch {}
      console.group(`[KJB Splash Summary] ${outcomeLabel} — SW: ${SW_VER} | Bible: ${getBibleVer()}`);
      log.forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
      console.groupEnd();
    };

    const finish = async (welcomeMsg, outcomeLabel) => {
      await waitForReady();
      if (cancelled) return;
      await emit(welcomeMsg);
      if (cancelled) return;
      printSummary(outcomeLabel);
      setIsFadingOut(true);
      await wait(600);
      if (cancelled) return;
      setVisible(false);
      onComplete();
    };

    // ── FLOW: First load ──────────────────────────────────────────────────────
    // Loading → Downloading offline Bible data → Checking for updates →
    // [update loop] → Welcome to KJB Reader!
    //
    // ── FLOW: Subsequent load ─────────────────────────────────────────────────
    // Loading → Checking for updates → [update loop] → Welcome back to KJB Reader!
    const runInitialFlow = async () => {
      await emit('Loading...');
      if (cancelled) return;

      if (isFirstVisit) {
        await emit('Downloading offline Bible data...');
        if (cancelled) return;
      }

      await emit('Checking for updates...');
      if (cancelled) return;

      const didUpdate = await runUpdateLoop();
      initialFlowDone.current = true;

      const welcome = isFirstVisit ? 'Welcome to KJB Reader!' : 'Welcome back to KJB Reader!';
      await finish(welcome, didUpdate ? '🔄 Updated' : '✅ No updates');
    };

    runInitialFlow();

    // ── FLOW: Tab focus ───────────────────────────────────────────────────────
    // (only fires after initial flow completes, only if updates exist)
    // Found updates → installing → applying → checking → [repeat] → Welcome back
    let tabFocusRunning = false;
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      if (cancelled || !initialFlowDone.current || tabFocusRunning) return;

      const hasUpdates = await checkUpdates();
      if (!hasUpdates) return;

      tabFocusRunning = true;
      logRef.current = [];
      setIsFadingOut(false);
      setVisible(true);

      // Tab-focus loop starts directly at "Found updates" (no Loading step)
      let currentHasUpdates = true;
      let didUpdate = false;
      while (currentHasUpdates && !cancelled) {
        didUpdate = true;
        await emit('Found updates...');
        if (cancelled) break;
        await emit('Installing updates...');
        if (cancelled) break;
        emit('Applying updates...');
        await applyUpdates();
        await wait(STEP);
        if (cancelled) break;
        await emit('Checking for updates...');
        if (cancelled) break;
        currentHasUpdates = await checkUpdates();
        if (currentHasUpdates) continue;
        await emit('No updates found');
      }

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