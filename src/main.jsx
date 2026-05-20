import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNotifications } from '@/lib/notifications'
import { getDailyVerse } from '@/lib/dailyVerse'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register service worker for offline support (disabled in dev to prevent cache issues)
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    // Re-arm daily notification scheduler on every app load
    initNotifications(getDailyVerse());
  });
}