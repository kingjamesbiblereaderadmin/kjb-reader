import React, { useRef, useState, useEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Download, Share2, Upload, Palette, Type, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';
import ImageCropper from './ImageCropper';

const VERSE_BACKGROUNDS = [
  { gradient: 'from-blue-600 to-purple-600', accent: 'text-blue-200' },
  { gradient: 'from-rose-600 to-pink-600', accent: 'text-rose-200' },
  { gradient: 'from-emerald-600 to-teal-600', accent: 'text-emerald-200' },
  { gradient: 'from-amber-600 to-orange-600', accent: 'text-amber-200' },
  { gradient: 'from-indigo-600 to-blue-600', accent: 'text-indigo-200' },
  { gradient: 'from-violet-600 to-purple-600', accent: 'text-violet-200' },
  { gradient: 'from-cyan-600 to-blue-600', accent: 'text-cyan-200' }
];

export default function DailyVerseImage({ verse, onClick }) {
  const dow = new Date().getDay();
  const defaultBg = VERSE_BACKGROUNDS[dow];
  const [customBg, setCustomBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; }
  });
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const fileInputRef = useRef(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [textColor, setTextColor] = useState(() => localStorage.getItem('kjb-verse-text-color') || '#ffffff');
  const [textOpacity, setTextOpacity] = useState(() => parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '1'));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('kjb-verse-font-family') || 'serif');
  
  useEffect(() => {
    const handleStorage = () => {
      try { setCustomBg(localStorage.getItem('kjb-daily-verse-bg') || ''); } catch {}
      try { setTextColor(localStorage.getItem('kjb-verse-text-color') || '#ffffff'); } catch {}
      try { setTextOpacity(parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '1')); } catch {}
      try { setFontFamily(localStorage.getItem('kjb-verse-font-family') || 'serif'); } catch {}
    };
    window.addEventListener('storage', handleStorage);
    handleStorage();
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  
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
  
  const handleCropComplete = (croppedDataUrl) => {
    try {
      localStorage.setItem('kjb-daily-verse-bg', croppedDataUrl);
      setCustomBg(croppedDataUrl);
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
    setCapturing(true);
    try {
      const canvas = await html2canvas(verseRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `daily-verse-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
    }
    setCapturing(false);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      // Try to share/copy image first
      const canvas = await html2canvas(verseRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'verse.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'Daily Verse - KJB Reader',
          text: `"${verse.text}" — ${verse.ref}`,
          files: [new File([blob], `daily-verse-${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' })],
        });
        return;
      }
      
      // Try clipboard image
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        alert('Image copied to clipboard!');
        return;
      } catch {}
    } catch (err) {
      console.error('Image share failed:', err);
    }
    
    // Fallback: share text only
    const shareData = {
      title: 'Daily Verse',
      text: `"${verse.text}" — ${verse.ref}`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert('Verse text copied to clipboard!');
    }
  };

  return (
    <div ref={verseRef} onClick={onClick} className={`w-full ${gradientClass} rounded-2xl shadow-lg px-8 pt-5 pb-8 text-center text-white relative cursor-pointer`} style={bgStyle}>
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1.5 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowStyleEditor(!showStyleEditor);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setShowStyleEditor(!showStyleEditor);
          }}
          className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur transition-colors"
          title="Customize text style"
          type="button"
        >
          <Palette className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur transition-colors disabled:opacity-50"
          title="Change background image"
          type="button"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
          ) : (
            <Upload className="w-4 h-4 text-white" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleShare(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleShare(e);
          }}
          disabled={capturing}
          className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur transition-colors disabled:opacity-50"
          title="Share verse image"
          type="button"
        >
          {capturing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
          ) : (
            <Share2 className="w-4 h-4 text-white" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDownload(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleDownload(e);
          }}
          disabled={capturing}
          className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur transition-colors disabled:opacity-50"
          title="Download verse image"
          type="button"
        >
          {capturing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
          ) : (
            <Download className="w-4 h-4 text-white" />
          )}
        </button>
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
            <div className="flex flex-wrap gap-2">
              {[
                '#ffffff', '#f8f8f8', '#fef3c7', '#dbeafe',
                '#fecaca', '#ddd6fe', '#bbf7d0', '#fde68a'
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
        onChange={handleUpload}
        className="hidden"
      />
      
      <p 
        className={`font-sans text-xs font-semibold tracking-widest uppercase mb-4 ${accentClass}`}
        style={{ opacity: 0.8 * textOpacity, color: textColor, fontFamily }}
      >
        Verse of the Day
      </p>
      <blockquote 
        className="text-2xl md:text-3xl font-bold leading-relaxed mb-6"
        style={{ 
          color: textColor, 
          opacity: textOpacity, 
          fontFamily,
          fontWeight: 'bold'
        }}
      >
        "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
      </blockquote>
      <p 
        className="font-sans text-base font-semibold"
        style={{ opacity: 0.95 * textOpacity, color: textColor, fontFamily }}
      >
        — {verse.ref} (KJB)
      </p>
      <div 
        className={`mt-5 w-12 h-1 mx-auto ${accentClass}`}
        style={{ opacity: 0.75 * textOpacity, backgroundColor: textColor }}
      />
      
      {/* Crop Modal */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCrop={handleCropComplete}
          onCancel={() => setCropImage(null)}
        />
      )}
    </div>
  );
}