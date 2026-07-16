import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SyncStatus() {
  const [lastSynced, setLastSynced] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSyncTime = async () => {
      // Prefer the local sync-completion stamp — it's set every time the sync
      // actually runs, even when there were no changes to push to the cloud.
      // The cloud record's updated_date only moves on a write, so it can lag
      // behind (showing "8h ago" right after a successful no-change sync).
      const localStamp = localStorage.getItem('kjb-last-sync-time');
      if (localStamp) {
        setLastSynced(localStamp);
      } else {
        try {
          const existing = await base44.entities.UserSetting.list('-updated_date', 1);
          if (existing.length > 0) {
            setLastSynced(existing[0].updated_date || existing[0].created_date);
          }
        } catch {
          setError('Could not check sync status.');
        }
      }
    };
    fetchSyncTime();

    // Refresh when a sync completes (fired by settingsSync.js) or when the
    // tab regains focus so the timestamp stays current without a manual pull.
    const onSynced = () => {
      const stamp = localStorage.getItem('kjb-last-sync-time');
      if (stamp) setLastSynced(stamp);
    };
    window.addEventListener('kjb-settings-synced', onSynced);
    window.addEventListener('focus', onSynced);
    window.addEventListener('storage', onSynced);
    return () => {
      window.removeEventListener('kjb-settings-synced', onSynced);
      window.removeEventListener('focus', onSynced);
      window.removeEventListener('storage', onSynced);
    };
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    try {
      const { syncSettingsFromCloud } = await import('@/lib/settingsSync');
      await syncSettingsFromCloud();
      const stamp = localStorage.getItem('kjb-last-sync-time');
      if (stamp) setLastSynced(stamp);
    } catch (err) {
      setError('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 p-5 shadow-lg shadow-black/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" />
          Sync Status
        </h2>
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent border border-border text-foreground font-sans text-xs font-medium hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        {syncing ? (
          <>
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <p className="font-sans text-sm text-muted-foreground">Syncing your data…</p>
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="font-sans text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="font-sans text-sm text-muted-foreground">
              Last synced: <span className="text-foreground font-medium">{formatTime(lastSynced)}</span>
            </p>
          </>
        )}
      </div>
      <p className="font-sans text-xs text-muted-foreground mt-2 leading-relaxed">
        Settings, reading progress, and saved verses sync automatically.
      </p>
    </div>
  );
}