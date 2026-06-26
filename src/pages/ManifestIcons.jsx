import React, { useRef, useState } from 'react';
import { Download, Loader2, UploadCloud, Copy, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Your real logo (141x141). We faithfully resize it on a canvas — no redraw.
const ICON_SRC = "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/35e329953_cfb4bf781_Untitled.png";

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
    // Fill background with neutral dark color matching app theme (no transparent corners).
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, size, size);
  }
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  ctx.drawImage(img, pad, pad, inner, inner);
  return canvas.toDataURL('image/png');
}

// Convert a canvas data URL to a File for upload.
function dataUrlToFile(dataUrl, filename) {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

export default function ManifestIcons() {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [maskableUrl, setMaskableUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const imgRef = useRef(null);

  const loadImage = () =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = ICON_SRC;
    });

  // Generate the 512px PADDED maskable icon from your real logo and upload it,
  // so the manifest can point at a true padded file (no redraw).
  const generateMaskable = async () => {
    setUploading(true);
    try {
      const img = imgRef.current || (imgRef.current = await loadImage());
      const dataUrl = renderIcon(img, 512, 0.18); // 18% safe-zone padding
      const file = dataUrlToFile(dataUrl, 'kjb-maskable-512.png');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMaskableUrl(file_url);
    } catch (e) {
      alert('Could not generate maskable icon: ' + e.message);
    }
    setUploading(false);
  };

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

      {/* One-click padded maskable generator */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 flex flex-col items-center gap-4 shadow-sm">
        <p className="font-sans text-sm text-foreground font-medium text-center">
          Generate the padded maskable icon from your real logo (fixes Android squeezing)
        </p>
        <button
          onClick={generateMaskable}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          Generate & Upload Maskable Icon
        </button>
        {maskableUrl && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-xl overflow-hidden border border-border bg-secondary/40">
              <img src={maskableUrl} alt="Padded maskable" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(maskableUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy image URL'}
            </button>
            <p className="font-sans text-[11px] text-muted-foreground text-center break-all max-w-md">{maskableUrl}</p>
            <p className="font-sans text-xs text-muted-foreground text-center">Paste this URL back to me and I'll wire it into the manifest.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {ICONS.map((icon, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4 shadow-sm">
            <div
              className="bg-secondary/40 border border-border flex items-center justify-center overflow-hidden rounded-2xl"
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