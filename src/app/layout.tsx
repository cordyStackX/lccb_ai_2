import { MetadataUtils } from "@/utilities";
import { Poppins } from "next/font/google";
import type { Viewport } from "next";
import PWARegister from "@/components/pwa_register";
import "./globals.css";

const poppinsSans = Poppins({
  variable: "--font-geist-sans",
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

const poppinsMono = Poppins({
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
      <body className={`${poppinsSans.variable} ${poppinsMono.variable} ${poppinsSans.className}`}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
