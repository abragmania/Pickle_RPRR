/* Offline support: network first so updates arrive, cache fallback so it works at the courts with no signal. */
var C='pickle-rr-v3';
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','index.html','logic.js','manifest.webmanifest','icon-192.png','apple-touch-icon.png'].map(function(u){return new Request(u,{cache:'reload'})}))}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==C}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  /* same-origin files always revalidate with the server so a new index.html never meets an old logic.js.
     Page loads (navigate) cannot be rebuilt with options, so they go out as they are. */
  var req=e.request;
  if(new URL(req.url).origin===self.location.origin&&req.mode!=='navigate')req=new Request(req,{cache:'no-cache'});
  e.respondWith(fetch(req).then(function(r){
    var cp=r.clone();caches.open(C).then(function(c){c.put(e.request,cp)}).catch(function(){});return r;
  }).catch(function(){return caches.match(e.request,{ignoreSearch:true}).then(function(m){return m||(e.request.mode==='navigate'?caches.match('index.html'):Response.error())})}));
});
