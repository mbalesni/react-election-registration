"use strict";var precacheConfig=[["/index.html","3f3612c3d653a024d4afc7762a2dfc71"],["/static/css/main.cbba85a4.css","da3e81ecc878d2d504d4ac104c5876f2"],["/static/js/main.f5d2a543.js","6df12cf07a5d83f138733684c84958b6"],["/static/media/fa-brands-400.2248542e.woff","2248542e1bbbd548a157e3e6ced054fc"],["/static/media/fa-brands-400.3654744d.woff2","3654744dc6d6c37c9b3582b57622df5e"],["/static/media/fa-brands-400.748ab466.eot","748ab466bee11e0b2132916def799916"],["/static/media/fa-brands-400.7febe26e.ttf","7febe26eeb4dd8e3a3c614a144d399fb"],["/static/media/fa-brands-400.b032e14e.svg","b032e14eac87e3001396ff597e4ec15f"],["/static/media/fa-regular-400.33f727cc.woff2","33f727ccde4b05c0ed143c5cd78cda0c"],["/static/media/fa-regular-400.3929b3ef.svg","3929b3ef871fa90bbb4e77e005851e74"],["/static/media/fa-regular-400.54f142e0.ttf","54f142e03adc6da499c2af4f54ab76fd"],["/static/media/fa-regular-400.b58f468f.eot","b58f468f84168d61e0ebc1e1f423587c"],["/static/media/fa-regular-400.f3dd4f39.woff","f3dd4f397fbc5aaf831b6b0ba112d75c"],["/static/media/fa-solid-900.035a137a.eot","035a137af03db6f1af76a589da5bb865"],["/static/media/fa-solid-900.6661d6b3.woff","6661d6b3521b4c480ba759e4b9e480c1"],["/static/media/fa-solid-900.8a8c0474.woff2","8a8c0474283e0d9ef41743e5e486bf05"],["/static/media/fa-solid-900.9bbbee00.svg","9bbbee00f65769a64927764ef51af6d0"],["/static/media/fa-solid-900.b6a14bb8.ttf","b6a14bb88dbc580e45034af297c8f605"],["/static/media/logo.52d070c3.jpg","52d070c30dcfc411e9d0bbbb265dc2bc"],["/static/media/ticket.2773380c.png","2773380cf308e09462931c4c1260e4f8"],["/static/media/voting.80a03e42.png","80a03e423cf40d190c0d011ebd2fa061"]],cacheName="sw-precache-v3-sw-precache-webpack-plugin-"+(self.registration?self.registration.scope:""),ignoreUrlParametersMatching=[/^utm_/],addDirectoryIndex=function(e,t){var a=new URL(e);return"/"===a.pathname.slice(-1)&&(a.pathname+=t),a.toString()},cleanResponse=function(t){return t.redirected?("body"in t?Promise.resolve(t.body):t.blob()).then(function(e){return new Response(e,{headers:t.headers,status:t.status,statusText:t.statusText})}):Promise.resolve(t)},createCacheKey=function(e,t,a,n){var r=new URL(e);return n&&r.pathname.match(n)||(r.search+=(r.search?"&":"")+encodeURIComponent(t)+"="+encodeURIComponent(a)),r.toString()},isPathWhitelisted=function(e,t){if(0===e.length)return!0;var a=new URL(t).pathname;return e.some(function(e){return a.match(e)})},stripIgnoredUrlParameters=function(e,a){var t=new URL(e);return t.hash="",t.search=t.search.slice(1).split("&").map(function(e){return e.split("=")}).filter(function(t){return a.every(function(e){return!e.test(t[0])})}).map(function(e){return e.join("=")}).join("&"),t.toString()},hashParamName="_sw-precache",urlsToCacheKeys=new Map(precacheConfig.map(function(e){var t=e[0],a=e[1],n=new URL(t,self.location),r=createCacheKey(n,hashParamName,a,/\.\w{8}\./);return[n.toString(),r]}));function setOfCachedUrls(e){return e.keys().then(function(e){return e.map(function(e){return e.url})}).then(function(e){return new Set(e)})}self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheName).then(function(n){return setOfCachedUrls(n).then(function(a){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(t){if(!a.has(t)){var e=new Request(t,{credentials:"same-origin"});return fetch(e).then(function(e){if(!e.ok)throw new Error("Request for "+t+" returned a response with status "+e.status);return cleanResponse(e).then(function(e){return n.put(t,e)})})}}))})}).then(function(){return self.skipWaiting()}))}),self.addEventListener("activate",function(e){var a=new Set(urlsToCacheKeys.values());e.waitUntil(caches.open(cacheName).then(function(t){return t.keys().then(function(e){return Promise.all(e.map(function(e){if(!a.has(e.url))return t.delete(e)}))})}).then(function(){return self.clients.claim()}))}),self.addEventListener("fetch",function(t){if("GET"===t.request.method){var e,a=stripIgnoredUrlParameters(t.request.url,ignoreUrlParametersMatching),n="index.html";(e=urlsToCacheKeys.has(a))||(a=addDirectoryIndex(a,n),e=urlsToCacheKeys.has(a));var r="/index.html";!e&&"navigate"===t.request.mode&&isPathWhitelisted(["^(?!\\/__).*"],t.request.url)&&(a=new URL(r,self.location).toString(),e=urlsToCacheKeys.has(a)),e&&t.respondWith(caches.open(cacheName).then(function(e){return e.match(urlsToCacheKeys.get(a)).then(function(e){if(e)return e;throw Error("The cached response that was expected is missing.")})}).catch(function(e){return console.warn('Couldn\'t serve response for "%s" from cache: %O',t.request.url,e),fetch(t.request)}))}});