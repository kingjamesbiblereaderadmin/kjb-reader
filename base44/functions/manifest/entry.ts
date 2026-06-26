// Serves the PWA manifest dynamically so it's always live (never stale-cached).
Deno.serve(async () => {
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
    // from inside a normal browser tab (the only reliable cross-tab install
    // check on Android Chromium browsers, incl. Samsung Internet).
    // URL must match the manifest URL for detection to work.
    related_applications: [
      { platform: "webapp", url: "/manifest.json" }
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
    icons: [
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/35e329953_cfb4bf781_Untitled.png",
        sizes: "141x141",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/b4d6bd971_kjb-maskable-512-nopad.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://base44.app/api/apps/6a05d76723afe58d80c58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/b4d6bd971_kjb-maskable-512-nopad.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/791f4a327_BCObc7bb469-f8ce-4d13-b0bd-1d6f9d4206f1.png?v=20260626_726",
        sizes: "1024x1024",
        type: "image/png",
        form_factor: "narrow",
        label: "KJB Reader - Multi-Device Experience"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/25956379b_BCOf0297029-2e38-446b-bd58-076244d9d764.png?v=20260626_726",
        sizes: "1024x1024",
        type: "image/png",
        form_factor: "narrow",
        label: "The Gospel of Salvation"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/0bfc96d17_WhatsAppImage2026-05-31at182822.jpg?v=20260626_726",
        sizes: "1024x1024",
        type: "image/png",
        form_factor: "narrow",
        label: "Available on All Browsers"
      }
    ]
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