import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LACO AI Web App",
    short_name: "LACO",
    description: "LACO PWA Web Development App",
    start_url: "/auth/signup",
    display: "standalone",
    background_color: "#1A54B8",
    theme_color: "#e9e9e9",
    icons: [
      {
        src: "/lccb_logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}