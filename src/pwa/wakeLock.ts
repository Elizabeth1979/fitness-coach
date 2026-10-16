// Keeps the screen on during a workout.
//
// The browser drops the lock on its own whenever the page is hidden (screen
// locked, another app in front), so we listen for that release and take the
// lock again when the page is visible — for as long as a workout wants it.

let wanted = false;                       // between requestWakeLock() and releaseWakeLock()
let sentinel: WakeLockSentinel | null = null;
let pending: Promise<void> | null = null; // a request in flight

function acquire(): Promise<void> {
  if (!('wakeLock' in navigator) || sentinel) return Promise.resolve();
  pending ??= navigator.wakeLock.request('screen')
    .then(async (s) => {
      if (!wanted) { await s.release(); return; } // released while the request was in flight
      sentinel = s;
      s.addEventListener('release', () => { if (sentinel === s) sentinel = null; });
    })
    .catch(() => { /* wake lock denied; the workout still runs */ })
    .finally(() => { pending = null; });
  return pending;
}

function onVisibilityChange(): void {
  if (wanted && document.visibilityState === 'visible') void acquire();
}

export async function requestWakeLock(): Promise<void> {
  wanted = true;
  document.addEventListener('visibilitychange', onVisibilityChange);
  await acquire();
}

export async function releaseWakeLock(): Promise<void> {
  wanted = false;
  document.removeEventListener('visibilitychange', onVisibilityChange);
  const s = sentinel;
  sentinel = null;
  try { await s?.release(); } catch { /* already released */ }
}
