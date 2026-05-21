import React, { useRef, useState, useEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Download, Share2, Upload, Palette, Type, Eye, Smartphone, Bell, BellOff, Maximize2, ChevronsDown, MoreVertical, Trash2, Image, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import ImageCropper from './ImageCropper';
import { getNotificationsEnabled, requestNotificationPermission, disableNotifications, scheduleDailyNotification } from '@/lib/notifications';

const VERSE_BACKGROUNDS = [
  { gradient: 'from-blue-600 to-purple-600', accent: 'text-blue-200' },
  { gradient: 'from-rose-600 to-pink-600', accent: 'text-rose-200' },
  { gradient: 'from-emerald-600 to-teal-600', accent: 'text-emerald-200' },
  { gradient: 'from-amber-600 to-orange-600', accent: 'text-amber-200' },
  { gradient: 'from-indigo-600 to-blue-600', accent: 'text-indigo-200' },
  { gradient: 'from-violet-600 to-purple-600', accent: 'text-violet-200' },
  { gradient: 'from-cyan-600 to-blue-600', accent: 'text-cyan-200' }
];

export default function DailyVerseImage({ verse, onClick, onToggleNotif, notifEnabled }) {
  const dow = new Date().getDay();
  const defaultBg = VERSE_BACKGROUNDS[dow];
  const [customBg, setCustomBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; }
  });
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropImageForNotif, setCropImageForNotif] = useState(false);
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
  const [textColor, setTextColor] = useState(() => localStorage.getItem('kjb-verse-text-color') || '#ffffff');
  const [textOpacity, setTextOpacity] = useState(() => parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '0.95'));
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });
  
  useEffect(() => {
    const handleStorage = () => {
      try { setCustomBg(localStorage.getItem('kjb-daily-verse-bg') || ''); } catch {}
      try { setTextColor(localStorage.getItem('kjb-verse-text-color') || '#ffffff'); } catch {}
      try { setTextOpacity(parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '1')); } catch {}
      try { setFontFamily(localStorage.getItem('kjb-verse-font-family') || 'serif'); } catch {}
      try { setNotifImage(localStorage.getItem('kjb-notif-image') || ''); } catch {}
      try { setShowVersePanel(localStorage.getItem('kjb-verse-panel-visible') !== 'false'); } catch {}
    };
    window.addEventListener('storage', handleStorage);
    handleStorage();
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
        setCropImage(base64); // Open cropper instead of saving directly
      }
    };
    reader.onerror = () => {
      alert('Failed to read image');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };
  
  const handleCropComplete = (croppedDataUrl, forNotification = false) => {
    try {
      if (forNotification) {
        localStorage.setItem('kjb-notif-image', croppedDataUrl);
        setNotifImage(croppedDataUrl);
      } else {
        // Clear any existing background first to free up space
        localStorage.removeItem('kjb-daily-verse-bg');
        // Save new background
        localStorage.setItem('kjb-daily-verse-bg', croppedDataUrl);
        // Verify it was saved correctly
        const saved = localStorage.getItem('kjb-daily-verse-bg');
        if (saved !== croppedDataUrl) {
          throw new Error('Save verification failed');
        }
        setCustomBg(croppedDataUrl);
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
        img.src = croppedDataUrl;
      }
      window.dispatchEvent(new Event('storage'));
      setCropImage(null);
    } catch (err) {
      alert('Storage full! Please remove other data or try a smaller image.');
      console.error('localStorage quota exceeded:', err);
    }
  };

  const handleTextColorChange = (color) => {
    setTextColor(color);
    localStorage.setItem('kjb-verse-text-color', color);
    window.dispatchEvent(new Event('storage'));
  };

  const handleTextOpacityChange = (opacity) => {
    setTextOpacity(opacity);
    localStorage.setItem('kjb-verse-text-opacity', String(opacity));
    window.dispatchEvent(new Event('storage'));
  };

  const handleFontFamilyChange = (font) => {
    setFontFamily(font);
    localStorage.setItem('kjb-verse-font-family', font);
    window.dispatchEvent(new Event('storage'));
  };


  

  
  const verseRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  
  const bgStyle = customBg
    ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};
  const gradientClass = customBg ? '' : `bg-gradient-to-br ${defaultBg.gradient}`;
  const accentClass = customBg ? 'text-white' : defaultBg.accent;

  const handleDownload = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCapturing(true);
    setShowButtons(false);
    setShowStyleEditor(false);
    setShowMenu(false);
    // Wait for state to update before capturing
    await new Promise(resolve => setTimeout(resolve, 150));
    try {
      const canvas = await html2canvas(verseRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      link.download = `daily-verse-${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setTimeout(() => {
        setCapturing(false);
        setShowButtons(true);
      }, 100);
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
    e.stopPropagation();
    e.preventDefault();
    setCapturing(true);
    setShowButtons(false);
    setShowStyleEditor(false);
    setShowMenu(false);
    // Wait for state to update before capturing
    await new Promise(resolve => setTimeout(resolve, 150));
    try {
      // Try to share/copy image first
      const canvas = await html2canvas(verseRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'verse.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'Daily Verse - KJB Reader',
          text: `"${verse.text}" — ${verse.ref}`,
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
      const shareText = `"${verse.text}" — ${verse.ref} (KJB)`;
      await navigator.clipboard.writeText(shareText);
      alert('Verse copied to clipboard!');
    } finally {
      setTimeout(() => {
        setCapturing(false);
        setShowButtons(true);
      }, 100);
    }
  };

  const handleCopyVerse = async (e) => {
    e.stopPropagation();
    try {
      const verseText = `"${verse.text}" — ${verse.ref} (KJB)`;
      await navigator.clipboard.writeText(verseText);
      alert('Verse copied to clipboard!');
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to copy verse:', err);
      alert('Failed to copy verse');
    }
  };

  return (
    <div ref={verseRef} onClick={onClick} className={`w-full ${gradientClass} rounded-2xl shadow-lg px-8 pt-5 pb-8 text-center text-white relative cursor-pointer`} style={bgStyle}>
      {/* Bell button */}
      {showButtons && onToggleNotif && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleNotif();
          }}
          className="absolute top-2 left-2 p-1.5 rounded-md bg-white hover:bg-slate-100 transition-colors z-10 shadow-md"
          title={notifEnabled ? 'Daily verse reminders on (updates when app opens)' : 'Reminders off'}
          type="button"
        >
          {notifEnabled ? (
            <Bell className="w-4 h-4 text-slate-800" />
          ) : (
            <BellOff className="w-4 h-4 text-slate-600" />
          )}
        </button>
      )}

      {/* Date display */}
      <div className="absolute bottom-3 left-3 bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1">
        <p className="text-xs font-sans font-medium whitespace-nowrap leading-none" style={{ color: '#ffffff' }}>
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
        {!capturing && showButtons ? (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleCopyVerse}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Verse
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                      setShowMenu(false);
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
                    disabled={uploading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <Image className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Change Background'}
                  </button>
                  {customBg && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCustomBg('');
                        localStorage.removeItem('kjb-daily-verse-bg');
                        // Reset text color and opacity to defaults
                        handleTextColorChange('#ffffff');
                        handleTextOpacityChange(0.95);
                        handleFontFamilyChange('serif');
                        window.dispatchEvent(new Event('storage'));
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
          onClick={(e) => e.stopPropagation()}
          className="absolute top-12 right-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-xl p-4 w-72 border border-white/20"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-sans text-sm font-semibold text-slate-800 dark:text-slate-200">Text Style</h3>
            <button
              onClick={() => setShowStyleEditor(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Upload className="w-4 h-4 rotate-45 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Text Color */}
          <div className="mb-4">
            <label className="flex items-center gap-2 font-sans text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Palette className="w-3.5 h-3.5" />
              Text Color
            </label>
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
                  onClick={() => handleTextColorChange(color)}
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
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'serif', label: 'Serif' },
                { value: 'sans-serif', label: 'Sans Serif' },
                { value: 'monospace', label: 'Mono' },
                { value: 'cursive', label: 'Cursive' },
              ].map(font => (
                <button
                  key={font.value}
                  onClick={() => handleFontFamilyChange(font.value)}
                  className={`px-3 py-2 rounded-lg font-sans text-xs font-medium transition-all ${
                    fontFamily === font.value
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {font.label}
                </button>
              ))}
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
          handleUpload(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="hidden"
      />
      
      {showVersePanel ? (
        <div className="bg-white/15 backdrop-blur-sm rounded-xl px-6 py-4 mb-5 shadow-none">
          <p 
            className={`font-sans text-sm font-bold tracking-wide uppercase mb-3 ${accentClass}`}
            style={{ opacity: textOpacity, color: textColor, fontFamily }}
          >
            Verse of the Day
          </p>
          <blockquote 
            className="text-2xl md:text-3xl leading-relaxed"
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
            className="font-sans text-base font-semibold mt-4"
            style={{ 
              opacity: Math.min(1, textOpacity + 0.05), 
              color: textColor, 
              fontFamily,
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            — {verse.ref} (KJB)
          </p>
        </div>
      ) : (
        <div className="px-6 py-4 mb-5">
          <blockquote 
            className="text-2xl md:text-3xl leading-relaxed"
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
            className="font-sans text-base font-semibold mt-4"
            style={{ 
              opacity: Math.min(1, textOpacity + 0.05), 
              color: textColor, 
              fontFamily,
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            — {verse.ref} (KJB)
          </p>
        </div>
      )}
      <div 
        className={`w-12 h-1 mx-auto ${accentClass}`}
        style={{ opacity: 0.75 * textOpacity, backgroundColor: textColor }}
      />
      
      {/* Crop Modal */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCrop={(cropped) => handleCropComplete(cropped, cropImageForNotif)}
          onCancel={() => {
            setCropImage(null);
            setCropImageForNotif(false);
          }}
        />
      )}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-4xl w-full mx-4 p-8 md:p-12 rounded-2xl shadow-2xl"
            style={bgStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              type="button"
            >
              <Upload className="w-5 h-5 text-white rotate-45" />
            </button>
            <p 
              className={`font-sans text-xs font-semibold tracking-widest uppercase mb-6 ${accentClass}`}
              style={{ opacity: 0.8 * textOpacity, color: textColor, fontFamily }}
            >
              Verse of the Day
            </p>
            <blockquote 
              className="text-3xl md:text-5xl leading-relaxed mb-8"
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
              — {verse.ref} (KJB)
            </p>
            <div 
              className={`mt-8 w-16 h-1 mx-auto ${accentClass}`}
              style={{ opacity: 0.75 * textOpacity, backgroundColor: textColor }}
            />
          </div>
        </div>
      )}
    </div>
  );
}