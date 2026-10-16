// Retires the old GitHub Pages copy of Move With Elli (the app now lives on
// Vercel). Phones that installed the old version fetch this worker on their
// next update check: it deletes the old offline copy, unregisters itself and
// sends any open window to the new address.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate('https://fitness-coach-peach.vercel.app/');
  })());
});
