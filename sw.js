// Arise service worker: lets the installed web app open without a connection.
// Pages: try the network first so updates show up, fall back to the saved copy.
// Pictures and fonts: use the saved copy first. The pep-talk request is never cached.
const CACHE = "arise-v7";
const SHELL = [
  "./", "./index.html", "./reminders.html", "./manifest.webmanifest", "./config.local.js",
  "./assets/icons/icon-192.png", "./assets/icons/icon-512.png",
  "./assets/companions/web/bg-sunrise.jpg", "./assets/companions/web/bg-rain.jpg",
  "./assets/companions/web/woman-light.webp", "./assets/companions/web/man-light.webp",
  "./assets/companions/web/woman-waterproof.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // the pep talk (POST) always goes to the network
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  const isFont = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (!sameSite && !isFont) return; // weather and other live data: never cached

  if (req.mode === "navigate" || url.pathname.endsWith(".js")) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});

// Tapping a reminder pop-up brings Arise to the front (or opens it).
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.registration.scope));
      return open ? open.focus() : self.clients.openWindow("./index.html");
    })
  );
});
