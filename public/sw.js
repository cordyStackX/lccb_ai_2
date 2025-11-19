// Minimal service worker to prevent 404 errors
// This can be removed if you don't plan to use PWA features

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  event.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up any old caches if needed
  event.waitUntil(self.clients.claim());
});

// Optional: Add basic offline fallback
self.addEventListener('fetch', (event) => {
  // Skip WebSocket requests and dev server requests
  if (event.request.url.includes('/_next/') || 
      event.request.url.includes('ws:') || 
      event.request.url.includes('wss:') ||
      event.request.headers.get('upgrade') === 'websocket') {
    return;
  }
  // You can add caching strategies here if needed
});