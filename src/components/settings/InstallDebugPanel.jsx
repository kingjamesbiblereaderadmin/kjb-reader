import React from 'react';
import { Smartphone, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function InstallDebugPanel() {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const dmStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  const dmMinimal = typeof window !== 'undefined' && window.matchMedia('(display-mode: minimal-ui)').matches;
  const dmOverlay = typeof window !== 'undefined' && window.matchMedia('(display-mode: window-controls-overlay)').matches;
  const localStorageInstalled = typeof window !== 'undefined' ? localStorage.getItem('kjb-is-installed') : 'N/A';
  const hasGetInstalled = typeof navigator !== 'undefined' && navigator.getInstalledRelatedApps;

  return (
    <div className="rounded-xl bg-secondary/30 border border-border p-3 font-sans text-xs space-y-1.5">
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
      {!isIframe && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-muted-foreground font-medium">How to test:</p>
          <ol className="text-muted-foreground list-decimal list-inside space-y-0.5 mt-1">
            <li>Open the PWA (installed app)</li>
            <li>Check this browser tab within 2 seconds</li>
            <li>localStorage should show "true"</li>
          </ol>
        </div>
      )}
    </div>
  );
}