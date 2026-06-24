import { describe, it, expect, vi } from 'vitest';
import { WebFeedback, HAPTIC_PATTERNS } from './feedback';

describe('WebFeedback', () => {
  it('uses navigator.vibrate with the kind\'s pattern when available', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    const fb = new WebFeedback();
    fb.fire('rest');
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.rest);
  });

  it('defines distinct patterns for all four kinds', () => {
    const keys = Object.keys(HAPTIC_PATTERNS);
    expect(keys.sort()).toEqual(['countdown', 'next', 'rest', 'start']);
  });
});
