import React, { useEffect, useState } from 'react';
import { RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { getBibleData, isBibleCached, refreshCacheIfDue, downloadBibleForOffline } from '@/lib/bibleCache';
import { toast } from 'sonner';

/**
 * AutoUpdateHandler - Manages automatic cache and settings updates
 * - Checks for cache updates on mount
 * - Provides manual refresh functionality
 * - Shows update status to user
 */
export default function AutoUpdateHandler({ children }) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('idle'); // 'idle' | 'checking' | 'updated' | 'error'

  // Check for updates on mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setUpdateStatus('checking');
    
    try {
      const updated = await refreshCacheIfDue();
      
      if (updated) {
        setUpdateStatus('updated');
        setLastUpdate(new Date());
        toast.success('Cache updated successfully');
      } else {
        setUpdateStatus('idle');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateStatus('error');
      toast.error('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsChecking(true);
    setUpdateStatus('checking');
    
    try {
      await downloadBibleForOffline((progress, message) => {
        toast.loading(`Updating: ${message}`, { duration: 1000 });
      });
      
      setUpdateStatus('updated');
      setLastUpdate(new Date());
      toast.success('Cache refreshed successfully');
      
      // Reload page to apply updates
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setUpdateStatus('error');
      toast.error('Failed to refresh cache');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      {children}
      
      {/* Update status indicator - subtle, non-intrusive */}
      {updateStatus === 'updated' && (
        <div className="fixed top-16 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 text-xs font-sans font-medium shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Updated
          </div>
        </div>
      )}
      
      {updateStatus === 'error' && (
        <div className="fixed top-16 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 text-xs font-sans font-medium shadow-lg">
            <AlertCircle className="w-3.5 h-3.5" />
            Update failed
          </div>
        </div>
      )}
    </>
  );
}