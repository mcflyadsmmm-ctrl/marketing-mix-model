const CACHE = "mcfly-site-20260728a";
// Precache shell only — CSS/JS use ?v= query busts on pages; do not pin unversioned assets.
const ASSETS = [
  "/",
  "/download",
  "/download.html",
  "/favicon.png",
  "/manifest.webmanifest",
];

function isVersionedStatic(url) {
  return url.searchParams.has("v") || url.pathname.startsWith("/assets/");
}

function isHtmlRequest(req, url) {
  if (req.mode === "navigate") return true;
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) return true;
  return url.pathname === "/" || url.pathname.endsWith(".html");
}

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first ONLY for version-busted static assets (?v= or /assets/)
  if (isVersionedStatic(url)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        });
      }),
    );
    return;
  }

  // Network-first for navigation/HTML (and other non-static GETs)
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && isHtmlRequest(req, url)) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error())),
  );
});
