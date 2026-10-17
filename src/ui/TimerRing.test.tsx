import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TimerRing } from './TimerRing';
import css from '../index.css?raw';

// Elli (#12): on her iPhone the ring stayed a green dot at the top while the time counted down.
// The ring is redrawn every frame, and a CSS transition on stroke-dashoffset restarted on each
// redraw; WebKit (every iPhone browser) restarts it from where it began, so it never moved.

const fill = (c: HTMLElement) => c.querySelector('.timer-fill')!;
const circumference = 2 * Math.PI * 86;

describe('TimerRing', () => {
  it('draws the part of the time that is left (full at the start, half at halfway, empty at the end)', () => {
    const offset = (remaining: number) => Number(fill(render(<TimerRing remaining={remaining} total={40} />).container).getAttribute('stroke-dashoffset'));
    expect(offset(40)).toBeCloseTo(0);
    expect(offset(20)).toBeCloseTo(circumference / 2);
    expect(offset(0)).toBeCloseTo(circumference);
  });

  it('does not animate the ring with a CSS transition (it is redrawn every frame; WebKit froze it)', () => {
    const rule = css.match(/\n\.timer-fill\s*\{([^}]*)\}/)?.[1];
    expect(rule).toBeDefined();
    expect(rule).not.toMatch(/stroke-dashoffset|transition:\s*all/);
  });
});
