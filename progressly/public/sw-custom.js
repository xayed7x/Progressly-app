self.addEventListener('fetch', (event) => {
  // This is a minimal fetch handler to meet Chrome's installability criteria.
  // It doesn't perform any caching, just passes the request through to the network.
  event.respondWith(fetch(event.request));
});
