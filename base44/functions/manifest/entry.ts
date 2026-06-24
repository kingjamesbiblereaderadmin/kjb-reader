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
    orientation: "portrait",
    background_color: "#0f1117",
    theme_color: "#0f1718",
    icons: [
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/9a9013416_generated_image.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/9a9013416_generated_image.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/9a9013416_generated_image.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/9a9013416_generated_image.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/77e83b08f_Screenshot_20260624_103619_OneDrive.jpg",
        sizes: "493x1024",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "The Gospel of Salvation"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/020a75def_Screenshot_20260615_084516_Gallery.jpg",
        sizes: "473x1024",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Read the King James Bible with ease"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/0c619d9c1_BCOf0297029-2e38-446b-bd58-076244d9d764.png",
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