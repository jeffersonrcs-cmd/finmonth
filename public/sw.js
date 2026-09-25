// FinMonth Service Worker - Offline Cache & Push Notifications
const CACHE_NAME = "finmonth-cache-v5";
const OFFLINE_URLS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/favicon.ico",
  "/apple-touch-icon-finmonth-v3.png",
  "/apple-touch-icon.png",
  "/icon-192.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {
        // Continue even if some asset cannot be cached immediately
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.url.includes("supabase.co") || request.url.includes("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        if (request.mode === "navigate") {
          const fallback = await caches.match("/");
          if (fallback) return fallback;
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || "FinMonth";
    const options = {
      body: data.body || "Lembrete financeiro",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.url || "/",
      vibrate: [100, 50, 100],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("FinMonth", {
        body: text,
        icon: "/icon-192.png",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});