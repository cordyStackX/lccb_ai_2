import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LACO AI Web App",
    short_name: "LACO",
    description: "LACO PWA Web Development App",
    id: "/",
    scope: "/",
    start_url: "/auth/signup",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1A54B8",
    theme_color: "#1A54B8",
    prefer_related_applications: false,
    icons: [
      {
        src: "/lccb_logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/lccb_logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/lccb_logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Sign up",
        short_name: "Sign up",
        description: "Open the signup page",
        url: "/auth/signup",
      },
    ],
  };
}