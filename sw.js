const cacheKey = "2022061042";
const cacheUrls = [
  "/",
  "/0/",
  "/0/0.css",
  "/0/0.gif",
  "/0/00.css",
  "/a/",
  "/a/cache.js",
  "/a/m.json",
  "/a/r.js",
  "/favicon.ico",
  "/favicon.png",
  "/favicon.svg",
  "/favicon512.png",
  "/license",
  "/s/",
  "/s/s.css",
  "/s/ys.gif",
  "/sw.js",
  "/v/hyperapp-html.js",
  "/v/hyperapp.js",
];

addEventListener("install", (e) => e.waitUntil(pre(cacheKey, cacheUrls)));
addEventListener("activate", (e) => e.waitUntil(keepOnly(cacheKey)));
addEventListener("fetch", (e) => e.respondWith(cachedFetch(e, cacheKey)));

const pre = async (key, urls) => {
  await (await caches.open(key)).addAll(urls);
  await skipWaiting();
};

const keepOnly = async (cacheKey) => {
  const invalidCaches = (await caches.keys()).filter((key) => key !== cacheKey);
  for (const invalidCache of invalidCaches) {
    await caches.delete(invalidCache);
  }
  await clients.claim();
};

const cachedFetch = async ({ request, waitUntil }, key) => {
  const cacheResponse = await caches.match(request);
  if (cacheResponse) return cacheResponse;
  const networkResponse = await fetch(request);
  if (request.url.startsWith(location.origin)) {
    const cache = await caches.open(key);
    await cache.put(request, networkResponse.clone());
  }
  if (networkResponse) return networkResponse;
};
