// Serves the PWA manifest dynamically so it's always live (never stale-cached).
Deno.serve(async () => {
  const manifest = {
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
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/9a9013416_generated_image.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/85bb4cc16_Screenshot_20260624_103619_OneDrive.jpg",
        sizes: "512x1024",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "The Gospel of Salvation"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/0b18be793_Screenshot_20260624_103754_OneDrive.jpg",
        sizes: "474x1024",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Install KJB Reader on any browser — desktop or mobile"
      },
      {
        src: "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/ec53ef8c0_Screenshot_20260615_084516_Gallery.jpg",
        sizes: "474x1024",
        type: "image/jpeg",
        form_factor: "narrow",
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