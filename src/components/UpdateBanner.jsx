import React, { useEffect, useState } from 'react';
import { RefreshCw, RotateCw, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function UpdateBanner() {
  const [progressMsg, setProgressMsg] = useState(null);
  const [progressStatus, setProgressStatus] = useState('loading');

  useEffect(() => {
    const handleUpdate = (e) => {
      const worker = e.detail.waitingWorker;
      if (worker) {
        // Prevent looping updates
        if (sessionStorage.getItem('kjb_sw_updated')) return;
        sessionStorage.setItem('kjb_sw_updated', 'true');
        setTimeout(() => sessionStorage.removeItem('kjb_sw_updated'), 10000);
        
        // Automatically install update (triggers controllerchange and clean reload)
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    };
    const handleProgress = (e) => {
      setProgressMsg(e.detail.message);
      setProgressStatus(e.detail.status || 'loading');
    };
    const handleClear = () => {
      setProgressMsg(null);
      setProgressStatus('loading');
    };
    const handleReloading = (e) => {
      setProgressMsg(e.detail.text || 'Applying Updates...');
      setProgressStatus('loading');
    };

    window.addEventListener('kjb-update-available', handleUpdate);
    window.addEventListener('kjb-progress', handleProgress);
    window.addEventListener('kjb-progress-clear', handleClear);
    window.addEventListener('kjb-reloading', handleReloading);
    return () => {
      window.removeEventListener('kjb-update-available', handleUpdate);
      window.removeEventListener('kjb-progress', handleProgress);
      window.removeEventListener('kjb-progress-clear', handleClear);
      window.removeEventListener('kjb-reloading', handleReloading);
    };
  }, []);

  if (!progressMsg) return null;

  let Icon = RotateCw;
  let iconClass = "w-5 h-5";
  if (progressStatus === 'loading') { iconClass += " animate-spin text-primary"; }
  else if (progressStatus === 'success') { Icon = CheckCircle2; iconClass += " text-green-600 dark:text-green-400"; }
  else if (progressStatus === 'error') { Icon = AlertCircle; iconClass += " text-red-600 dark:text-red-400"; }
  else if (progressStatus === 'info') { Icon = Info; iconClass += " text-blue-600 dark:text-blue-400"; }

  const isBlocking = progressStatus === 'loading';
  const overlayClass = isBlocking 
    ? "fixed inset-0 z-[9999] bg-background/70 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300"
    : "fixed bottom-24 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center justify-end animate-in slide-in-from-bottom-10 fade-in duration-300";

  return (
    <div className={overlayClass}>
      <div className={`pointer-events-auto flex items-center justify-center bg-card/95 backdrop-blur-xl border border-border/50 text-center shadow-2xl ${isBlocking ? 'flex-col gap-6 p-8 rounded-3xl max-w-[85vw] animate-in zoom-in-95 duration-300' : 'flex-row gap-3 px-5 py-3 rounded-2xl max-w-[90vw]'}`}>
        {isBlocking && (
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
            <img 
              src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" 
              alt="KJB Reader Logo" 
              className="relative w-28 h-28 object-contain animate-pulse drop-shadow-2xl"
            />
          </div>
        )}
        <div className={`flex items-center gap-3 justify-center ${isBlocking ? 'bg-secondary/60 px-5 py-2.5 rounded-2xl' : ''}`}>
          <Icon className={iconClass} />
          <p className="font-sans text-sm font-semibold text-foreground tracking-wide pr-1">{progressMsg}</p>
          {(progressStatus !== 'loading') && (
            <button 
              onClick={() => setProgressMsg(null)}
              className="ml-1 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}