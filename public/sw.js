const VERSION = "kayuukur-pro-v1";
const APP_SHELL = ["/", "/converter", "/fractions", "/catalog", "/games", "/learn", "/offline.html", "/manifest.webmanifest", "/images/logo.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(APP_SHELL.map(async (url) => {
      try { const response = await fetch(url, { cache: "reload" }); if (response.ok) await cache.put(url, response); } catch (_) { /* First install may be offline. */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("kayuukur-pro-") && key !== VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/")) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request);
      if (cached) return cached;
      try { const response = await fetch(request); if (response.ok) cache.put(request, response.clone()); return response; }
      catch (_) { return cached || Response.error(); }
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const response = await fetch(request);
        if (response.ok && !url.pathname.startsWith("/admin")) cache.put(request, response.clone());
        return response;
      } catch (_) {
        const exact = await cache.match(request);
        if (exact) return exact;
        const shell = await cache.match(url.pathname) || await cache.match("/");
        return shell || (await cache.match("/offline.html")) || Response.error();
      }
    })());
  }
});
