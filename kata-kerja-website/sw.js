// Service worker: halaman bisa dibuka offline setelah kunjungan pertama.
const CACHE = 'kata-kerja-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    // network-first: selalu ambil versi terbaru jika online
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // cache-first untuk aset statis dan font
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
