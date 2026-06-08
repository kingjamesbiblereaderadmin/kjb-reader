import React from 'react';

const ICON_SRC = "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png";

const ICONS = [
  { size: 192, purpose: 'any' },
  { size: 512, purpose: 'any' },
  { size: 192, purpose: 'maskable' },
  { size: 512, purpose: 'maskable' },
];

export default function ManifestIcons() {
  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 pt-10 pb-32">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Manifest Icons</h1>
        <p className="font-sans text-sm text-muted-foreground">All PWA install icons defined in manifest.json</p>
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
              {icon.purpose === 'maskable' && (
                <p className="font-sans text-[11px] text-muted-foreground mt-1">(shown round — how Android may crop it)</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="font-sans text-xs text-muted-foreground text-center mt-8">
        All four entries use the same source image. Maskable previews are shown round to simulate Android masking.
      </p>
    </div>
  );
}