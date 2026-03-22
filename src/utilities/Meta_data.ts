import type { Metadata } from "next";
import config from "@/config/conf/json_config/Metadata.json"; 

export default function MetadataUtils() {
    const metadata: Metadata = {
        applicationName: "LACO AI Web App",
        title: config.title,
        description: config.description,
        manifest: "/manifest.webmanifest",
        alternates: {
            canonical: config.domain__links,
        },
        icons: {
            icon: [
                { url: "/lccb_logo.png", sizes: "192x192", type: "image/png" },
                { url: "/lccb_logo.png", sizes: "512x512", type: "image/png" },
            ],
            apple: [
                { url: "/lccb_logo.png", sizes: "180x180", type: "image/png" },
            ],
            shortcut: [
                { url: "/lccb_logo.png", sizes: "192x192", type: "image/png" },
            ],
        },
        appleWebApp: {
            capable: true,
            statusBarStyle: "default",
            title: "LACO",
            startupImage: [
                {
                    url: "/lccb_logo.png",
                },
            ],
        },
        formatDetection: {
            telephone: false,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
            },
        },
         verification: {
            google: config.google_verify,
        },
        openGraph: {
            title: config.title,
            description: config.description,
            url: config.domain__links,
            siteName: config.siteName_config,
            images: [
            {
                url: config.openGraph,
                width: 800,
                height: 600,
            },
            {
                url: config.openGraph,
                width: 1800,
                height: 1600,
                alt: "Logo",
            },
            ],
            locale: "en-US",
            type: "website",
        },
         other: {
            "article:publisher": config.links__src,
            "twitter:creator": config.creator,
        },                                  
    };

    return metadata;

}