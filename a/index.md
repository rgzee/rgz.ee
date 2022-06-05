<script defer type="module" src="index.js"></script>
<style>
.label { border-radius: 0.75rem; padding: 0.1rem 0.4rem; font-size: 0.8rem; }
.online { background-color: #a8ff60; color: #285f00; }
.offline { color: #5f0c00; background-color: #ff6c60; }
</style>

# let's take it offline

this site is powered by service worker, works offline, and can be installed as an app.

<p id="app"></p>

so all requests can be served from the cache. when something is missing in that
cache (and you're online) service worker tries to fetch it from the network.

## ingredients

- [r.js](r.js) &mdash; register service worker
- [m.json](m.json) &mdash; manifest
- [sw.js](/sw.js) &mdash; service worker
