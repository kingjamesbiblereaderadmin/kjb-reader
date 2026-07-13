// Serves the PWA manifest dynamically so it's always live (never stale-cached).
import { createClient } from 'npm:@base44/sdk@0.8.38';

const DEFAULT_ICONS = [
  {
    src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/efb7b4ff3_launchericon-512x512.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any"
  },
  {
    src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/efb7b4ff3_launchericon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any"
  },
  {
    src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/d201176a5_f1ca33755_kjb-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable"
  }
];

const DEFAULT_SCREENSHOTS = [
  {
    src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/4222aa582_screenshot-BCOf0297029-2e38-446b-bd58-076244d9d764.png",
    sizes: "1024x1707",
    type: "image/png",
    form_factor: "narrow",
    label: "Screenshot 1"
  },
  {
    src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/9c0bd6152_screenshot-BCObc7bb469-f8ce-4d13-b0bd-1d6f9d4206f1.png",
    sizes: "1024x1707",
    type: "image/png",
    form_factor: "narrow",
    label: "Screenshot 2"
  },
  {
    src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/31cc1311c_screenshot-WhatsAppImage2026-05-31at182822.jpeg",
    sizes: "1024x1707",
    type: "image/jpeg",
    form_factor: "narrow",
    label: "Screenshot 3"
  },
  {
    src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/e8088dc25_screenshot-BCOf0297029-2e38-446b-bd58-076244d9d764.png",
    sizes: "1920x1080",
    type: "image/png",
    form_factor: "wide",
    label: "Screenshot 4"
  },
  {
    src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/aa9e7ed8a_screenshot-BCObc7bb469-f8ce-4d13-b0bd-1d6f9d4206f1.png",
    sizes: "1920x1080",
    type: "image/png",
    form_factor: "wide",
    label: "Screenshot 5"
  },
  {
    src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/534e626f0_screenshot-WhatsAppImage2026-05-31at182822.jpeg",
    sizes: "1920x1080",
    type: "image/jpeg",
    form_factor: "wide",
    label: "Screenshot 6"
  }
];

Deno.serve(async () => {
  // Read admin-editable icon/screenshot overrides (falls back to defaults).
  let icons = DEFAULT_ICONS;
  let screenshots = DEFAULT_SCREENSHOTS;
  try {
    const appId = Deno.env.get("BASE44_APP_ID");
    const base44 = createClient({ appId });
    const rows = await base44.asServiceRole.entities.ManifestConfig.list('-updated_date', 1);
    const cfg = rows && rows[0];
    if (cfg?.icons?.length) icons = cfg.icons;
    if (cfg?.screenshots?.length) screenshots = cfg.screenshots;
  } catch (err) {
    console.warn('[manifest] override load failed, using defaults:', err?.message);
  }

  const manifest = {
    id: "/",
    name: "KJB Reader",
    short_name: "KJB Reader",
    description: "Read the King James Bible (Pure Cambridge Edition) with offline support, daily verses, and beautiful typography.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
    launch_handler: { client_mode: "navigate-existing" },
    orientation: "any",
    background_color: "#0f1117",
    theme_color: "#0f1117",
    prefer_related_applications: false,
    // Lets navigator.getInstalledRelatedApps() recognise THIS installed PWA
    // from inside a normal browser tab (Android Chrome/Samsung Internet).
    // IMPORTANT: URL must match the origin exactly for detection to work
    related_applications: [
      { platform: "webapp", url: "https://kingjamesbiblereader.com/manifest" }
    ],
    // Protocol handlers — register as handler for bible: and kjb: URIs
    protocol_handlers: [
      {
        protocol: "bible",
        url: "/read?ref=%s",
        name: "KJB Reader"
      },
      {
        protocol: "kjb",
        url: "/read?ref=%s",
        name: "KJB Reader"
      }
    ],
    icons,
    screenshots
  };

  // Add timestamp to force fresh loading on mobile browsers
  const timestamp = new Date().toISOString();
  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Access-Control-Allow-Origin": "*",
      "Last-Modified": new Date().toUTCString(),
      "ETag": `"manifest-${timestamp}"`
    }
  });
});