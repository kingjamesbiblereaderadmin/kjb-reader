import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const APP_NAME = 'KJB Reader';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';
const FIRST_VISIT_KEY = 'kjb_has_visited';
const DATA_VERSION_KEY = 'kjb_data_version';
const STEP_MS = 10000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isFirstVisit() {
  try { return !localStorage.getItem(FIRST_VISIT_KEY); } catch { return false; }
}

function markVisited() {
  try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
}

async function getSwReg() {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.getRegistration(); } catch { return null; }
}

// Check for service worker updates
async function checkForSwUpdate() {
  const reg = await getSwReg();
  if (!reg) return false;
  
  if (reg.waiting || reg.installing) {
    return true;
  }
  
  try { await reg.update(); } catch {}
  await new Promise(r => setTimeout(r, 500));
  
  return !!(reg.waiting || reg.installing);
}

// Check for data version updates
function checkForDataUpdate() {
  try {
    const localVersion = localStorage.getItem(DATA_VERSION_KEY);
    const remoteVersion = window.kjbRemoteDataVersion;
    
    if (!remoteVersion) return false;
    if (!localVersion) return true;
    
    return localVersion !== remoteVersion;
  } catch {
    return false;
  }
}

// Download offline data
async function downloadOfflineData() {
  try {
    const { getBibleData } = await import('@/lib/bibleCache');
    await getBibleData();
  } catch {}
}

// Install updates (service worker)
async function installUpdates() {
  try {
    const reg = await getSwReg();
    if (reg?.waiting || reg?.installing) {
      // Signal that installation is in progress
      console.log('[Splash] Updates ready to install');
    }
  } catch {}
}

// Apply updates (activate service worker)
async function applyUpdates() {
  try {
    const reg = await getSwReg();
    const target = reg?.waiting || reg?.installing;
    if (!target) return;
    
    target.postMessage({ type: 'SKIP_WAITING' });
    
    await new Promise((resolve) => {
      const onCtrl = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onCtrl);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onCtrl);
      setTimeout(resolve, 3000);
    });
  } catch {}
}

// Detect scenario based on update status
async function detectScenario() {
  // 1. SERVICE WORKER UPDATE CHECK (highest priority)
  const hasSwUpdate = await checkForSwUpdate();
  if (hasSwUpdate) {
    console.log('[Splash] Detected: home_update (SW update found)');
    return 'home_update';
  }
  
  // 2. DATA VERSION CHECK (second priority)
  const hasDataUpdate = checkForDataUpdate();
  if (hasDataUpdate) {
    console.log('[Splash] Detected: subsequent_with_updates (data version mismatch)');
    return 'subsequent_with_updates';
  }
  
  // 3. FIRST VISIT CHECK (third priority)
  if (isFirstVisit()) {
    console.log('[Splash] Detected: first_load (first visit)');
    return 'first_load';
  }
  
  // 4. DEFAULT (no updates, returning user)
  console.log('[Splash] Detected: subsequent (returning user, no updates)');
  return 'subsequent';
}

// Define step sequences for each scenario
const SCENARIOS = {
  first_load: [
    { text: 'Loading…' },
    { text: 'Downloading offline data…', effect: downloadOfflineData },
    { text: 'Checking for updates…' },
    { text: 'No updates found.' },
    { text: `Welcome to ${APP_NAME}.` }
  ],
  subsequent: [
    { text: 'Loading…' },
    { text: 'Checking for updates…' },
    { text: 'No updates found.' },
    { text: `Welcome back to ${APP_NAME}.` }
  ],
  subsequent_with_updates: [
    { text: 'Loading…' },
    { text: 'Checking for updates…' },
    { text: 'Found app & data updates.' },
    { text: 'Installing updates…', effect: installUpdates },
    { text: 'Applying updates…', effect: applyUpdates },
    { text: `Welcome back to ${APP_NAME}.` }
  ],
  home_update: [
    { text: 'Loading…' },
    { text: 'Checking for updates…' },
    { text: 'Found app updates.' },
    { text: 'Installing updates…', effect: installUpdates },
    { text: 'Applying updates…', effect: applyUpdates },
    { text: `Welcome back to ${APP_NAME}.` }
  ]
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SplashScreen({ isFadingOut, onDone, mode = 'auto' }) {
  const [statusText, setStatusText] = useState('Loading…');
  const [currentStep, setCurrentStep] = useState(0);
  const doneRef = useRef(false);
  const logRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      logRef.current = [];
      
      // Determine scenario
      let scenario = mode;
      if (mode === 'auto') {
        scenario = await detectScenario();
      }
      
      // Mark as visited if first load
      if (scenario === 'first_load') {
        markVisited();
      }
      
      const steps = SCENARIOS[scenario] || SCENARIOS.subsequent;
      
      // Execute steps
      for (let i = 0; i < steps.length; i++) {
        if (cancelled) return;
        
        const step = steps[i];
        setStatusText(step.text);
        logRef.current.push(step.text);
        console.log(`[Splash] Step ${i + 1}: ${step.text}`);
        
        // Execute effect if present
        if (step.effect) {
          await step.effect();
        }
        
        // Wait before next step (except for last step)
        if (i < steps.length - 1) {
          await delay(STEP_MS);
        }
      }
      
      // Log summary
      console.group('[Splash] Session Summary');
      console.log('Scenario:', scenario);
      console.log('Steps executed:');
      logRef.current.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      console.groupEnd();
      
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: '#0f1117' }}
    >
      <div className="flex flex-col items-center -mt-16">
        <img
          src={LOGO_URL}
          alt={APP_NAME}
          className="rounded-2xl object-contain"
          style={{ width: 176, height: 176 }}
        />
        <div className="flex flex-col items-center gap-3" style={{ marginTop: 48 }}>
          <Loader2
            className="animate-spin"
            style={{ width: 32, height: 32, color: '#4f6aff', animationDuration: '1.2s' }}
          />
          <span
            className="font-sans font-light text-sm uppercase tracking-[0.25em] text-center px-6"
            style={{ color: '#c8cdd8' }}
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}