/* Temmatics Card - service worker. VERSI diganti otomatis oleh build. */
var VERSI='f29553743a';
var CACHE_INTI='temmatics-inti-'+VERSI;
var CACHE_LUAR='temmatics-luar-v1';
var INTI=['./','index.html','config.js','manifest.json','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE_INTI).then(function(c){
    return Promise.all(INTI.map(function(u){return c.add(new Request(u,{cache:'reload'})).catch(function(){})}));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k.indexOf('temmatics-inti-')===0&&k!==CACHE_INTI}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});

function jaringanDulu(req,cacheName){
  return fetch(req,{cache:'no-cache'}).then(function(res){
    if(res&&res.ok){var cp=res.clone();caches.open(cacheName).then(function(c){c.put(req,cp)})}
    return res;
  }).catch(function(){
    return caches.match(req,{ignoreSearch:true}).then(function(hit){return hit||Promise.reject(new Error('offline'))});
  });
}
function cacheDulu(req){
  return caches.match(req).then(function(hit){
    if(hit)return hit;
    return fetch(req).then(function(res){
      if(res&&(res.ok||res.type==='opaque')){var cp=res.clone();caches.open(CACHE_LUAR).then(function(c){c.put(req,cp)})}
      return res;
    });
  });
}

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;                       // data (POST ke Apps Script) tidak pernah lewat cache
  var u=new URL(req.url);
  if(/(^|\.)script\.google(usercontent)?\.com$/.test(u.hostname))return;
  if(u.origin===location.origin){
    if(req.mode==='navigate'){
      e.respondWith(fetch(req.url,{cache:'no-cache'}).then(function(res){
        if(res&&res.ok){var cp=res.clone();caches.open(CACHE_INTI).then(function(c){c.put('./',cp)})}
        return res;
      }).catch(function(){return caches.match('./')}));
      return;
    }
    e.respondWith(jaringanDulu(req,CACHE_INTI));      // aplikasi & config.js: selalu coba versi terbaru
    return;
  }
  if(/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)$/.test(u.hostname)){
    e.respondWith(cacheDulu(req));                    // font & pustaka: sekali unduh, lalu dari cache
  }
});
