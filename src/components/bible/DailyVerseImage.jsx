import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

// Background gradient palettes — one per day-of-week
const PALETTES = [
  ['#1a2740', '#2a4070'],   // Mon - deep navy
  ['#3b1f2b', '#6b3050'],   // Tue - deep maroon
  ['#1a3328', '#2a5c45'],   // Wed - forest
  ['#2b2415', '#5a4a20'],   // Thu - parchment dark
  ['#1f2b40', '#2d4a7a'],   // Fri - midnight blue
  ['#2b1a35', '#4a2860'],   // Sat - deep purple
  ['#1a1a2e', '#2a2a5a'],   // Sun - dark indigo
];

function drawVerseCard(canvas, verse) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Pick palette by day of week
  const dow = new Date().getDay();
  const [c1, c2] = PALETTES[dow];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle texture overlay — cross-hatch dots
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < W; x += 20) {
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Gold accent bar top
  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, 'rgba(200,160,60,0)');
  barGrad.addColorStop(0.5, 'rgba(200,160,60,0.8)');
  barGrad.addColorStop(1, 'rgba(200,160,60,0)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, W, 3);

  // Label
  ctx.fillStyle = 'rgba(200,160,60,0.9)';
  ctx.font = `500 ${W * 0.028}px Inter, sans-serif`;
  ctx.letterSpacing = '0.15em';
  ctx.textAlign = 'center';
  ctx.fillText('VERSE OF THE DAY', W / 2, H * 0.13);

  // Decorative rule
  ctx.strokeStyle = 'rgba(200,160,60,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.25, H * 0.17);
  ctx.lineTo(W * 0.75, H * 0.17);
  ctx.stroke();

  // Verse text — word-wrap
  const fontSize = W * 0.048;
  ctx.font = `italic ${fontSize}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.93)';
  ctx.textAlign = 'center';

  const maxWidth = W * 0.78;
  const lineHeight = fontSize * 1.55;
  const words = `"${verse.text}"`.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const totalH = lines.length * lineHeight;
  const startY = H / 2 - totalH / 2 + fontSize / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });

  // Reference
  ctx.font = `600 ${W * 0.032}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(200,160,60,0.9)';
  ctx.fillText(`— ${verse.ref} (KJB)`, W / 2, H * 0.84);

  // Bottom rule
  ctx.strokeStyle = 'rgba(200,160,60,0.35)';
  ctx.beginPath();
  ctx.moveTo(W * 0.3, H * 0.88);
  ctx.lineTo(W * 0.7, H * 0.88);
  ctx.stroke();

  // Watermark
  ctx.font = `400 ${W * 0.022}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText('KJB Reader — Pure Cambridge Edition', W / 2, H * 0.93);
}

export default function DailyVerseImage({ verse }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!verse || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1080;
    drawVerseCard(canvas, verse);
    setReady(true);
  }, [verse]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `kjb-verse-${verse.ref.replace(/\s/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative group w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ aspectRatio: '1/1', display: ready ? 'block' : 'none' }}
      />
      {ready && (
        <button
          onClick={handleDownload}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 text-white font-sans text-xs font-medium"
          title="Save image"
        >
          <Download className="w-3.5 h-3.5" />
          Save
        </button>
      )}
    </div>
  );
}