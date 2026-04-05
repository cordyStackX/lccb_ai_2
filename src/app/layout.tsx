import { MetadataUtils } from "@/utilities";
import { Roboto, Roboto_Mono } from "next/font/google";
import type { Viewport } from "next";
import PWARegister from "@/components/pwa_register";
import "./globals.css";

const robotoSans = Roboto({
  variable: "--font-geist-sans",
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
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
      <body className={`${robotoSans.variable} ${robotoMono.variable} ${robotoSans.className}`}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
