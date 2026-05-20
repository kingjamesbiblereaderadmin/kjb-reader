import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNotifications } from '@/lib/notifications'
import { getDailyVerse } from '@/lib/dailyVerse'

// Set dyslexic font attribute on initial load if enabled
try {
  const dyslexicFont = localStorage.getItem('kjb-dyslexic-font') === 'true';
  if (dyslexicFont) {
    document.documentElement.setAttribute('data-dyslexic-font', 'true');
  }
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
  // In development, unregister any existing service workers to prevent stale cache
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
    // Clear all caches
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  } else {
    // Production: register service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      // Re-arm daily notification scheduler on every app load
      initNotifications(getDailyVerse());
    });
  }
}