import type { Metadata } from "next";
import config from "@/config/conf/Metadata.json"; 

export default function MetadataUtils() {
    const metadata: Metadata = {
        title: config.title,
        description: config.description,
        alternates: {
            canonical: config.domain__links,
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
            google: "google9249e550c23b54d0.html",
        },
        openGraph: {
            title: config.title,
            description: config.description,
            url: config.domain__links,
            siteName: "CordyStackX",
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
                alt: "Cordy Portfolio",
            },
            ],
            locale: "en-US",
            type: "website",
        },
         other: {
            "article:publisher": config.links__src,
            "twitter:creator": "@CordyStackX",
        },                                  
    };

    return metadata;

}