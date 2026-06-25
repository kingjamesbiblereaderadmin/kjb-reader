import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

// Your real logo (141x141). We faithfully resize it on a canvas — no redraw.
const ICON_SRC = "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/391154913_cfb4bf781_Untitled.png";

const ICONS = [
  { size: 192, purpose: 'any' },
  { size: 512, purpose: 'any' },
  { size: 192, purpose: 'maskable' },
  { size: 512, purpose: 'maskable' },
];

// Faithfully resize the source logo to an exact square PNG of the given size.
// `padRatio` adds safe-zone padding (for maskable icons) so Android masking
// doesn't crop the logo. Returns a data URL.
function renderIcon(img, size, padRatio = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (padRatio > 0) {
    // Fill background so the masked (round) icon has no transparent corners.
    ctx.fillStyle = '#3b9ad6';
    ctx.fillRect(0, 0, size, size);
  }
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  ctx.drawImage(img, pad, pad, inner, inner);
  return canvas.toDataURL('image/png');
}

export default function ManifestIcons() {
  const [busy, setBusy] = useState(false);
  const imgRef = useRef(null);

  const loadImage = () =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = ICON_SRC;
    });

  const downloadOne = async (icon) => {
    setBusy(true);
    try {
      const img = imgRef.current || (imgRef.current = await loadImage());
      const padRatio = icon.purpose === 'maskable' ? 0.18 : 0;
      const dataUrl = renderIcon(img, icon.size, padRatio);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `kjb-icon-${icon.size}-${icon.purpose}.png`;
      a.click();
    } catch (e) {
      alert('Could not render icon: ' + e.message);
    }
    setBusy(false);
  };

  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 pt-10 pb-32">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Manifest Icons</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Download true-size PNGs of your logo, then upload them so the manifest sizes are real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {ICONS.map((icon, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4 shadow-sm">
            <div
              className={`bg-secondary/40 border border-border flex items-center justify-center overflow-hidden ${icon.purpose === 'maskable' ? 'rounded-full' : 'rounded-2xl'}`}
              style={{ width: icon.size > 256 ? 256 : icon.size, height: icon.size > 256 ? 256 : icon.size }}
            >
              <img src={ICON_SRC} alt={`${icon.size} ${icon.purpose}`} className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <p className="font-sans text-sm font-semibold text-foreground">{icon.size}×{icon.size}</p>
              <p className="font-sans text-xs text-muted-foreground capitalize">Purpose: {icon.purpose}</p>
            </div>
            <button
              onClick={() => downloadOne(icon)}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download {icon.size}px {icon.purpose}
            </button>
          </div>
        ))}
      </div>

      <p className="font-sans text-xs text-muted-foreground text-center mt-8 max-w-xl mx-auto">
        These are faithful pixel resizes of your real logo (not redrawn). Download all four, send them to me / upload them,
        and I'll point the manifest at the true-size files so Samsung Internet accepts the install.
      </p>
    </div>
  );
}