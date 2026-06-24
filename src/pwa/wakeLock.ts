type Sentinel = { release: () => Promise<void> } | null;
let sentinel: Sentinel = null;

export async function requestWakeLock(): Promise<void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } };
    if (!nav.wakeLock) return;
    sentinel = await nav.wakeLock.request('screen');
    document.addEventListener('visibilitychange', onVisible);
  } catch { /* wake lock denied; the workout still runs */ }
}

async function onVisible(): Promise<void> {
  if (document.visibilityState === 'visible' && sentinel === null) await requestWakeLock();
}

export async function releaseWakeLock(): Promise<void> {
  document.removeEventListener('visibilitychange', onVisible);
  try { await sentinel?.release(); } catch { /* ignore */ }
  sentinel = null;
}
