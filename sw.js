// Mode hors ligne : garde l'appli en cache et la sert sans connexion.
// Pour forcer une mise à jour complète un jour, change le numéro de version ci-dessous.
const CACHE = 'ma-musique-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  var ok = url.origin === self.location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if(!ok) return;
  e.respondWith(caches.open(CACHE).then(function(cache){
    var network = fetch(req).then(function(res){
      if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(function(){ return null; });
    return cache.match(req, {ignoreSearch:true}).then(function(cached){
      if(cached){ e.waitUntil(network); return cached; }
      return network.then(function(res){
        if(res) return res;
        if(req.mode === 'navigate') return cache.match('index.html');
        return Response.error();
      });
    });
  }));
});
