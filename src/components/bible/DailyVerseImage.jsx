import React, { useRef, useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { renderVerseText } from '@/lib/bibleApi';
import { Download, Share2, Upload, Palette, Type, Eye, Smartphone, Bell, BellOff, Maximize2, ChevronsDown, MoreVertical, Trash2, Image, Copy, Crop, RotateCcw, X, Printer } from 'lucide-react';
import { getNotificationsEnabled, requestNotificationPermission, disableNotifications, scheduleDailyNotification } from '@/lib/notifications';

const ImageCropper = React.lazy(() => import('./ImageCropper'));
const ShareCard = React.lazy(() => import('./ShareCard.jsx'));
import { formatDailyVerseForCopy, cleanVerseText } from '@/lib/formatDailyVerse';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import { VERSE_BACKGROUNDS } from '@/lib/dailyVerseTheme';
import { shrinkImageUnderLimit } from '@/lib/imageCompress';

// Map a font choice to an actual CSS font-family. When an app-wide
// accessibility font is active, it always takes priority.
function resolveFontFamily(choice, a11yFont) {
  if (a11yFont === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
  if (a11yFont === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
  if (a11yFont === 'system') return 'system-ui, -apple-system, sans-serif';
  return null;
}

// The font for UI chrome (header label, date pill). Follows the accessibility
// font when active, otherwise stays Inter so chrome is consistent.
function resolveUiFont(a11yFont) {
  if (a11yFont === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
  if (a11yFont === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
  if (a11yFont === 'system') return 'system-ui, -apple-system, sans-serif';
  return "'Inter', system-ui, sans-serif";
}

function resolveVerseFontFamily(choice, a11yFont) {
  const a11y = resolveFontFamily(null, a11yFont);
  if (a11y) return a11y;
  if (choice === 'serif') return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
  if (choice === 'sans-serif') return "'Inter', system-ui, -apple-system, sans-serif";
  if (choice === 'monospace') return "'Courier New', monospace";
  if (choice === 'cursive') return "'Dancing Script', cursive";
  if (choice === 'comic-sans') return "'Comic Sans MS', 'Comic Sans', cursive";
  if (choice === 'times') return "'Times New Roman', Times, serif";
  if (choice === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
  if (choice === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
  return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
}

export default function DailyVerseImage({ verse, onClick, onToggleNotif, notifEnabled, isOffline }) {
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
  // Remembers the last crop/zoom/aspect used, so re-opening the cropper on
  // an already-cropped image starts from where the user left it instead of
  // resetting to centered/100%/square every time.
  const [lastCropSettings, setLastCropSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('kjb-daily-verse-crop-settings');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
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
  const [textOpacity, setTextOpacity] = useState(() => parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '1'));
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  // The font actually rendered — accessibility font overrides the verse's own choice
  const resolvedFont = resolveVerseFontFamily(fontFamily, a11yFont);
  // UI chrome (header label, date pill) — follows the accessibility font too
  const uiFont = resolveUiFont(a11yFont);

  // Web fonts (OpenDyslexic, Atkinson Hyperlegible, Dancing Script) are loaded
  // lazily from a CDN. Until the browser actually fetches the font file, the
  // card renders a fallback — so the on-screen card "doesn't show" the chosen
  // font. Force-load the active font so it applies immediately on screen.
  useEffect(() => {
    try {
      if (!document.fonts) return;
      let fam = null;
      if (/opendyslexic/i.test(resolvedFont)) fam = 'OpenDyslexic';
      else if (/atkinson hyperlegible/i.test(resolvedFont)) fam = 'Atkinson Hyperlegible';
      else if (/dancing script/i.test(resolvedFont)) fam = 'Dancing Script';
      if (fam) {
        document.fonts.load(`700 48px "${fam}"`);
        document.fonts.load(`italic 700 48px "${fam}"`);
      }
    } catch {}
  }, [resolvedFont]);

  const textLen = verse?.text?.length || 0;
  // Scale text by verse length. The smallest size is the narrow-phone base
  // (default Tailwind), bumping up at the `xs` (420px) and `md` breakpoints so
  // long verses never overflow on small screens.
  let panelTextClass = fontFamily === 'cursive' ? 'text-4xl xs:text-5xl md:text-6xl' : 'text-3xl xs:text-4xl md:text-5xl';
  let lightboxTextClass = fontFamily === 'cursive' ? 'text-4xl md:text-6xl' : 'text-4xl md:text-6xl';
  if (textLen > 400) {
    panelTextClass = fontFamily === 'cursive' ? 'text-xl xs:text-2xl md:text-3xl' : 'text-lg xs:text-xl md:text-2xl';
    lightboxTextClass = fontFamily === 'cursive' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl';
  } else if (textLen > 250) {
    panelTextClass = fontFamily === 'cursive' ? 'text-2xl xs:text-3xl md:text-4xl' : 'text-xl xs:text-2xl md:text-3xl';
    lightboxTextClass = fontFamily === 'cursive' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl';
  } else if (textLen > 150) {
    panelTextClass = fontFamily === 'cursive' ? 'text-3xl xs:text-4xl md:text-5xl' : 'text-2xl xs:text-3xl md:text-4xl';
    lightboxTextClass = fontFamily === 'cursive' ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl';
  }

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
  
  const handleUpload = async (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await shrinkImageUnderLimit(file);
      // Store original for future re-cropping
      try { localStorage.setItem('kjb-daily-verse-bg-original', base64); } catch {}
      setOriginalBg(base64);
      setCropImage(base64); // Open cropper instead of saving directly
    } catch (err) {
      alert(err.message || 'Failed to process image');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    // Ensure the active accessibility/reading web font is fully loaded BEFORE
    // html2canvas snapshots — otherwise it falls back to a default font and the
    // shared image won't match the on-screen card (e.g. OpenDyslexic dropped).
    try {
      if (document.fonts) {
        const fams = [];
        if (/opendyslexic/i.test(resolvedFont)) fams.push('OpenDyslexic');
        else if (/atkinson hyperlegible/i.test(resolvedFont)) fams.push('Atkinson Hyperlegible');
        else if (/dancing script/i.test(resolvedFont)) fams.push('Dancing Script');
        await Promise.all([
          ...fams.flatMap(f => [
            document.fonts.load(`700 48px "${f}"`),
            document.fonts.load(`italic 700 48px "${f}"`),
          ]),
          document.fonts.ready,
        ]);
      }
    } catch {}
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
    const html2canvas = (await import('html2canvas')).default;
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

  const handlePrint = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }
    
    printWindow.document.write('<html><head><title>Print Verse</title></head><body><div style="font-family:sans-serif;text-align:center;padding:50px;">Preparing image for print...</div></body></html>');
    printWindow.document.close();
    
    try {
      const blob = await captureShareCard();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Verse</title>
              <style>
                @page { margin: 0; size: auto; }
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: white; overflow: hidden; }
                img { max-width: 100%; max-height: 100%; object-fit: contain; page-break-inside: avoid; display: block; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="setTimeout(() => { window.print(); }, 150);" />
            </body>
          </html>
        `);
        printWindow.document.close();
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to print image:', err);
      printWindow.close();
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
        const html2canvas = (await import('html2canvas')).default;
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
    <div ref={verseRef} onClick={(e) => { if (!uploadingComplete && !showLightbox) onClick(e); }} className={`w-full min-h-[300px] ${gradientClass} border border-border rounded-2xl shadow-lg px-1 sm:px-3 text-center text-white relative flex flex-col ${capturing ? 'pt-20 pb-8' : 'pt-4 pb-4'} ${uploadingComplete ? 'cursor-default' : 'cursor-pointer transition-all duration-300 hover:shadow-xl'}`} style={bgStyle}>
      {/* Notification bell indicator button */}
      {showButtons && onToggleNotif && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleNotif();
          }}
          className="absolute top-2 left-2 p-1.5 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/40 shadow-md transition-colors z-10 touch-manipulation"
          title={notifEnabled ? 'Daily verse reminders on (updates when app opens)' : 'Reminders off'}
          type="button"
        >
          {notifEnabled ? <Bell className="w-3.5 h-3.5 pointer-events-none text-white drop-shadow" /> : <BellOff className="w-3.5 h-3.5 opacity-70 pointer-events-none text-white drop-shadow" />}
        </button>
      )}

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 z-[80]" onClick={(e) => e.stopPropagation()}>
        {!capturing && showButtons ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLightbox(true);
              }}
              className="p-1.5 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/40 shadow-md transition-colors touch-manipulation"
              title="View in full screen"
              type="button"
            >
              <Maximize2 className="w-3.5 h-3.5 pointer-events-none text-white drop-shadow" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare(e);
              }}
              disabled={capturing}
              className="p-1.5 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/40 shadow-md transition-colors disabled:opacity-50 touch-manipulation"
              title="Share verse image"
              type="button"
            >
              {capturing ? (
                <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin block pointer-events-none border-white" style={{ borderTopColor: 'transparent' }} />
              ) : (
                <Share2 className="w-3.5 h-3.5 pointer-events-none text-white drop-shadow" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(e);
              }}
              disabled={capturing}
              className="p-1.5 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/40 shadow-md transition-colors disabled:opacity-50 touch-manipulation"
              title="Download verse image"
              type="button"
            >
              {capturing ? (
                <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin block pointer-events-none border-white" style={{ borderTopColor: 'transparent' }} />
              ) : (
                <Download className="w-3.5 h-3.5 pointer-events-none text-white drop-shadow" />
              )}
            </button>
            <button
              onClick={handlePrint}
              disabled={capturing}
              className="p-1.5 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/40 shadow-md transition-colors disabled:opacity-50 touch-manipulation"
              title="Print verse image"
              type="button"
            >
              <Printer className="w-3.5 h-3.5 pointer-events-none text-white drop-shadow" />
            </button>
            {/* Unified menu button */}
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showStyleEditor) {
                    setShowMenu(!showMenu);
                  }
                }}
                className="p-1.5 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/40 shadow-md transition-colors touch-manipulation"
                title="More options"
                type="button"
              >
                <MoreVertical className="w-3.5 h-3.5 pointer-events-none text-white drop-shadow" />
              </button>
              {/* Dropdown menu */}
              {showMenu && (
                <div
                  className="absolute right-0 top-8 z-[90] bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden w-48 py-0"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyVerse(e);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation"
                  >
                    <Copy className="w-4 h-4 pointer-events-none" />
                    Copy Verse
                  </button>
                  {hasCustomBg && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = !showVersePanel;
                        setShowVersePanel(newValue);
                        localStorage.setItem('kjb-verse-panel-visible', String(newValue));
                        window.dispatchEvent(new Event('storage'));
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation"
                    >
                      <Eye className="w-4 h-4 pointer-events-none" />
                      {showVersePanel ? 'Hide Panel' : 'Show Panel'}
                    </button>
                  )}
                  {!showStyleEditor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStyleEditor(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation"
                    >
                      <Palette className="w-4 h-4 pointer-events-none" />
                      Text Style
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCropImageForNotif(false);
                      setShowMenu(false);
                      // Trigger file input immediately
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={uploading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 touch-manipulation"
                  >
                    <Image className="w-4 h-4 pointer-events-none" />
                    {uploading ? 'Uploading...' : 'Change Background'}
                  </button>
                  {(originalBg || customBg || pendingBg) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCropImageForNotif(false);
                        // Prefer original (uncropped) image when re-cropping
                        setCropImage(originalBg || pendingBg || customBg);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation"
                    >
                      <Crop className="w-4 h-4 pointer-events-none" />
                      Crop Background
                    </button>
                  )}
                  {(customBg || pendingBg) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pendingBg) {
                          setPendingBg(null);
                        } else {
                          setCustomBg('');
                          setOriginalBg('');
                          localStorage.removeItem('kjb-daily-verse-bg');
                          localStorage.removeItem('kjb-daily-verse-bg-original');
                          // Reset text color and opacity to defaults
                          handleTextColorChange('#ffffff');
                          handleTextOpacityChange(1);
                          handleFontFamilyChange('serif');
                          window.dispatchEvent(new Event('storage'));
                        }
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                      Remove Custom Background
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowButtons(false);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation"
                  >
                    <ChevronsDown className="w-4 h-4 rotate-180 pointer-events-none" />
                    Hide All Buttons
                  </button>
                </div>
              )}
            </div>

          </>
        ) : !capturing ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowButtons(true);
            }}
            className="p-1.5 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/75 backdrop-blur-md border border-white/40 shadow-md transition-colors touch-manipulation"
            title="Show buttons"
            type="button"
          >
            <ChevronsDown className="w-3.5 h-3.5 rotate-90 pointer-events-none text-white drop-shadow" />
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
            <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTextColorChange('#ffffff');
                handleTextOpacityChange(1);
                handleFontFamilyChange('serif');
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-accent/20 text-slate-700 dark:text-slate-300 font-sans text-[10px] font-medium transition-colors touch-manipulation"
            >
              <RotateCcw className="w-2.5 h-2.5 pointer-events-none" />
              Reset All
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStyleEditor(false);
              }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors touch-manipulation"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none" />
            </button>
            </div>
          </div>

          {/* Text Color */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 font-sans text-xs font-medium text-slate-700 dark:text-slate-300">
                <Palette className="w-3.5 h-3.5" />
                Text Color
              </label>
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
            {/* Standard fonts */}
            <p className="font-sans text-[10px] text-slate-500 dark:text-slate-400 mb-1">Standard</p>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {[
                { value: 'serif', label: 'Serif', cssFamily: "'Merriweather', 'Cormorant Garamond', Georgia, serif" },
                { value: 'sans-serif', label: 'Sans', cssFamily: "'Inter', system-ui, sans-serif" },
                { value: 'monospace', label: 'Mono', cssFamily: "'Courier New', monospace" },
                { value: 'cursive', label: 'Cursive', cssFamily: "'Dancing Script', cursive" },
                { value: 'comic-sans', label: 'Comic', cssFamily: "'Comic Sans MS', 'Comic Sans', cursive" },
              ].map(font => {
                const a11yActive = a11yFont !== 'default';
                const isActive = !a11yActive && fontFamily === font.value;
                const isDisabled = a11yActive;
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
                  style={{ fontFamily: font.cssFamily }}
                  className={`kjb-font-preview px-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
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
            {/* Accessibility fonts */}
            <p className="font-sans text-[10px] text-slate-500 dark:text-slate-400 mt-3 mb-1.5">Accessibility</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: 'dyslexic', label: 'Dyslexic', cssFamily: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
                { value: 'hyperlegible', label: 'Legible', cssFamily: "'Atkinson Hyperlegible', system-ui, sans-serif" },
              ].map(font => {
                const a11yActive = a11yFont !== 'default';
                const isActive = a11yActive ? a11yFont === font.value : false;
                return (
                <button
                  key={font.value}
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
                  style={{ fontFamily: font.cssFamily }}
                  className={`kjb-font-preview px-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
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

      {/* The "verse panel" toggle controls only the translucent backdrop box
          behind the content (for readability against a custom photo
          background) — the verse text, reference, and date always stay
          visible either way. */}
      <div className="px-1 pt-2 pb-2 text-center flex-1 flex flex-col w-full max-w-full">
        <div className={`flex-1 flex flex-col justify-center min-h-0 ${showVersePanel && hasCustomBg ? 'rounded-2xl bg-black/25 backdrop-blur-[2px] mx-1 xs:mx-3 px-2 xs:px-4 py-3' : ''}`}>
          <div className={`flex self-stretch items-center justify-center gap-3 xs:gap-6 mb-4 w-full px-2 xs:px-4 py-1.5 ${showButtons && !capturing ? 'mt-10' : 'mt-4'}`}>
            <span className="h-px flex-1 bg-current opacity-50" style={{ color: textColor }} />
            <p 
              className={`font-sans text-xs xs:text-base md:text-lg font-black tracking-[0.12em] xs:tracking-[0.22em] uppercase flex-shrink-0 ${accentClass}`}
              style={{ opacity: 1, color: textColor, fontFamily: uiFont, textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)' }}
            >
              {isOffline ? 'Offline Verse of the Day' : 'Verse of the Day'}
            </p>
            <span className="h-px flex-1 bg-current opacity-50" style={{ color: textColor }} />
          </div>
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 py-4">
          <blockquote 
            className={`text-center [&_em]:italic break-words ${fontFamily === 'cursive' && a11yFont === 'default' ? 'kjb-verse-card cursive-em-style' : ''}`}
            style={{ 
              color: textColor, 
              opacity: textOpacity, 
              fontFamily: resolvedFont,
              fontWeight: '600',
              lineHeight: '1.5',
              textShadow: '0 2px 8px rgba(0,0,0,0.35)',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              // Dynamic font sizing: scales with container width AND verse length
              // Short verses get larger text, long verses scale down to fit
              fontSize: fontFamily === 'cursive' 
                ? `clamp(1rem, ${textLen > 400 ? '2.5vw' : textLen > 250 ? '3.5vw' : '4.5vw'}, ${textLen > 400 ? '1.4rem' : textLen > 250 ? '2rem' : '2.8rem'})`
                : `clamp(0.9rem, ${textLen > 400 ? '2.5vw' : textLen > 250 ? '3.5vw' : '4.5vw'}, ${textLen > 400 ? '1.3rem' : textLen > 250 ? '1.8rem' : '2.4rem'})`
            }}
          >
            "<span dangerouslySetInnerHTML={{ __html: renderVerseText(cleanVerseText(verse.text)).replace(/<span class="pilcrow">¶<\/span>/g, `<span class="pilcrow" style="color: ${textColor}; opacity: ${textOpacity}; font-family: ${resolvedFont};">¶</span>`) }} />"
          </blockquote>
          <p 
            className="text-sm md:text-base font-semibold mt-8 text-center"
            style={{ 
              opacity: Math.min(1, textOpacity + 0.05), 
              color: textColor, 
              fontFamily: resolvedFont,
              lineHeight: '1.3',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            — {verse.ref}
          </p>

          {/* Date — merged into the same block as verse + ref so long verses
              flow naturally without overlapping or overflowing. */}
          <div className="flex flex-col items-center justify-center w-full mt-8 relative z-10">
            <span
              className="whitespace-nowrap"
              style={{
                backgroundColor: hasCustomBg ? 'rgba(0, 0, 0, 0.55)' : `rgba(${defaultBg.pill}, 0.65)`,
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '11px',
                color: 'rgba(255,255,255,0.98)',
                fontFamily: uiFont,
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
            {capturing && (
              <span
                className="mt-3 whitespace-nowrap font-sans font-bold"
                style={{ color: textColor, opacity: Math.min(1, textOpacity + 0.05), fontSize: '16px', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
              >
                KingJamesBibleReader.com
              </span>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Crop Modal — rendered via a portal to document.body so the full-screen
          overlay isn't trapped inside the verse card's transform/stacking
          context (which caused it to overlap the home page quick-links and made
          the Save button unreachable). */}
      {cropImage && createPortal(
        <div 
          onClick={(e) => e.stopPropagation()} 
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
        <Suspense fallback={null}>
          <ImageCropper
          image={cropImage}
          initialCrop={lastCropSettings?.crop}
          initialZoom={lastCropSettings?.zoom}
          initialAspect={lastCropSettings?.aspect}
          onCrop={(cropped, settings) => {
            setCropImage(null);
            if (settings) {
              setLastCropSettings(settings);
              try { localStorage.setItem('kjb-daily-verse-crop-settings', JSON.stringify(settings)); } catch {}
            }
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
        </Suspense>
        </div>,
        document.body
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
      {showLightbox && createPortal(
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
            className={`relative max-w-6xl w-full mx-4 p-8 md:p-12 rounded-2xl shadow-2xl text-center ${gradientClass}`}
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
              className="absolute top-2 right-2 p-4 -m-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              type="button"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <p 
              className={`font-sans text-xs font-semibold tracking-widest uppercase mb-10 ${accentClass}`}
              style={{ opacity: 0.8 * textOpacity, color: textColor, fontFamily: resolvedFont }}
            >
              {isOffline ? 'Offline Verse of the Day' : 'Verse of the Day'}
            </p>
            <blockquote 
              className={`mb-12 [&_em]:italic ${fontFamily === 'cursive' && a11yFont === 'default' ? 'kjb-verse-card cursive-em-style' : ''} ${lightboxTextClass}`}
              style={{ 
                color: textColor, 
                opacity: textOpacity, 
                fontFamily: resolvedFont,
                fontWeight: '700',
                lineHeight: '1.6',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              "<span dangerouslySetInnerHTML={{ __html: renderVerseText(cleanVerseText(verse.text)) }} />"
            </blockquote>
            <p 
              className="text-base md:text-lg font-semibold mt-12"
              style={{ 
                opacity: Math.min(1, textOpacity + 0.05), 
                color: textColor, 
                fontFamily: resolvedFont,
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
        </div>,
        document.body
      )}

      {/* Off-screen fixed-size card used for the shared/downloaded image */}
      <Suspense fallback={null}>
        <ShareCard ref={shareCardRef} verse={verse} logoSrc={logoDataUrl} fontFamily={resolvedFont} uiFont={uiFont} textColor={textColor} textOpacity={textOpacity} gradient={hasCustomBg ? null : defaultBg.hex} isOffline={isOffline} backgroundImageUrl={hasCustomBg ? (pendingBg || customBg) : null} showTextPanel={hasCustomBg && showVersePanel} />
      </Suspense>
    </div>
  );
}