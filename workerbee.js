const cacheVersion = "cachev2";
const files = ["app.html", "js/cookbook.js", "js/data.js", "js/display.js", "js/main.js", "css/custom.css",
                 "css/normalize.css", "css/skeleton.css", "js/fraction.js", "js/he.js", "js/jquery.js", "js/jquery-ui.js",
                 "js/jquery.ui.touch-punch.js", "js/pouchdb.js", "font/MaterialIcons.woff2"
];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(cacheVersion).then(cache => cache.addAll(files)));
    self.skipWaiting();
});
  
self.addEventListener("activate", e => {
    e.waitUntil(caches.keys().then(keyList => Promise.all(keyList.map(key => {
        if (key !== cacheVersion) { return caches.delete(key); }
    }))));
    self.clients.claim();
});

self.addEventListener("fetch", e => {
    e.respondWith(caches.open(cacheVersion).then(cache => cache.match(e.request).then(response => response || fetch(e.request))));
});