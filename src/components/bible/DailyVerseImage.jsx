import React, { useRef, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { renderVerseText } from '@/lib/bibleApi';
import { Download, Share2, Upload, Palette, Type, Eye, Smartphone, Bell, BellOff, Maximize2, ChevronsDown, MoreVertical, Trash2, Image, Copy, Crop, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import ImageCropper from './ImageCropper';
import ShareCard from './ShareCard.jsx';
import { getNotificationsEnabled, requestNotificationPermission, disableNotifications, scheduleDailyNotification } from '@/lib/notifications';
import { formatDailyVerseForCopy } from '@/lib/formatDailyVerse';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';

// Map a font choice to an actual CSS font-family. When an app-wide
// accessibility font is active, it always takes priority.
function resolveFontFamily(choice, a11yFont) {
  if (a11yFont === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
  if (a11yFont === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
  if (a11yFont === 'system') return 'system-ui, -apple-system, sans-serif';
  if (choice === 'sans-serif') return "'Inter', system-ui, -apple-system, sans-serif";
  if (choice === 'monospace') return "'Courier New', monospace";
  if (choice === 'cursive') return "'Dancing Script', cursive";
  if (choice === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
  if (choice === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
  return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
}

const VERSE_BACKGROUNDS = [
  { gradient: 'from-blue-700 via-indigo-600 to-purple-600', accent: 'text-blue-200' },     // Sun — blue/purple
  { gradient: 'from-emerald-700 via-teal-600 to-cyan-600', accent: 'text-emerald-200' },   // Mon — green/teal
  { gradient: 'from-rose-700 via-pink-600 to-fuchsia-600', accent: 'text-rose-200' },       // Tue — rose/pink
  { gradient: 'from-amber-600 via-orange-600 to-red-600', accent: 'text-amber-200' },        // Wed — warm sunset
  { gradient: 'from-cyan-700 via-sky-600 to-blue-600', accent: 'text-cyan-200' },           // Thu — ocean blue
  { gradient: 'from-violet-700 via-purple-600 to-pink-600', accent: 'text-violet-200' },     // Fri — violet/pink
  { gradient: 'from-slate-800 via-indigo-800 to-purple-800', accent: 'text-slate-300' }      // Sat — deep night
];

export default function DailyVerseImage({ verse, onClick, onToggleNotif, notifEnabled }) {
  const dow = new Date().getDay();
  const defaultBg = VERSE_BACKGROUNDS[dow];
  const [customBg, setCustomBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; }
  });
  const [originalBg, setOriginalBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg-original') || ''; } catch { return ''; }
  });
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropImageForNotif, setCropImageForNotif] = useState(false);
  const [pendingBg, setPendingBg] = useState(null);
  const fileInputRef = useRef(null);
  const [notifImage, setNotifImage] = useState(() => {
    try { return localStorage.getItem('kjb-notif-image') || ''; } catch { return ''; }
  });
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showVersePanel, setShowVersePanel] = useState(() => localStorage.getItem('kjb-verse-panel-visible') !== 'false');
  const [showButtons, setShowButtons] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [uploadingComplete, setUploadingComplete] = useState(false);
  const [textColor, setTextColor] = useState(() => localStorage.getItem('kjb-verse-text-color') || '#ffffff');
  const [textOpacity, setTextOpacity] = useState(() => parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '0.95'));
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  // The font actually rendered — accessibility font overrides the verse's own choice
  const resolvedFont = resolveFontFamily(fontFamily, a11yFont);
  
  useEffect(() => {
    const handleStorage = () => {
      try { setCustomBg(localStorage.getItem('kjb-daily-verse-bg') || ''); } catch {}
      try { setTextColor(localStorage.getItem('kjb-verse-text-color') || '#ffffff'); } catch {}
      try { setTextOpacity(parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '1')); } catch {}
      try { setFontFamily(localStorage.getItem('kjb-verse-font-family') || 'serif'); } catch {}
      try { setA11yFont(getAccessibilityFont()); } catch {}
      try { setNotifImage(localStorage.getItem('kjb-notif-image') || ''); } catch {}
      try { setShowVersePanel(localStorage.getItem('kjb-verse-panel-visible') !== 'false'); } catch {}
      setPendingBg(null);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);
    window.addEventListener('kjb-fonts-changed', handleStorage);
    handleStorage();
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
      window.removeEventListener('kjb-fonts-changed', handleStorage);
    };
  }, []);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLightbox]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  const handleUpload = (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large! Please choose an image under 2MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 === 'string') {
        // Store original for future re-cropping
        try { localStorage.setItem('kjb-daily-verse-bg-original', base64); } catch {}
        setOriginalBg(base64);
        setCropImage(base64); // Open cropper instead of saving directly
      }
    };
    reader.onerror = () => {
      alert('Failed to read image');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };
  
  const handleCropComplete = async (croppedDataUrl, forNotification = false) => {
    try {
      if (forNotification) {
        // Save to localStorage for main thread access
        localStorage.setItem('kjb-notif-image', croppedDataUrl);
        setNotifImage(croppedDataUrl);
        
        // Also save to cache for service worker access
        try {
          const cache = await caches.open('kjb-notif-images');
          const response = new Response(croppedDataUrl, {
            headers: { 'Content-Type': 'image/png' }
          });
          await cache.put('/notif-image', response);
          console.log('[Notif] Custom image saved to SW cache');
        } catch (cacheErr) {
          console.warn('[Notif] Failed to save image to cache:', cacheErr.message);
        }
      } else {
        // Just set pending state - don't save to localStorage yet
        setPendingBg(croppedDataUrl);
      }
      setCropImage(null);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleTextColorChange = (color) => {
    setTextColor(color);
    try { localStorage.setItem('kjb-verse-text-color', color); } catch {}
    window.dispatchEvent(new Event('storage'));
  };

  const handleTextOpacityChange = (opacity) => {
    setTextOpacity(opacity);
    try { localStorage.setItem('kjb-verse-text-opacity', String(opacity)); } catch {}
    window.dispatchEvent(new Event('storage'));
  };

  const handleFontFamilyChange = (font) => {
    // Dyslexic & Legible are accessibility fonts — apply them app-wide (mirrors
    // the reader). setAccessibilityFont fires its own 'storage' event.
    if (font === 'dyslexic' || font === 'hyperlegible') {
      setAccessibilityFont(font);
      setA11yFont(font);
      window.dispatchEvent(new Event('kjb-fonts-changed'));
      return;
    }
    // Picking a normal font must turn OFF any active accessibility font.
    // Write the verse font BEFORE disabling a11y (setAccessibilityFont fires
    // 'kjb-fonts-changed' synchronously, which re-reads this key) to avoid revert.
    try { localStorage.setItem('kjb-verse-font-family', font); } catch {}
    setFontFamily(font);
    if (a11yFont !== 'default') {
      setAccessibilityFont('default');
      setA11yFont('default');
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
  };


  

  
  const verseRef = useRef(null);
  const shareCardRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState(() => {
    try { return localStorage.getItem('kjb-logo-base64') || ''; } catch { return ''; }
  });
  const logoDataUrlRef = useRef(logoDataUrl);

  // Get the real app PNG as a base64 data URL via the backend function (no CORS,
  // always same-origin). Cached in localStorage so we only fetch once.
  const fetchLogoDataUrl = async () => {
    if (logoDataUrlRef.current) return logoDataUrlRef.current;
    try {
      const res = await base44.functions.invoke('fetchLogoBase64', {});
      const dataUrl = res?.data?.dataUrl;
      if (dataUrl) {
        logoDataUrlRef.current = dataUrl;
        setLogoDataUrl(dataUrl);
        try { localStorage.setItem('kjb-logo-base64', dataUrl); } catch {}
        return dataUrl;
      }
    } catch (err) {
      console.warn('[ShareCard] logo fetch failed', err);
    }
    return '';
  };

  // Pre-fetch on mount so the card usually already has it.
  useEffect(() => { fetchLogoDataUrl(); }, []);

  // Capture the fixed 1024×1024 ShareCard (used for download + share/copy).
  // Returns a PNG blob. The card uses the default gradient design always.
  const captureShareCard = async () => {
    // Guarantee the logo is available as a same-origin data URL before capture.
    await fetchLogoDataUrl();
    // Give React a tick to render the <img> with the data URL src.
    await new Promise(r => setTimeout(r, 50));
    const el = shareCardRef.current;
    // Wait for the logo <img> (data URL) to actually decode so it appears in
    // the snapshot instead of an empty placeholder box.
    const imgs = Array.from(el.querySelectorAll('img'));
    await Promise.all(imgs.map(img => (
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise(res => {
            const done = () => res();
            img.onload = done;
            img.onerror = done;
            setTimeout(done, 4000);
          })
    )));
    // Small settle delay so a just-decoded image is painted before capture.
    await new Promise(r => setTimeout(r, 150));
    const canvas = await html2canvas(el, { backgroundColor: null, scale: 1, useCORS: true });
    return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  };
  
  const bgStyle = (pendingBg || customBg)
    ? { backgroundImage: `url(${pendingBg || customBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};
  const gradientClass = (pendingBg || customBg) ? '' : `bg-gradient-to-br ${defaultBg.gradient}`;
  const accentClass = (pendingBg || customBg) ? 'text-white' : defaultBg.accent;
  const hasCustomBg = !!(pendingBg || customBg);

  const handleDownload = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    try {
      const blob = await captureShareCard();
      const link = document.createElement('a');
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      link.download = `daily-verse-${dateStr}.png`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  const handleSetWallpaper = async (e) => {
    e.stopPropagation();
    setCapturing(true);
    setShowButtons(false);
    try {
      // If custom background image exists, use it directly for wallpaper
      if (customBg) {
        const link = document.createElement('a');
        link.download = `wallpaper-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = customBg;
        link.click();
        
        // Show platform-specific instructions
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        setTimeout(() => {
          if (isIOS) {
            alert('📱 iPhone:\n1. Open Photos app\n2. Tap the downloaded image\n3. Tap Share → "Use as Wallpaper"');
          } else if (isAndroid) {
            alert('📱 Android:\n1. Open Gallery/Photos\n2. Long-press the image\n3. Tap "Set as" → "Wallpaper"');
          } else {
            alert('💻 Desktop:\n1. Right-click the downloaded image\n2. Choose "Set as desktop background"\n   (or right-click desktop → Personalize)');
          }
        }, 500);
        setShowButtons(true);
      } else {
        // No custom image, capture verse card as before
        await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await html2canvas(verseRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
        });
        const link = document.createElement('a');
        link.download = `daily-verse-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setShowButtons(true);
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        setTimeout(() => {
          if (isIOS) {
            alert('📱 iPhone:\n1. Open Photos app\n2. Tap the downloaded image\n3. Tap Share → "Use as Wallpaper"');
          } else if (isAndroid) {
            alert('📱 Android:\n1. Open Gallery/Photos\n2. Long-press the image\n3. Tap "Set as" → "Wallpaper"');
          } else {
            alert('💻 Desktop:\n1. Right-click the downloaded image\n2. Choose "Set as desktop background"');
          }
        }, 500);
      }
    } catch (err) {
      console.error('Failed to set wallpaper:', err);
      alert('Failed to generate image. Please try again.');
      setShowButtons(true);
    }
    setCapturing(false);
  };

  const handleShare = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowMenu(false);
    try {
      // Capture the fixed square ShareCard for sharing/copying
      const blob = await captureShareCard();

      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      // Only use Web Share API if explicitly triggered by user (not on app open)
      if (e && navigator.share && navigator.canShare({ files: [new File([blob], 'verse.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'Daily Verse - KJB Reader',
          text: formatDailyVerseForCopy(verse),
          files: [new File([blob], `daily-verse-${dateStr}.png`, { type: 'image/png' })],
        });
      } else {
        // Try clipboard image
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('Image copied to clipboard!');
        } catch {}
      }
    } catch (err) {
      console.error('Image share failed:', err);
      // Fallback: copy text to clipboard
      await navigator.clipboard.writeText(formatDailyVerseForCopy(verse));
      alert('Verse copied to clipboard!');
    }
  };

  const handleCopyVerse = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(formatDailyVerseForCopy(verse));
      alert('Verse copied to clipboard!');
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to copy verse:', err);
      alert('Failed to copy verse');
    }
  };

  return (
    <div ref={verseRef} onClick={(e) => { if (!uploadingComplete && !showLightbox) onClick(e); }} className={`w-full min-h-[300px] ${gradientClass} rounded-2xl shadow-lg px-6 text-center text-white relative flex flex-col ${capturing ? 'pt-20 pb-24' : 'pt-6 pb-12'} ${uploadingComplete ? 'cursor-default' : 'cursor-pointer'}`} style={bgStyle} onTouchEnd={(e) => { if (!uploadingComplete && !showLightbox) onClick(e); }}>
      {/* Notification bell indicator button */}
      {showButtons && onToggleNotif && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            onToggleNotif();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            onToggleNotif();
          }}
          className="absolute top-2 left-2 p-1.5 rounded-md bg-white/90 hover:bg-white transition-colors z-10 shadow-md"
          title={notifEnabled ? 'Daily verse reminders on (updates when app opens)' : 'Reminders off'}
          type="button"
        >
          {notifEnabled ? <Bell className="w-4 h-4 text-slate-800" /> : <BellOff className="w-4 h-4 text-slate-800" />}
        </button>
      )}

      {/* Capture-only website URL — shown only in the downloaded/copied/shared image */}
      {capturing && (
        <span
          className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans font-bold z-10"
          style={{ color: textColor, opacity: Math.min(1, textOpacity + 0.05), fontSize: '16px', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
        >
          KingJamesBibleReader.com
        </span>
      )}

      {/* Date display — centered at the bottom (above the URL during capture) */}
      <span
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap ${capturing ? 'bottom-12' : 'bottom-6'}`}
        style={{
          backgroundColor: hasCustomBg ? 'rgba(0, 0, 0, 0.55)' : 'rgba(55, 48, 163, 0.65)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '11px',
          color: 'rgba(255,255,255,0.98)',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.03em',
          lineHeight: '13px',
          padding: '8px 18px',
          boxShadow: '0 3px 9px rgba(0,0,0,0.3)',
        }}
      >
        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </span>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
        {!capturing && showButtons ? (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setShowLightbox(true);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setShowLightbox(true);
              }}
              className="p-1 rounded-md bg-white hover:bg-slate-100 transition-colors shadow-md"
              title="View in full screen"
              type="button"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-800" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                handleShare(e);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                handleShare(e);
              }}
              disabled={capturing}
              className="p-1 rounded-md bg-white hover:bg-slate-100 transition-colors shadow-md disabled:opacity-50"
              title="Share verse image"
              type="button"
            >
              {capturing ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-slate-800" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                handleDownload(e);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                handleDownload(e);
              }}
              disabled={capturing}
              className="p-1 rounded-md bg-white hover:bg-slate-100 transition-colors shadow-md disabled:opacity-50"
              title="Download verse image"
              type="button"
            >
              {capturing ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-800" />
              )}
            </button>
            {/* Unified menu button */}
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (!showStyleEditor) {
                    setShowMenu(!showMenu);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (!showStyleEditor) {
                    setShowMenu(!showMenu);
                  }
                }}
                className="p-1.5 rounded-md bg-white hover:bg-slate-100 transition-colors shadow-md"
                title="More options"
                type="button"
              >
                <MoreVertical className="w-4 h-4 text-slate-800" />
              </button>
              {/* Dropdown menu */}
              {showMenu && (
                <div
                  className="absolute right-0 top-8 z-30 bg-white rounded-lg shadow-xl border border-slate-200 py-1 w-48"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      handleCopyVerse(e);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Verse
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      const newValue = !showVersePanel;
                      setShowVersePanel(newValue);
                      localStorage.setItem('kjb-verse-panel-visible', String(newValue));
                      window.dispatchEvent(new Event('storage'));
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {showVersePanel ? 'Hide Panel' : 'Show Panel'}
                  </button>
                  {!showStyleEditor && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setShowStyleEditor(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      Text Style
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setCropImageForNotif(false);
                      setShowMenu(false);
                      // Trigger file input immediately
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setCropImageForNotif(false);
                      setShowMenu(false);
                      // Trigger file input immediately on mobile
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={uploading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <Image className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Change Background'}
                  </button>
                  {(originalBg || customBg || pendingBg) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setCropImageForNotif(false);
                        // Prefer original (uncropped) image when re-cropping
                        setCropImage(originalBg || pendingBg || customBg);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Crop className="w-4 h-4" />
                      Crop Background
                    </button>
                  )}
                  {(customBg || pendingBg) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        if (pendingBg) {
                          setPendingBg(null);
                        } else {
                          setCustomBg('');
                          setOriginalBg('');
                          localStorage.removeItem('kjb-daily-verse-bg');
                          localStorage.removeItem('kjb-daily-verse-bg-original');
                          // Reset text color and opacity to defaults
                          handleTextColorChange('#ffffff');
                          handleTextOpacityChange(0.95);
                          handleFontFamilyChange('serif');
                          window.dispatchEvent(new Event('storage'));
                        }
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Custom Background
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setShowButtons(false);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronsDown className="w-4 h-4 rotate-180" />
                    Hide All Buttons
                  </button>
                </div>
              )}
            </div>

          </>
        ) : !capturing ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setShowButtons(true);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setShowButtons(true);
            }}
            className="p-1 rounded-md bg-white hover:bg-slate-100 transition-colors shadow-md"
            title="Show buttons"
            type="button"
          >
            <ChevronsDown className="w-3.5 h-3.5 text-slate-800 rotate-90" />
          </button>
        ) : null}
      </div>

      {/* Style Editor Panel */}
      {showStyleEditor && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          className="absolute top-12 right-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-xl p-4 w-72 border border-white/20"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-sans text-sm font-semibold text-slate-800 dark:text-slate-200">Text Style</h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setShowStyleEditor(false);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setShowStyleEditor(false);
              }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Upload className="w-4 h-4 rotate-45 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Text Color */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 font-sans text-xs font-medium text-slate-700 dark:text-slate-300">
                <Palette className="w-3.5 h-3.5" />
                Text Color
              </label>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  handleTextColorChange('#ffffff');
                  handleTextOpacityChange(0.95);
                  handleFontFamilyChange('serif');
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  handleTextColorChange('#ffffff');
                  handleTextOpacityChange(0.95);
                  handleFontFamilyChange('serif');
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-accent/20 text-slate-700 dark:text-slate-300 font-sans text-[10px] font-medium transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                '#000000', '#1a1a1a', '#ffffff', '#f8f8f8',
                '#fef3c7', '#fde68a', '#fbbf24', '#f59e0b',
                '#dbeafe', '#93c5fd', '#3b82f6', '#1e40af',
                '#fecaca', '#fca5a5', '#ef4444', '#b91c1c',
                '#ddd6fe', '#a78bfa', '#8b5cf6', '#5b21b6',
                '#bbf7d0', '#6ee7b7', '#10b981', '#047857',
                '#ffe4e6', '#fda4af', '#ec4899', '#9d174d',
                '#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1'
              ].map(color => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    handleTextColorChange(color);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    handleTextColorChange(color);
                  }}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    textColor === color ? 'border-slate-800 scale-110' : 'border-slate-300 hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Text Opacity */}
          <div className="mb-4">
            <label className="flex items-center gap-2 font-sans text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Eye className="w-3.5 h-3.5" />
              Opacity: {Math.round(textOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={textOpacity}
              onChange={(e) => handleTextOpacityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-800 dark:accent-slate-200"
            />
          </div>

          {/* Font Family */}
          <div className="mb-2">
            <label className="flex items-center gap-2 font-sans text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Type className="w-3.5 h-3.5" />
              Font Family
            </label>
            {a11yFont !== 'default' && (
              <p className="font-sans text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-snug">
                An accessibility font is active app-wide and overrides reading fonts. Pick another accessibility font, or disable it in Settings → Accessibility.
              </p>
            )}
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'serif', label: 'Serif' },
                { value: 'sans-serif', label: 'Sans' },
                { value: 'monospace', label: 'Mono' },
                { value: 'cursive', label: 'Cursive' },
                { value: 'dyslexic', label: 'Dyslexic' },
                { value: 'hyperlegible', label: 'Legible' },
              ].map(font => {
                const isA11yChoice = font.value === 'dyslexic' || font.value === 'hyperlegible';
                const a11yActive = a11yFont !== 'default';
                const isActive = a11yActive ? a11yFont === font.value : fontFamily === font.value;
                const isDisabled = a11yActive && !isA11yChoice;
                return (
                <button
                  key={font.value}
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    handleFontFamilyChange(font.value);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    handleFontFamilyChange(font.value);
                  }}
                  className={`px-1.5 py-1.5 rounded-md font-sans text-[10px] font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  {font.label}
                </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          handleUpload(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        className="hidden"
      />
      
      {/* Capture-only logo (top-left) — shown only in the downloaded/copied/shared image */}
      {capturing && (
        <img
          src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png"
          alt="KJB Reader"
          crossOrigin="anonymous"
          className="absolute top-4 left-4 w-14 h-14 rounded-lg shadow-md z-10"
        />
      )}

      {showVersePanel ? (
        <div className="px-2 pt-2 pb-10 text-center flex-1 flex flex-col w-full max-w-full overflow-hidden">
          <div className={`inline-flex self-center items-center justify-center gap-4 mt-3 mb-8 ${hasCustomBg ? 'rounded-2xl bg-black/25 backdrop-blur-[2px] px-5 py-2' : ''}`}>
            <span className="h-px w-12 bg-current opacity-50" style={{ color: textColor }} />
            <p 
              className={`font-sans text-lg md:text-xl font-black tracking-[0.22em] uppercase ${accentClass}`}
              style={{ opacity: 1, color: textColor, fontFamily: "'Inter', system-ui, sans-serif", textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)' }}
            >
              Verse of the Day
            </p>
            <span className="h-px w-12 bg-current opacity-50" style={{ color: textColor }} />
          </div>
          <div className="flex-1 flex flex-col justify-center">
          <div className={hasCustomBg ? 'mx-auto max-w-2xl rounded-2xl bg-black/20 backdrop-blur-[2px] px-6 py-6' : ''}>
          <blockquote 
            className="text-center text-3xl md:text-4xl leading-relaxed [&_em]:italic break-words"
            style={{ 
              color: textColor, 
              opacity: textOpacity, 
              fontFamily: resolvedFont,
              fontWeight: '700',
              textShadow: '0 2px 8px rgba(0,0,0,0.35)',
              overflowWrap: 'break-word',
              wordBreak: 'break-word'
            }}
          >
            "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
          </blockquote>
          <p 
            className="font-sans text-base md:text-lg font-semibold mt-5 text-center"
            style={{ 
              opacity: Math.min(1, textOpacity + 0.05), 
              color: textColor, 
              fontFamily: resolvedFont,
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            — {verse.ref}
          </p>
          </div>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 text-center flex-1 flex flex-col justify-center">
          <div className={`inline-flex self-center items-center justify-center gap-4 mb-6 ${hasCustomBg ? 'rounded-2xl bg-black/25 backdrop-blur-[2px] px-5 py-2' : ''}`}>
            <span className="h-px w-12 bg-current opacity-50" style={{ color: textColor }} />
            <p 
              className={`font-sans text-lg md:text-xl font-black tracking-[0.22em] uppercase ${accentClass}`}
              style={{ opacity: 1, color: textColor, fontFamily: "'Inter', system-ui, sans-serif", textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)' }}
            >
              Verse of the Day
            </p>
            <span className="h-px w-12 bg-current opacity-50" style={{ color: textColor }} />
          </div>
          <blockquote 
            className="text-center text-2xl md:text-3xl leading-relaxed [&_em]:italic break-words"
            style={{ 
              color: textColor, 
              opacity: textOpacity, 
              fontFamily: resolvedFont,
              fontWeight: '700',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              overflowWrap: 'break-word',
              wordBreak: 'break-word'
            }}
          >
            "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
          </blockquote>
          <p 
            className="font-sans text-base font-semibold mt-4 text-center"
            style={{ 
              opacity: Math.min(1, textOpacity + 0.05), 
              color: textColor, 
              fontFamily: resolvedFont,
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            — {verse.ref}
          </p>
        </div>
      )}
      {/* Crop Modal - positioned near verse card */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          positionMode="overlay"
          onCrop={(cropped) => {
            setCropImage(null);
            if (cropImageForNotif) {
              handleCropComplete(cropped, true);
            } else {
              // Save the actual cropped image as the background
              try {
                localStorage.setItem('kjb-daily-verse-bg', cropped);
                setCustomBg(cropped);
                setPendingBg(null);
                window.dispatchEvent(new Event('storage'));
              } catch (err) {
                if (err.name === 'QuotaExceededError') {
                  alert('Storage full! Please clear browser data or try a smaller image.');
                } else {
                  console.error('Failed to save cropped background:', err);
                }
              }
            }
          }}
          onCancel={() => {
            setCropImage(null);
            setCropImageForNotif(false);
            setPendingBg(null);
          }}
        />
      )}

      {/* Save/Cancel buttons for pending background (only for crop-to-background flow) */}
      {pendingBg && !cropImage && !cropImageForNotif && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setPendingBg(null);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setPendingBg(null);
            }}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors shadow-lg"
          >
            Cancel
          </button>
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              try {
                // Clear any existing images first to free up space
                try {
                  localStorage.removeItem('kjb-daily-verse-bg');
                  localStorage.removeItem('kjb-notif-image');
                } catch {}
                try {
                  const cache = await caches.open('kjb-notif-images');
                  await cache.delete('/notif-image');
                } catch {}
                
                // Save new background
                try {
                  localStorage.setItem('kjb-daily-verse-bg', pendingBg);
                } catch (storageErr) {
                  if (storageErr.name === 'QuotaExceededError') {
                    alert('Storage full! Please clear browser data or try a smaller image.');
                    console.error('localStorage quota exceeded:', storageErr);
                    return;
                  }
                  throw storageErr;
                }
                
                setCustomBg(pendingBg);
                setPendingBg(null);
                setUploadingComplete(true);
                
                // Auto-detect if background is light or dark and adjust text color
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;
                  let r = 0, g = 0, b = 0;
                  for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                  }
                  const avg = (r + g + b) / (3 * (data.length / 4));
                  if (avg > 128) {
                    handleTextColorChange('#1a1a1a');
                  } else {
                    handleTextColorChange('#ffffff');
                  }
                };
                img.src = pendingBg;
                
                window.dispatchEvent(new Event('storage'));
              } catch (err) {
                console.error('Failed to save background:', err);
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
          >
            Save Image
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto py-6"
          style={{ width: '100vw', height: '100vh', top: 0, left: 0 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            setShowLightbox(false);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            setShowLightbox(false);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          <div
            className={`relative max-w-4xl w-full mx-4 p-8 md:p-12 rounded-2xl shadow-2xl text-center ${gradientClass}`}
            style={bgStyle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setShowLightbox(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setShowLightbox(false);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              type="button"
            >
              <Upload className="w-5 h-5 text-white rotate-45" />
            </button>
            <p 
              className={`font-sans text-xs font-semibold tracking-widest uppercase mb-6 ${accentClass}`}
              style={{ opacity: 0.8 * textOpacity, color: textColor, fontFamily: resolvedFont }}
            >
              Verse of the Day
            </p>
            <blockquote 
              className="text-3xl md:text-5xl leading-relaxed mb-8 [&_em]:italic"
              style={{ 
                color: textColor, 
                opacity: textOpacity, 
                fontFamily,
                fontWeight: '700',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
            </blockquote>
            <p 
              className="font-sans text-xl md:text-2xl font-semibold"
              style={{ 
                opacity: Math.min(1, textOpacity + 0.05), 
                color: textColor, 
                fontFamily,
                textShadow: '0 1px 4px rgba(0,0,0,0.3)'
              }}
            >
              — {verse.ref}
            </p>
            <div 
              className={`mt-8 w-16 h-1 mx-auto ${accentClass}`}
              style={{ opacity: 0.75 * textOpacity, backgroundColor: textColor }}
            />
          </div>
        </div>
      )}

      {/* Off-screen fixed-size card used for the shared/downloaded image */}
      <ShareCard ref={shareCardRef} verse={verse} logoSrc={logoDataUrl} fontFamily={resolvedFont} />
    </div>
  );
}