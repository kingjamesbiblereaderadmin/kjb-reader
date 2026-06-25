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
    display_override: ["standalone", "minimal-ui"],
    launch_handler: { client_mode: "navigate-existing" },
    orientation: "portrait",
    background_color: "#3b9ad6",
    theme_color: "#3b9ad6",
    prefer_related_applications: false,
    icons: [
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/35e329953_cfb4bf781_Untitled.png",
        sizes: "141x141",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/35e329953_cfb4bf781_Untitled.png",
        sizes: "any",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/b4d6bd971_kjb-maskable-512-nopad.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/0c44fd0eb_generated_image.png",
        sizes: "1024x1024",
        type: "image/png",
        form_factor: "narrow",
        label: "The Gospel of Salvation"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/cd66db5f0_BCOf0297029-2e38-446b-bd58-076244d9d764.png",
        sizes: "1024x683",
        type: "image/png",
        form_factor: "wide",
        label: "The Gospel of Salvation"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/f082f27cb_WhatsAppImage2026-05-31at182822.jpg",
        sizes: "1024x649",
        type: "image/jpeg",
        form_factor: "wide",
        label: "Read the King James Bible with ease"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/84904fb55_80aa2d055_screenshot-1024x500.png",
        sizes: "750x500",
        type: "image/png",
        form_factor: "wide",
        label: "Read the King James Version of the Bible with ease"
      }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*"
    }
  });
});