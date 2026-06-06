import React, { useEffect, useState } from 'react';
import { RefreshCw, RotateCw } from 'lucide-react';

export default function UpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [progressMsg, setProgressMsg] = useState(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      setWaitingWorker(e.detail.waitingWorker);
    };
    const handleProgress = (e) => {
      setProgressMsg(e.detail.message);
    };
    const handleClear = () => {
      setProgressMsg(null);
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

  return (
    <div className="w-full bg-secondary text-secondary-foreground py-2 px-5 sm:px-12 lg:px-16 flex items-center justify-center text-sm font-medium shadow-inner border-b border-border z-40 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <RotateCw className="w-4 h-4 animate-spin text-muted-foreground" />
        <span>{progressMsg}</span>
      </div>
    </div>
  );
}