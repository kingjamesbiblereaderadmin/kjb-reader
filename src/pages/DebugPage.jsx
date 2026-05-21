import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Wifi, WifiOff, Bell, BellOff, CheckCircle2, AlertCircle, Loader2, RefreshCw, Smartphone } from 'lucide-react';

export default function DebugPage() {
  const navigate = useNavigate();
  const [swStatus, setSwStatus] = useState('checking');
  const [swDetails, setSwDetails] = useState(null);
  const [notifPermission, setNotifPermission] = useState('checking');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  useEffect(() => {
    addLog('Debug page loaded');
    checkStatus();
  }, []);

  const checkStatus = async () => {
    addLog('Checking service worker status...');
    
    // Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        if (reg) {
          setSwStatus('registered');
          setSwDetails({
            scope: reg.scope,
            active: reg.active?.scriptURL || 'none',
            installing: !!reg.installing,
            waiting: !!reg.waiting
          });
          addLog(`SW registered: ${reg.scope}`, 'success');
          addLog(`SW active: ${reg.active?.scriptURL || 'none'}`);
        } else {
          setSwStatus('not-registered');
          addLog('SW not registered', 'error');
        }
      } catch (err) {
        setSwStatus('error');
        addLog(`SW check failed: ${err.message}`, 'error');
      }
    } else {
      setSwStatus('unsupported');
      addLog('Service Worker not supported', 'error');
    }

    // Check Notifications
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
      addLog(`Notification permission: ${Notification.permission}`);
    } else {
      setNotifPermission('unsupported');
      addLog('Notification API not supported', 'error');
    }

    // Check localStorage
    const enabled = localStorage.getItem('kjb-notifications-enabled') === 'true';
    setNotifEnabled(enabled);
    addLog(`Notifications enabled in storage: ${enabled}`);
    addLog(`Notification time: ${localStorage.getItem('kjb-notification-time') || 'not set'}`);
    addLog(`Last notified: ${localStorage.getItem('kjb-notification-last') || 'never'}`);
    addLog(`Next fire timestamp: ${localStorage.getItem('kjb-notification-next') || 'not set'}`);
  };

  const testNotification = async () => {
    addLog('Testing notification...');
    try {
      const { showLocalNotification } = await import('@/lib/notifications');
      const { getDailyVerse } = await import('@/lib/dailyVerse');
      const v = getDailyVerse();
      await showLocalNotification('KJB — Test Notification', `"${v.text.slice(0, 80)}..." — ${v.ref}`);
      addLog('Test notification sent', 'success');
    } catch (err) {
      addLog(`Test failed: ${err.message}`, 'error');
    }
  };

  const registerSW = async () => {
    addLog('Registering service worker...');
    try {
      const { registerSW } = await import('@/lib/notifications');
      const reg = await registerSW();
      if (reg) {
        addLog(`SW registered: ${reg.scope}`, 'success');
        setSwStatus('registered');
      } else {
        addLog('SW already registered or failed', 'warning');
      }
      checkStatus();
    } catch (err) {
      addLog(`SW registration failed: ${err.message}`, 'error');
    }
  };

  const requestPermission = async () => {
    addLog('Requesting notification permission...');
    try {
      const { requestNotificationPermission } = await import('@/lib/notifications');
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      addLog(`Permission result: ${result}`, result === 'granted' ? 'success' : 'warning');
      checkStatus();
    } catch (err) {
      addLog(`Permission request failed: ${err.message}`, 'error');
    }
  };

  const clearAllData = async () => {
    if (!confirm('Clear all notification data and caches?')) return;
    
    addLog('Clearing all data...');
    localStorage.removeItem('kjb-notifications-enabled');
    localStorage.removeItem('kjb-notification-next');
    localStorage.removeItem('kjb-notification-last');
    localStorage.removeItem('kjb-notification-time');
    localStorage.removeItem('kjb-notif-image');
    localStorage.removeItem('kjb-daily-verse-bg');
    
    // Clear caches
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
      addLog('Caches cleared', 'success');
    }
    
    // Unregister SW
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
      addLog('Service workers unregistered', 'success');
    }
    
    addLog('All data cleared. Reload the app.', 'warning');
    checkStatus();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Settings className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Debug & Diagnostics</h1>
        <p className="font-sans text-sm text-muted-foreground">Service Worker & Notification Status</p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 mb-6">
        {/* Service Worker Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              {swStatus === 'registered' ? <Wifi className="w-5 h-5 text-green-600" /> :
               swStatus === 'error' ? <WifiOff className="w-5 h-5 text-red-600" /> :
               <WifiOff className="w-5 h-5 text-muted-foreground" />}
              Service Worker
            </h2>
            <span className={`font-sans text-xs font-medium px-2 py-1 rounded ${
              swStatus === 'registered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              swStatus === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
            }`}>
              {swStatus === 'registered' ? 'Active' : swStatus === 'error' ? 'Error' : swStatus === 'unsupported' ? 'Unsupported' : 'Not Registered'}
            </span>
          </div>
          {swDetails && (
            <div className="font-sans text-xs text-muted-foreground space-y-1">
              <p>Scope: {swDetails.scope}</p>
              <p>Active: {swDetails.active}</p>
              {swDetails.installing && <p>Installing: Yes</p>}
              {swDetails.waiting && <p>Waiting: Yes</p>}
            </div>
          )}
          {swStatus !== 'registered' && swStatus !== 'checking' && (
            <button
              onClick={registerSW}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Register Now
            </button>
          )}
        </div>

        {/* Notification Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              {notifPermission === 'granted' ? <Bell className="w-5 h-5 text-primary" /> :
               notifPermission === 'denied' ? <BellOff className="w-5 h-5 text-red-600" /> :
               <Bell className="w-5 h-5 text-muted-foreground" />}
              Notifications
            </h2>
            <div className="flex items-center gap-2">
              <span className={`font-sans text-xs font-medium px-2 py-1 rounded ${
                notifPermission === 'granted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                notifPermission === 'denied' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}>
                {notifPermission === 'granted' ? 'Granted' : notifPermission === 'denied' ? 'Denied' : notifPermission === 'unsupported' ? 'Unsupported' : 'Unknown'}
              </span>
              {notifEnabled && <Bell className="w-4 h-4 text-primary" />}
            </div>
          </div>
          <div className="font-sans text-xs text-muted-foreground space-y-1 mb-3">
            <p>Enabled: {notifEnabled ? 'Yes' : 'No'}</p>
            <p>Time: {localStorage.getItem('kjb-notification-time') || 'not set'}</p>
            <p>Last notified: {localStorage.getItem('kjb-notification-last') || 'never'}</p>
          </div>
          {notifPermission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Bell className="w-4 h-4" />
              Request Permission
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h2 className="font-serif text-lg font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={testNotification}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Test Notification
          </button>
          <button
            onClick={checkStatus}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
          <button
            onClick={clearAllData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-sans text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-serif text-lg font-semibold mb-4">Debug Logs</h2>
        <div className="bg-slate-900 dark:bg-black rounded-xl p-4 font-mono text-xs text-slate-100 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-slate-500">No logs yet</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`mb-1 ${
                log.type === 'success' ? 'text-green-400' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-amber-400' :
                'text-slate-300'
              }`}>
                <span className="text-slate-500">[{log.time}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}