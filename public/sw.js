const CACHE_NAME = "selenite-pages-v1";
const MAX_CACHE_ENTRIES = 50;
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(cache) {
  const requests = await cache.keys();
  const now = Date.now();

  await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      const cachedAt = Number(response?.headers.get("sw-cached-at") ?? "0");

      if (cachedAt && now - cachedAt > MAX_CACHE_AGE_MS) {
        await cache.delete(request);
      }
    }),
  );

  const freshRequests = await cache.keys();
  const excessCount = freshRequests.length - MAX_CACHE_ENTRIES;

  if (excessCount > 0) {
    await Promise.all(
      freshRequests
        .slice(0, excessCount)
        .map((request) => cache.delete(request)),
    );
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const headers = new Headers(networkResponse.headers);
      headers.set("sw-cached-at", String(Date.now()));

      const cacheResponse = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });

      await cache.put(request, cacheResponse);
      await trimCache(cache);
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.mode !== "navigate"
  ) {
    return;
  }

  event.respondWith(networkFirst(request));
});
