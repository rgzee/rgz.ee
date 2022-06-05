import { h, text, app } from "/v/hyperapp.js";
import { p, span, button } from "/v/hyperapp-html.js";

const getCacheKeys = async (dispatch, options) =>
  dispatch(options.action, "caches" in self ? await caches.keys() : []);
const cacheKeyGetter = (action) => [getCacheKeys, { action }];

const on = (dispatch, props) => {
  const listener = (e) => dispatch(props.action, e);
  addEventListener(props.status, listener);
  return () => removeEventListener(props.name, listener);
};
const onStatus = (status) => (action) => [on, { status, action }];

const GotCacheKeys = (state, cacheKeys) => ({ ...state, cacheKeys });
const GoOnline = (state) => ({ ...state, isOnline: true });
const GoOffline = (state) => ({ ...state, isOnline: false });

const textCacheKeys = (keys) =>
  text(
    keys && keys.length
      ? ` and all pages are prefetched into cache version ${keys.join(", ")}.`
      : `, but there is no cache for ${location.origin}.`
  );

const onlineLabel = span({ className: "online label" }, text("online"));
const offlineLabel = span({ className: "offline label" }, text("offline"));
const spanOnline = (isOnline) => (isOnline ? onlineLabel : offlineLabel);

app({
  init: [
    { isOnline: navigator.onLine, cacheKeys: [] },
    cacheKeyGetter(GotCacheKeys),
  ],
  view: ({ isOnline, cacheKeys }) =>
    p([text("you are "), spanOnline(isOnline), textCacheKeys(cacheKeys)]),
  subscriptions: () => [
    onStatus("online")(GoOnline),
    onStatus("offline")(GoOffline),
  ],
  node: document.getElementById("cache"),
});
