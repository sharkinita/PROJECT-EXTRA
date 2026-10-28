const CACHE_NAME = "project-extra-shell-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Cache the core app shell. Some hosts may serve only "/" or only "/index.html",
    // so one missing path should not prevent installation.
    await Promise.allSettled(
      APP_SHELL.map(async (path) => {
        const response = await fetch(path, { cache: "reload" });
        if (response.ok || response.type === "opaque") {
          await cache.put(path, response);
        }
      })
    );

    // Best-effort cache for the current CDN dependencies used by index.html.
    // If a CDN is unavailable, the app shell can still install.
    const externalAssets = [
      "https://cdn.tailwindcss.com",
      "https://unpkg.com/lucide@latest"
    ];
    await Promise.allSettled(
      externalAssets.map(async (url) => {
        const response = await fetch(url, { mode: "no-cors" });
        await cache.put(url, response);
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) => name.startsWith("project-extra-shell-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // App navigation: try the network first to get the latest page,
  // then fall back to the cached page when offline.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put("/", response.clone()).catch(() => {});
        return response;
      } catch (error) {
        return (await caches.match(request)) ||
               (await caches.match("/")) ||
               (await caches.match("/index.html")) ||
               new Response("Project EXTRA is not available offline yet. Open it once while connected to the internet.", {
                 status: 503,
                 headers: { "Content-Type": "text/plain; charset=utf-8" }
               });
      }
    })());
    return;
  }

  // Same-origin static files: cache first, then network and save a copy.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        return new Response("", { status: 504, statusText: "Offline and resource not cached" });
      }
    })());
    return;
  }

  // External libraries: use a cached copy when available, otherwise try network.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok || response.type === "opaque") {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      return new Response("", { status: 504, statusText: "External resource unavailable offline" });
    }
  })());
});
