import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export default function InstallDebugPanel() {
  const { isInstalled: hookInstalled } = useInstallPrompt();
  const [getInstalledResult, setGetInstalledResult] = useState(null);
  
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const dmStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  const dmMinimal = typeof window !== 'undefined' && window.matchMedia('(display-mode: minimal-ui)').matches;
  const dmOverlay = typeof window !== 'undefined' && window.matchMedia('(display-mode: window-controls-overlay)').matches;
  const localStorageInstalled = typeof window !== 'undefined' ? localStorage.getItem('kjb-is-installed') : 'N/A';
  const hasGetInstalled = typeof navigator !== 'undefined' && navigator.getInstalledRelatedApps;

  useEffect(() => {
    if (hasGetInstalled && !isIframe) {
      navigator.getInstalledRelatedApps().then(apps => {
        setGetInstalledResult(apps?.length || 0);
        console.log('[DebugPanel] getInstalledRelatedApps:', apps);
      }).catch(err => {
        setGetInstalledResult('error');
        console.error('[DebugPanel] getInstalledRelatedApps error:', err);
      });
    }
  }, [hasGetInstalled, isIframe]);

  const handleHardRefresh = () => {
    localStorage.removeItem('kjb-is-installed');
    localStorage.removeItem('kjb-install-timestamp');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-install-change'));
    location.reload();
  };

  return (
    <div className="rounded-xl bg-secondary/30 border border-border p-3 font-sans text-xs space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-foreground flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          PWA Install Detection
        </p>
        <button
          onClick={handleHardRefresh}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
          title="Clear cache and reload"
        >
          <RefreshCw className="w-3 h-3" />
          Hard Refresh
        </button>
      </div>
      {isIframe && (
        <div className="mb-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Preview Mode (iframe) - PWA detection blocked
          </p>
        </div>
      )}
      <p className="font-medium text-foreground flex items-center gap-1.5">
        <Smartphone className="w-3.5 h-3.5" />
        Install Detection:
      </p>
      <p className="text-muted-foreground flex items-center gap-2">
        {dmStandalone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
        display-mode standalone: <span className={dmStandalone ? 'text-green-600 font-bold' : 'text-red-500'}>{dmStandalone ? '✓ true' : '✗ false'}</span>
      </p>
      <p className="text-muted-foreground flex items-center gap-2">
        {dmMinimal ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
        display-mode minimal-ui: <span className={dmMinimal ? 'text-green-600 font-bold' : 'text-red-500'}>{dmMinimal ? '✓ true' : '✗ false'}</span>
      </p>
      <p className="text-muted-foreground flex items-center gap-2">
        {dmOverlay ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
        display-mode overlay: <span className={dmOverlay ? 'text-green-600 font-bold' : 'text-red-500'}>{dmOverlay ? '✓ true' : '✗ false'}</span>
      </p>
      <p className="text-muted-foreground flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        localStorage kjb-is-installed: <span className="text-amber-600 font-bold">{localStorageInstalled || 'null'}</span>
      </p>
      <p className="text-muted-foreground flex items-center gap-2">
        {hasGetInstalled && !isIframe ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
        getInstalledRelatedApps: <span className={hasGetInstalled && !isIframe ? 'text-green-600' : 'text-red-500'}>{hasGetInstalled && !isIframe ? '✓ available (Android only)' : '✗ unavailable'}</span>
      </p>
      {hasGetInstalled && !isIframe && (
        <p className="text-muted-foreground flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
          Installed apps found: <span className="text-blue-600 font-bold">{getInstalledResult !== null ? getInstalledResult : 'checking...'}</span>
        </p>
      )}
      
      <div className="mt-2 pt-2 border-t border-border">
        <p className="text-muted-foreground font-medium mb-1">Status Summary:</p>
        <div className={`rounded-lg p-2 font-medium ${hookInstalled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
          {hookInstalled ? '✓ PWA is INSTALLED' : '✗ PWA not detected'}
        </div>
      </div>
      
      {!isIframe && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-muted-foreground font-medium mb-1">How to test sync:</p>
          <ol className="text-muted-foreground list-decimal list-inside space-y-0.5 mt-1">
            <li>Open the PWA (installed app)</li>
            <li>Browser tab should detect within 2 seconds</li>
            <li>localStorage will show "true"</li>
            <li>Hook will report installed=true</li>
          </ol>
        </div>
      )}
    </div>
  );
}