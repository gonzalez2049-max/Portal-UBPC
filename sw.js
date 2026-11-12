/* Service Worker del Portal UBPC — estrategia "network-first".
   Siempre intenta traer la última versión desde la red; si no hay conexión,
   usa la copia en caché. Así el portal se actualiza solo y no queda "pegado"
   en una versión vieja (fin del problema de caché en la app instalada). */
const CACHE = "ubpc-cache-v1";

self.addEventListener("install", () => {
  // Activa de inmediato la nueva versión del SW sin esperar.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Borra cachés antiguas.
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Solo manejamos peticiones del mismo origen (los assets del portal).
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      // Red primero: siempre la última versión cuando hay internet.
      const fresh = await fetch(req, { cache: "no-store" });
      if (fresh && fresh.status === 200) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      // Sin conexión: usa la copia guardada si existe.
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
