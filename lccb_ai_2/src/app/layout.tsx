import { Inter } from "next/font/google";
import type { Viewport } from "next";
import PWARegister from "@/components/pwa_register";
import { MetadataUtils, Gtag, Json_LD } from "@/utilities";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const interSans = Inter({
  variable: "--font-geist-sans",
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

const interMono = Inter({
  variable: "--font-geist-mono",
  weight: ["100", "300", "400", "500", "700"],
  subsets: ["latin"],
});


export const metadata = MetadataUtils();

export const viewport: Viewport = {
  themeColor: "#1A54B8",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(Json_LD()) }}
        />
        <Gtag />
      </head>
      <body className={`${interSans.variable} ${interMono.variable} ${interSans.className}`}>
        <PWARegister />
        <SpeedInsights />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
