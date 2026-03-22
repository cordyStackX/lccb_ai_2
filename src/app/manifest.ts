import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Next PWA",
    short_name: "MyPWA",
    description: "My Next.js progressive web app",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/lccb_logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}