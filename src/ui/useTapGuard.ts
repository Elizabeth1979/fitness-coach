import { useCallback, useState, type MouseEvent } from 'react';

/** How long after a screen or sheet appears a tap is taken as the tail of a double-tap. */
export const TAP_GUARD_MS = 400;

/**
 * A quick second tap lands on whatever the NEW screen put under the finger:
 * Start → Skip, ✕ End → Start, a move → its sheet's Swap. Use as `onClickCapture`
 * on a screen or sheet: taps in its first TAP_GUARD_MS are dropped. Keyboard
 * clicks (detail 0) always go through.
 */
export function useTapGuard(): (e: MouseEvent) => void {
  const [shownAt] = useState(() => performance.now());
  return useCallback((e: MouseEvent) => {
    if (e.detail > 0 && performance.now() - shownAt < TAP_GUARD_MS) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [shownAt]);
}
