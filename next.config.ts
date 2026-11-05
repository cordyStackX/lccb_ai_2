import type { NextConfig } from "next";

// Builds the CSP. Only frame-ancestors differs between the locked-down
// pages and the public chatbot embed route.
const buildCsp = (frameAncestors: string) =>
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: http://localhost:8000 https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:8000 https://challenges.cloudflare.com https://*.supabase.co",
    "frame-src 'self' https://challenges.cloudflare.com",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");

const commonHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // removes the "X-Powered-By" header
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Profile pictures are served from Supabase Storage in production.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Public chatbot embed: any website may put this page in an iframe.
        source: "/chat_bot",
        headers: [
          ...commonHeaders,
          { key: "Content-Security-Policy", value: buildCsp("*") },
        ],
      },
      {
        // Everything EXCEPT /chat_bot: only your own site may frame it.
        source: "/((?!chat_bot$).*)",
        headers: [
          ...commonHeaders,
          { key: "Content-Security-Policy", value: buildCsp("'self'") },
        ],
      },
    ];
  },
};

export default nextConfig;