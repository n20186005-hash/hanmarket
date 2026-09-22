const CACHE = "han-market-v1";
const STATIC = [
  "/",
  "/en/",
  "/favicon.svg",
  "/favicon-16.svg",
  "/favicon-32.svg",
  "/apple-touch-icon.svg",
  "/site.webmanifest",
  "/images/han-market-exterior.jpg",
  "/images/han-market-interior.jpg",
  "/images/han-river.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for page navigations, with offline cache fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request) || caches.match("/") || caches.match("/en/"))
    );
    return;
  }

  // Cache-first for same-origin static assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
