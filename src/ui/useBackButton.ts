import { useEffect, useEffectEvent } from 'react';

// The phone's Back button (or swipe-back) should step back INSIDE the app —
// close a sheet, leave the workout for Home — not quit it. While something is
// open we keep one extra history entry: Back pops it and the newest open layer
// handles it instead. Closing a layer with its own button pops the entry again,
// so the next Back behaves normally.

const MARK = 'moveWithElliLayer';
const layers: (() => void)[] = [];
const isMarked = (): boolean => (history.state as Record<string, unknown> | null)?.[MARK] === true;

function arm(): void {
  if (layers.length > 0 && !isMarked()) history.pushState({ [MARK]: true }, '');
}

function onPopState(): void {
  if (isMarked()) return; // moved forward onto our entry: nothing to handle
  layers.at(-1)?.();
  setTimeout(arm, 0); // something still open after re-render → keep catching Back
}

/** While `active`, the Back button calls `onBack` instead of leaving the app. */
export function useBackButton(active: boolean, onBack: () => void): void {
  const handle = useEffectEvent(onBack);
  useEffect(() => {
    if (!active) return;
    const layer = () => handle();
    if (layers.length === 0) window.addEventListener('popstate', onPopState);
    layers.push(layer);
    arm();
    return () => {
      layers.splice(layers.indexOf(layer), 1);
      // Deferred: a layer replaced in the same render (or React's dev double-mount) keeps the entry.
      setTimeout(() => {
        if (layers.length > 0) return;
        window.removeEventListener('popstate', onPopState);
        if (isMarked()) history.back();
      }, 0);
    };
  }, [active]);
}
