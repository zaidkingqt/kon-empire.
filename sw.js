// Service Worker: الشبكة أولًا لملفات اللعبة (فتصلك التحديثات فورًا) مع الاحتياط من الذاكرة عند انقطاع الإنترنت.
const CACHE = "kon-empire-shell-v4";
const SHELL = ["./", "index.html", "style.css", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "main.js", "icons.js", "data.js", "state.js", "bus.js", "util.js", "economy.js", "engine.js", "missions.js",
  "render.js", "uicore.js", "panels.js", "ui.js", "audio.js", "ads.js", "analytics.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== location.origin) return;       // خطوط جوجل وغيرها تمر كما هي
  e.respondWith(
    fetch(req).then(res => {
      if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
