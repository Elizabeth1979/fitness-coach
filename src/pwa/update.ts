// Keeps the installed app current.
//
// The offline copy (service worker) normally only looks for a new version when
// the app is launched, and even when it finds one the open page keeps running
// the old code — so a phone could show an old version for days. Here we:
//   1. check for a new version every time the app comes back to the foreground;
//   2. switch to it (reload) as soon as it takes over — but never mid-workout:
//      if a workout is running, we wait until you're back on the home screen.
// The service worker itself activates immediately (registerType 'autoUpdate' →
// skipWaiting + clientsClaim), which is what fires 'controllerchange'.

let busy = false;        // a workout (or its finish screen) is on screen
let updateReady = false; // a new version took over while busy

/** Tell the updater whether it's safe to reload right now. */
export function setBusy(isBusy: boolean): void {
  busy = isBusy;
  if (!busy && updateReady) window.location.reload();
}

export function keepAppUpdated(): void {
  if (!('serviceWorker' in navigator)) return;
  // On a first-ever visit the new worker also "takes over", but this page is
  // already the latest code — only reload when replacing an older version.
  const replacingOldVersion = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!replacingOldVersion) return;
    updateReady = true;
    if (!busy) window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => {});
  });
}
