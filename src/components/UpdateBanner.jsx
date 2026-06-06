import React, { useEffect, useState } from 'react';
import { RefreshCw, RotateCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function UpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [progressMsg, setProgressMsg] = useState(null);
  const [progressStatus, setProgressStatus] = useState('loading');

  useEffect(() => {
    const handleUpdate = (e) => {
      setWaitingWorker(e.detail.waitingWorker);
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

  if (!waitingWorker && !progressMsg) return null;

  if (waitingWorker) {
    return (
      <div className="w-full bg-primary text-primary-foreground py-2 px-5 sm:px-12 lg:px-16 flex items-center justify-between text-sm font-medium shadow-inner border-b border-border/20 z-40 animate-in slide-in-from-top-2">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Update ready. Reload to apply.</span>
        </div>
        <button 
          onClick={() => {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            // controllerchange will handle the reload
          }}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
        >
          Reload
        </button>
      </div>
    );
  }

  let Icon = RotateCw;
  let iconClass = "w-4 h-4 text-muted-foreground";
  if (progressStatus === 'loading') iconClass += " animate-spin";
  else if (progressStatus === 'success') { Icon = CheckCircle2; iconClass = "w-4 h-4 text-green-600 dark:text-green-400"; }
  else if (progressStatus === 'error') { Icon = AlertCircle; iconClass = "w-4 h-4 text-red-600 dark:text-red-400"; }
  else if (progressStatus === 'info') { Icon = Info; iconClass = "w-4 h-4 text-blue-600 dark:text-blue-400"; }

  return (
    <div className={`w-full py-2 px-5 sm:px-12 lg:px-16 flex items-center justify-center text-sm font-medium shadow-inner border-b z-40 animate-in slide-in-from-top-2 ${progressStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/30' : progressStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-900/30' : 'bg-secondary text-secondary-foreground border-border'}`}>
      <div className="flex items-center gap-2">
        <Icon className={iconClass} />
        <span>{progressMsg}</span>
      </div>
    </div>
  );
}