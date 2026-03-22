const CACHE_NAME = "app-cache-v2";
const OFFLINE_URL = "/offline.html";
const OFFLINE_IMAGE = "/offline.png";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, OFFLINE_IMAGE]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  const isNavigationRequest = request.mode === "navigate" || acceptsHtml;

  if (request.method !== "GET") {
    return;
  }

  if (request.headers.get("upgrade") === "websocket") {
    return;
  }

  if (isNavigationRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status < 400) {
            return response;
          }
          return caches.match(OFFLINE_URL, { ignoreSearch: true });
        })
        .catch(() => caches.match(OFFLINE_URL, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (request.url.startsWith(self.location.origin) && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.destination === "image") {
            return caches.match(OFFLINE_IMAGE);
          }
          return new Response("", { status: 504, statusText: "Gateway Timeout" });
        });
    })
  );
});