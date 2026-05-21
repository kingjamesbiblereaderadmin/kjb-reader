import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Wifi, WifiOff, Bell, BellOff, CheckCircle2, AlertCircle, Loader2, RefreshCw, Smartphone, Clock, Timer } from 'lucide-react';

export default function DebugPage() {
  const navigate = useNavigate();
  const [swStatus, setSwStatus] = useState('checking');
  const [swDetails, setSwDetails] = useState(null);
  const [notifPermission, setNotifPermission] = useState('checking');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [logs, setLogs] = useState([]);
  const [timerStatus, setTimerStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifDebugInfo, setNotifDebugInfo] = useState(null);
  const [scheduledTest, setScheduledTest] = useState(null);
  const [testLogs, setTestLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const addTestLog = (message, type = 'info') => {
    setTestLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  useEffect(() => {
    addLog('Debug page loaded');
    checkStatus();
    checkTimerStatus();
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Check timer status every 5 seconds
    const timerInterval = setInterval(() => {
      checkTimerStatus();
    }, 5000);
    
    // Check notification debug info every 2 seconds
    const notifDebugInterval = setInterval(() => {
      checkNotifDebugInfo();
      if (scheduledTest?.active) {
        checkScheduledTestProgress();
      }
    }, 2000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(timerInterval);
      clearInterval(notifDebugInterval);
    };
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

  const checkTimerStatus = () => {
    const nextTs = parseInt(localStorage.getItem('kjb-notification-next') || '0', 10);
    const notifTime = localStorage.getItem('kjb-notification-time') || 'not set';
    
    if (nextTs) {
      const nextFire = new Date(nextTs);
      const now = new Date();
      const msUntilFire = nextTs - now.getTime();
      const minutesUntilFire = Math.floor(msUntilFire / 60000);
      
      setTimerStatus({
        nextFire,
        msUntilFire,
        minutesUntilFire,
        scheduledTime: notifTime,
        isActive: msUntilFire > 0
      });
    } else {
      setTimerStatus(null);
    }
  };

  const checkNotifDebugInfo = async () => {
    const info = {
      enabled: localStorage.getItem('kjb-notifications-enabled') === 'true',
      time: localStorage.getItem('kjb-notification-time') || 'not set',
      last: localStorage.getItem('kjb-notification-last') || 'never',
      next: localStorage.getItem('kjb-notification-next') || 'not set',
      lastAppOpen: localStorage.getItem('kjb-last-app-open') || 'never',
      swReady: 'serviceWorker' in navigator,
      notifApiAvailable: 'Notification' in window,
      notifPermission: 'Notification' in window ? Notification.permission : 'unsupported',
    };
    
    if (info.next !== 'not set') {
      const nextTs = parseInt(info.next, 10);
      const now = Date.now();
      info.msUntilFire = nextTs - now;
      info.minutesUntilFire = Math.floor(info.msUntilFire / 60000);
      info.shouldFireNow = info.msUntilFire <= 0 && info.last !== todayString();
    }
    
    setNotifDebugInfo(info);
  };

  const todayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const startScheduledTest = async () => {
    addTestLog('Starting scheduled notification test...');
    
    const currentTime = new Date();
    const [targetHour, targetMin] = (localStorage.getItem('kjb-notification-time') || '08:00').split(':').map(Number);
    
    // Calculate target time (next occurrence)
    const targetTime = new Date();
    targetTime.setHours(targetHour, targetMin, 0, 0);
    
    // If already passed today, schedule for tomorrow
    if (targetTime <= currentTime) {
      targetTime.setDate(targetTime.getDate() + 1);
      addTestLog('Scheduled time already passed today, testing for tomorrow');
    }
    
    const msUntilTest = targetTime.getTime() - currentTime.getTime();
    const minutesUntilTest = Math.floor(msUntilTest / 60000);
    
    addTestLog(`Test scheduled for: ${targetTime.toLocaleString()}`);
    addTestLog(`Waiting ${minutesUntilTest} minutes (${msUntilTest}ms)`);
    
    setScheduledTest({
      active: true,
      startTime: currentTime,
      targetTime,
      msUntilTest,
      status: 'waiting',
      expectedFireTime: targetTime,
    });
    
    // Wait for the scheduled time
    setTimeout(async () => {
      addTestLog('⏰ Scheduled time reached! Checking if notification fired...');
      
      // Wait 5 seconds for notification to potentially fire
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const lastNotif = localStorage.getItem('kjb-notification-last');
      const today = todayString();
      
      if (lastNotif === today) {
        addTestLog('✅ SUCCESS: Notification fired at scheduled time!', 'success');
        setScheduledTest(prev => ({ ...prev, status: 'success', fired: true }));
      } else {
        addTestLog('❌ FAILED: Notification did not fire at scheduled time', 'error');
        addTestLog(`Last notified: ${lastNotif || 'never'}`, 'error');
        addTestLog(`Expected: ${today}`, 'error');
        setScheduledTest(prev => ({ ...prev, status: 'failed', fired: false }));
      }
      
      // Check for errors in console
      addTestLog('Checking for potential errors...');
      const notifEnabled = localStorage.getItem('kjb-notifications-enabled') === 'true';
      const swReady = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration('/') !== null;
      
      if (!notifEnabled) {
        addTestLog('⚠️ Error: Notifications not enabled in localStorage', 'error');
      }
      if (!swReady) {
        addTestLog('⚠️ Error: Service Worker not ready', 'error');
      }
      
      setScheduledTest(prev => ({ ...prev, active: false, completed: true }));
    }, msUntilTest);
  };

  const checkScheduledTestProgress = () => {
    if (!scheduledTest?.active) return;
    
    const now = new Date();
    const msRemaining = scheduledTest.targetTime.getTime() - now.getTime();
    const minutesRemaining = Math.floor(msRemaining / 60000);
    
    setScheduledTest(prev => ({
      ...prev,
      msRemaining,
      minutesRemaining,
      currentTime: now
    }));
  };

  const cancelScheduledTest = () => {
    setScheduledTest(null);
    addTestLog('Scheduled test cancelled');
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

  const testScheduledNotification = async () => {
    addLog('Testing scheduled notification trigger...');
    try {
      const { triggerScheduledNotification } = await import('@/lib/notifications');
      await triggerScheduledNotification();
      addLog('Scheduled notification triggered', 'success');
    } catch (err) {
      addLog(`Scheduled trigger failed: ${err.message}`, 'error');
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
            <p>Scheduled time: {localStorage.getItem('kjb-notification-time') || 'not set'}</p>
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

        {/* Timer Status */}
        {timerStatus && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Timer className={`w-5 h-5 ${timerStatus.isActive ? 'text-green-600 animate-pulse' : 'text-muted-foreground'}`} />
              Scheduled Timer
            </h2>
            <span className={`font-sans text-xs font-medium px-2 py-1 rounded ${
              timerStatus.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800'
            }`}>
              {timerStatus.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-sans text-xs">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Current Time</p>
              <p className="text-foreground font-mono text-sm">{currentTime.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Next Fire Time</p>
              <p className="text-foreground font-mono text-sm">{timerStatus.nextFire.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Time Until Fire</p>
              <p className={`font-mono text-sm ${timerStatus.minutesUntilFire < 5 ? 'text-red-600' : 'text-foreground'}`}>
                {timerStatus.minutesUntilFire < 1 ? '< 1 minute' : `${timerStatus.minutesUntilFire} minutes`}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Scheduled Time</p>
              <p className="text-foreground font-mono text-sm">{timerStatus.scheduledTime}</p>
            </div>
          </div>
          {timerStatus.minutesUntilFire < 5 && timerStatus.isActive && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <Clock className="w-4 h-4" />
              <span className="font-sans text-xs font-medium">Notification will fire in less than 5 minutes! Keep the app open.</span>
            </div>
          )}
        </div>
        )}

        {/* Notification Debug Info */}
        {notifDebugInfo && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent" />
              Notification Debug Console
            </h2>
            <span className={`font-sans text-xs font-medium px-2 py-1 rounded ${
              notifDebugInfo.enabled && notifDebugInfo.swReady ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {notifDebugInfo.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-sans text-xs mb-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Notifications Enabled</p>
              <p className={`font-mono text-sm ${notifDebugInfo.enabled ? 'text-green-600' : 'text-red-600'}`}>
                {notifDebugInfo.enabled ? 'YES' : 'NO'}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Service Worker Ready</p>
              <p className={`font-mono text-sm ${notifDebugInfo.swReady ? 'text-green-600' : 'text-red-600'}`}>
                {notifDebugInfo.swReady ? 'YES' : 'NO'}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Notification API</p>
              <p className={`font-mono text-sm ${notifDebugInfo.notifApiAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {notifDebugInfo.notifApiAvailable ? 'Available' : 'Unavailable'}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Permission Status</p>
              <p className={`font-mono text-sm ${notifDebugInfo.notifPermission === 'granted' ? 'text-green-600' : notifDebugInfo.notifPermission === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
                {notifDebugInfo.notifPermission}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Scheduled Time</p>
              <p className="font-mono text-sm">{notifDebugInfo.time}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Last Notified</p>
              <p className="font-mono text-sm">{notifDebugInfo.last}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Last App Open</p>
              <p className="font-mono text-sm">{notifDebugInfo.lastAppOpen}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Next Fire Timestamp</p>
              <p className="font-mono text-sm truncate">{notifDebugInfo.next}</p>
            </div>
          </div>
          {notifDebugInfo.minutesUntilFire !== undefined && (
            <div className="bg-slate-900 dark:bg-black rounded-xl p-4 mb-3">
              <div className="grid grid-cols-2 gap-3 font-sans text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Minutes Until Fire</p>
                  <p className={`font-mono text-lg ${notifDebugInfo.minutesUntilFire < 0 ? 'text-red-400' : notifDebugInfo.minutesUntilFire < 5 ? 'text-amber-400' : 'text-green-400'}`}>
                    {notifDebugInfo.minutesUntilFire < 0 ? `${Math.abs(notifDebugInfo.minutesUntilFire)} min OVERDUE` : 
                     notifDebugInfo.minutesUntilFire < 1 ? '< 1 minute' : 
                     `${notifDebugInfo.minutesUntilFire} minutes`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Should Fire Now</p>
                  <p className={`font-mono text-lg ${notifDebugInfo.shouldFireNow ? 'text-green-400' : 'text-slate-400'}`}>
                    {notifDebugInfo.shouldFireNow ? 'YES' : 'NO'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => checkNotifDebugInfo()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            {notifDebugInfo.shouldFireNow && (
              <button
                onClick={testNotification}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Bell className="w-3.5 h-3.5" />
                Fire Test Notification
              </button>
            )}
          </div>

          {/* Scheduled Test Section */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-serif text-base font-semibold mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4 text-accent" />
              Scheduled Notification Test
            </h3>
            <p className="font-sans text-xs text-muted-foreground mb-3">
              This test waits for the scheduled notification time and verifies if the notification fires correctly.
            </p>
            
            {!scheduledTest && (
              <button
                onClick={startScheduledTest}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Timer className="w-4 h-4" />
                Start Scheduled Test
              </button>
            )}

            {scheduledTest && (
              <div className="space-y-3">
                <div className="bg-slate-900 dark:bg-black rounded-xl p-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-slate-500 mb-1">Status</p>
                      <p className={`text-lg ${
                        scheduledTest.status === 'waiting' ? 'text-amber-400' :
                        scheduledTest.status === 'success' ? 'text-green-400' :
                        scheduledTest.status === 'failed' ? 'text-red-400' :
                        'text-slate-300'
                      }`}>
                        {scheduledTest.status === 'waiting' && '⏳ Waiting...'}
                        {scheduledTest.status === 'success' && '✅ SUCCESS'}
                        {scheduledTest.status === 'failed' && '❌ FAILED'}
                        {scheduledTest.status === 'cancelled' && '⚠️ Cancelled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Time Remaining</p>
                      <p className="text-lg text-slate-300">
                        {scheduledTest.minutesRemaining !== undefined
                          ? scheduledTest.minutesRemaining < 1
                            ? '< 1 minute'
                            : `${scheduledTest.minutesRemaining} minutes`
                          : 'Calculating...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-slate-400">
                    <p>Target Time: {scheduledTest.targetTime?.toLocaleString()}</p>
                    <p>Current Time: {scheduledTest.currentTime?.toLocaleString() || new Date().toLocaleString()}</p>
                    <p>Scheduled Time Setting: {localStorage.getItem('kjb-notification-time') || 'not set'}</p>
                  </div>
                </div>

                {scheduledTest.active && (
                  <button
                    onClick={cancelScheduledTest}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive font-sans text-xs font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cancel Test
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Test Logs */}
        {testLogs.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <h2 className="font-serif text-lg font-semibold mb-4">Scheduled Test Logs</h2>
            <div className="bg-slate-900 dark:bg-black rounded-xl p-4 font-mono text-xs text-slate-100 max-h-96 overflow-y-auto">
              {testLogs.map((log, i) => (
                <div key={i} className={`mb-1 ${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-amber-400' :
                  'text-slate-300'
                }`}>
                  <span className="text-slate-500">[{log.time}]</span> {log.message}
                </div>
              ))}
            </div>
            <button
              onClick={() => setTestLogs([])}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Clear Test Logs
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-serif text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testNotification}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Test Now
            </button>
            <button
              onClick={testScheduledNotification}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Bell className="w-4 h-4" />
              Test Scheduled
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