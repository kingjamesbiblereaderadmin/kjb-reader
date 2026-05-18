import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Download, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/themeContext';
import {
  getNotificationsEnabled, getNotificationTime, setNotificationTime,
  requestNotificationPermission, disableNotifications, scheduleDailyNotification, showLocalNotification
} from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';
import { isBibleCached, downloadBibleForOffline, clearBibleCache } from '@/lib/bibleCache';

const LAST_REVISED = 'May 2026';

export default function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { isDark, mode, setMode } = useTheme();
  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifTime, setNotifTimeState] = useState(getNotificationTime);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');

  const [cached, setCached] = useState(isBibleCached);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlStatus, setDlStatus] = useState('');
  const [dlError, setDlError] = useState('');

  useEffect(() => {
    setCached(isBibleCached());
  }, []);

  const handleToggleNotifications = async () => {
    if (notifEnabled) {
      disableNotifications();
      setNotifEnabled(false);
    } else {
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        setNotifEnabled(true);
        scheduleDailyNotification(getDailyVerse());
      }
    }
  };

  const handleTimeChange = (e) => {
    setNotifTimeState(e.target.value);
    setNotificationTime(e.target.value);
    if (notifEnabled) scheduleDailyNotification(getDailyVerse());
  };

  const handleTestNotif = () => {
    const v = getDailyVerse();
    showLocalNotification('King James Bible — Verse of the Day', `"${v.text.slice(0, 100)}${v.text.length > 100 ? '…' : ''}" — ${v.ref}`);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDlError('');
    setDlProgress(0);
    setDlStatus('Starting download...');
    try {
      await downloadBibleForOffline((pct, msg) => {
        setDlProgress(pct);
        setDlStatus(msg);
      });
      setCached(true);
      setDlStatus('All 66 books downloaded successfully!');
    } catch (err) {
      setDlError('Download failed: ' + err.message + '. Please check your connection and try again.');
    }
    setDownloading(false);
  };

  const handleClearCache = () => {
    clearBibleCache();
    setCached(false);
    setDlProgress(0);
    setDlStatus('');
    setDlError('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Settings className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="font-sans text-sm text-muted-foreground">Offline downloads & app information</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Appearance</h2>
        <p className="font-sans text-xs text-muted-foreground">Choose how the app looks</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'light', label: '☀️ Light' },
            { id: 'dark', label: '🌙 Dark' },
            { id: 'auto', label: '🕐 Auto' },
            { id: 'system', label: '📱 System' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
                mode === opt.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="font-sans text-xs text-muted-foreground">
          {mode === 'auto' ? '🕐 Auto: light 6am–6pm, dark 6pm–6am' :
           mode === 'system' ? '📱 System: follows your device setting' :
           mode === 'dark' ? '🌙 Dark mode always on' : '☀️ Light mode always on'}
        </p>
      </div>

      {/* Offline Library */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-2">Offline Library</h2>
        <p className="font-sans text-sm text-muted-foreground mb-4">
          Download all 66 books to your device for offline reading. Once downloaded, the Bible is available without an internet connection.
        </p>

        {cached ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-sans text-sm font-medium">All 66 books downloaded — available offline</span>
            </div>
            <button
              onClick={handleClearCache}
              className="font-sans text-xs text-muted-foreground underline hover:text-foreground transition-colors"
            >
              Clear download & re-download
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!downloading && !dlStatus && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-sans text-sm">Not downloaded — Bible loads from network each visit</span>
              </div>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? 'Downloading…' : 'Download All 66 Books (Offline)'}
            </button>
            {downloading && (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dlProgress}%` }}
                  />
                </div>
                <p className="font-sans text-xs text-muted-foreground">{dlStatus}</p>
              </div>
            )}
            {dlStatus && !downloading && (
              <p className="font-sans text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {dlStatus}
              </p>
            )}
            {dlError && (
              <p className="font-sans text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {dlError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">Daily Notifications</h2>
        {notifPermission === 'unsupported' ? (
          <p className="font-sans text-sm text-muted-foreground">Notifications are not supported in this browser. Install as a PWA for full support.</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-sans text-sm text-foreground font-medium">Verse of the Day</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  {notifPermission === 'denied' ? 'Blocked by browser — enable in site settings' : 'Receive a daily KJB verse reminder'}
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                disabled={notifPermission === 'denied'}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
                  notifEnabled
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                } disabled:opacity-40`}
              >
                {notifEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {notifEnabled ? 'On' : 'Off'}
              </button>
            </div>
            {notifEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <label className="font-sans text-sm text-muted-foreground shrink-0">Notify at</label>
                <input
                  type="time"
                  value={notifTime}
                  onChange={handleTimeChange}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleTestNotif}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                >
                  Test
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Account */}
      <div className="bg-card border border-destructive/30 rounded-2xl p-5 mb-6">
        <h2 className="font-serif text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
        <p className="font-sans text-sm text-muted-foreground mb-4">
          Permanently delete your account and all saved data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive font-sans text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="font-sans text-sm text-foreground font-medium">
              Type <span className="font-bold text-destructive">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground focus:outline-none focus:border-destructive"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (deleteInput !== 'DELETE') return;
                  setDeleting(true);
                  try {
                    await base44.auth.deleteMe?.();
                  } catch {}
                  base44.auth.logout('/');
                }}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-white font-sans text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">App Info</h2>
        <div className="flex justify-between items-center font-sans text-sm gap-4">
          <span className="text-muted-foreground shrink-0">Bible Text</span>
          <span className="text-foreground font-medium text-right">King James Bible (PCE)</span>
        </div>
        <div className="flex justify-between items-center font-sans text-sm gap-4">
          <span className="text-muted-foreground shrink-0">Last App Revision</span>
          <span className="text-foreground font-medium text-right">{LAST_REVISED}</span>
        </div>
      </div>
    </div>
  );
}