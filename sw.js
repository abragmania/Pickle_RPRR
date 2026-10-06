/* Offline support: network first so updates arrive, cache fallback so it works at the courts with no signal. */
var C='pickle-rr-v1';
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','index.html','manifest.webmanifest','icon-192.png','apple-touch-icon.png'])}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==C}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(function(r){
    var cp=r.clone();caches.open(C).then(function(c){c.put(e.request,cp)}).catch(function(){});return r;
  }).catch(function(){return caches.match(e.request).then(function(m){return m||caches.match('index.html')})}));
});
