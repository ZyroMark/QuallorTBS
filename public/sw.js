const CACHE_NAME = "quallor-v1";
const OFFLINE_URL = "/offline";

// Assets to cache immediately on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/commute",
  "/trips",
  "/auth/login",
  "/auth/signup",
  "/offline",
];

// Google Fonts to cache
const FONT_URLS = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&display=swap",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...PRECACHE_URLS, ...FONT_URLS]);
    }).catch(() => {
      // Fail silently if some resources can't be cached offline
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) return;

  // For navigation requests (HTML pages) — network first, fallback to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For Google Fonts and static assets — cache first
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // For Next.js static assets (_next/static) — cache first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // For images — cache first, network fallback
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        }).catch(() => {
          return new Response("", { status: 404 });
        });
      })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Listen for sync events for offline bookings
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-bookings") {
    event.waitUntil(syncPendingBookings());
  }
});

async function syncPendingBookings() {
  // In a real app this would POST pending bookings to an API
  // For now we just notify the client that sync is complete
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_COMPLETE" });
  });
}
