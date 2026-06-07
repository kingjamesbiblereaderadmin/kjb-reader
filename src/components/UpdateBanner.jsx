import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, RotateCw, CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';

export default function UpdateBanner() {
  const [progressMsg, setProgressMsg] = useState(null);
  const [progressStatus, setProgressStatus] = useState('loading');
  const [isReloading, setIsReloading] = useState(false);

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
      setIsReloading(false);
    };
    const handleClear = () => {
      setProgressMsg(null);
      setProgressStatus('loading');
      setIsReloading(false);
    };
    const handleReloading = (e) => {
      setProgressMsg(e.detail.text || 'Applying Updates...');
      setProgressStatus('loading');
      setIsReloading(true);
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

  if (isReloading) {
    return createPortal(
      <div className="fixed inset-0 z-[99999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center -mt-16">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <img 
              src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" 
              alt="KJB Reader Logo" 
              className="relative w-32 h-32 object-contain drop-shadow-2xl"
            />
          </div>
          <div className="flex items-center gap-3 text-foreground bg-card/80 px-6 py-3 rounded-2xl backdrop-blur-md shadow-lg border border-border/50">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="font-sans text-sm font-semibold tracking-wide">{progressMsg}</span>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  let Icon = Loader2;
  let iconClass = "w-4 h-4 text-muted-foreground";
  if (progressStatus === 'loading') iconClass += " animate-spin";
  else if (progressStatus === 'success') { Icon = CheckCircle2; iconClass = "w-4 h-4 text-green-600 dark:text-green-400"; }
  else if (progressStatus === 'error') { Icon = AlertCircle; iconClass = "w-4 h-4 text-red-600 dark:text-red-400"; }
  else if (progressStatus === 'info') { Icon = Info; iconClass = "w-4 h-4 text-blue-600 dark:text-blue-400"; }

  return (
    <div className={`w-full py-2 px-5 sm:px-12 lg:px-16 flex items-center text-sm font-medium shadow-inner border-b z-40 relative ${progressStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/30' : progressStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-900/30' : 'bg-secondary text-secondary-foreground border-border'}`}>
      <div className="flex-1 flex justify-center items-center gap-2">
        <Icon className={iconClass} />
        <span>{progressMsg}</span>
      </div>
      {(progressStatus !== 'loading') && (
        <button 
          onClick={() => setProgressMsg(null)}
          className="absolute right-4 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
        >
          <X className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>
      )}
    </div>
  );
}