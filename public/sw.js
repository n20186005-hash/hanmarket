const CACHE = "han-market-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("han-market-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
 const request = event.request, url = new URL(request.url);
 if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname === "/analytics.js") return;
 if (request.mode === "navigate") {
  event.respondWith(fetch(request).catch(() => new Response("Offline. Reconnect and reload this page.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})));
  return;
 }
 if (!/\.(?:jpg|svg|woff2|png)$/.test(url.pathname)) return;
 event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {if(response.ok) {const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(request,copy));} return response;})));
});
