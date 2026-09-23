// 枠なし版をオフラインでも読めるようにする。
// index.html は**毎回まず取りに行く** (中身が更新されるので)。
// 図と外部の部品は一度取れたら使い回す (数が多く、変わらないので)。
const V = 'textbook-5245986457';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => c.addAll(['./', './index.html', './manifest.json'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || new URL(req.url).pathname.endsWith('/index.html');
  if (isPage) {
    // 新しい版があればそれを。無ければ前に取れたもので開く
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone();
      caches.open(V).then(c => c.put(req, copy));
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) {
      const copy = r.clone();
      caches.open(V).then(c => c.put(req, copy));
    }
    return r;
  }).catch(() => hit)));
});
