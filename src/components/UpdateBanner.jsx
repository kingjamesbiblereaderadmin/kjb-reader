import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2, Download } from 'lucide-react';

export default function UpdateBanner() {
  const [progressMsg, setProgressMsg] = useState(null);
  const [progressStatus, setProgressStatus] = useState('loading');
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      const worker = e.detail.waitingWorker;
      if (worker) {
        setWaitingWorker(worker);
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

    window.addEventListener('kjb-update-available', handleUpdate);
    window.addEventListener('kjb-progress', handleProgress);
    window.addEventListener('kjb-progress-clear', handleClear);
    return () => {
      window.removeEventListener('kjb-update-available', handleUpdate);
      window.removeEventListener('kjb-progress', handleProgress);
      window.removeEventListener('kjb-progress-clear', handleClear);
    };
  }, []);

  if (waitingWorker) {
    return (
      <div className="w-full py-2 px-5 sm:px-12 lg:px-16 flex items-center justify-between text-sm font-medium shadow-inner border-b z-40 relative bg-primary text-primary-foreground border-primary">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>App update available</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (sessionStorage.getItem('kjb_sw_updated')) return;
              sessionStorage.setItem('kjb_sw_updated', 'app');
              setTimeout(() => sessionStorage.removeItem('kjb_sw_updated'), 10000);
              
              setWaitingWorker(null);
              setProgressMsg('Found app updates...');
              setProgressStatus('loading');
              
              waitingWorker.postMessage({ type: 'SKIP_WAITING' });
              
              setTimeout(() => {
                window.location.href = window.location.pathname + '?refresh=' + Date.now();
              }, 3500);
            }}
            className="px-3 py-1 bg-background text-foreground hover:bg-secondary rounded-md transition-colors text-xs font-semibold"
          >
            Update Now
          </button>
          <button 
            onClick={() => setWaitingWorker(null)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!progressMsg) return null;

  let Icon = Loader2;
  let iconClass = "w-4 h-4 text-muted-foreground";
  if (progressStatus === 'loading') iconClass += " animate-spin";
  else if (progressStatus === 'success') { Icon = CheckCircle2; }
  else if (progressStatus === 'error') { Icon = AlertCircle; }
  else if (progressStatus === 'info') { Icon = Info; }

  return (
    <div className="w-full py-2 px-5 sm:px-12 lg:px-16 flex items-center text-sm font-medium shadow-inner border-b z-40 relative bg-secondary text-secondary-foreground border-border">
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