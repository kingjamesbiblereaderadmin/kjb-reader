import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { ImageMagick, initializeImageMagick, MagickFormat } from 'npm:@imagemagick/magick-wasm@0.0.30';

let _wasmInit = false;
async function ensureMagick() {
  if (_wasmInit) return;
  const wasmRes = await fetch('https://esm.sh/@imagemagick/magick-wasm@0.0.30/dist/magick.wasm');
  const wasmBytes = new Uint8Array(await wasmRes.arrayBuffer());
  await initializeImageMagick(wasmBytes);
  _wasmInit = true;
}

async function resize(srcUrl, w, h) {
  const res = await fetch(srcUrl);
  const bytes = new Uint8Array(await res.arrayBuffer());
  return await new Promise((resolve) => {
    ImageMagick.read(bytes, (img) => {
      img.resize(w, h);
      img.write(MagickFormat.Png, (out) => resolve(new Uint8Array(out)));
    });
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureMagick();

    const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/9a9013416_generated_image.png';
    const shotUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/5f4727bd1_BCObc7bb469-f8ce-4d13-b0bd-1d6f9d4206f1.png';

    const jobs = [
      { name: 'logo-1024.png', src: logoUrl, w: 1024, h: 1024 },
      { name: 'logo-512.png', src: logoUrl, w: 512, h: 512 },
      { name: 'screenshot-1024x500.png', src: shotUrl, w: 1024, h: 500 },
    ];

    const out = {};
    for (const j of jobs) {
      const resized = await resize(j.src, j.w, j.h);
      const file = new File([resized], j.name, { type: 'image/png' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      out[j.name] = file_url;
    }

    return Response.json({ files: out });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});