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
    ? "fixed inset-0 z-[9999] bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200"
    : "fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-center animate-in fade-in duration-200 pb-20";

  return (
    <div className={overlayClass}>
      <div className="pointer-events-auto flex flex-col items-center gap-4 bg-card p-5 rounded-2xl shadow-xl border border-border max-w-[90vw] text-center">
        {isBlocking && (
          <img 
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" 
            alt="KJB Reader Logo" 
            className="w-24 h-24 object-contain animate-pulse"
          />
        )}
        <div className="flex items-center gap-3 justify-center">
          <Icon className={iconClass} />
          <p className="font-sans text-sm font-medium text-foreground pr-2">{progressMsg}</p>
          {(progressStatus !== 'loading') && (
            <button 
              onClick={() => setProgressMsg(null)}
              className="ml-2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors shrink-0"
            >
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}