import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function UpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      setWaitingWorker(e.detail.waitingWorker);
    };
    window.addEventListener('kjb-update-available', handleUpdate);
    return () => window.removeEventListener('kjb-update-available', handleUpdate);
  }, []);

  if (!waitingWorker) return null;

  return (
    <div className="w-full bg-primary text-primary-foreground py-2 px-5 sm:px-12 lg:px-16 flex items-center justify-between text-sm font-medium shadow-inner border-b border-border/20 z-40 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        <span>A new update is ready.</span>
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