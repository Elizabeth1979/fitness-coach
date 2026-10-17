import { describe, it, expect } from 'vitest';

// The design system lives in src/index.css. Components may only set inline
// styles for values computed at runtime; everything else is a class.
const ALLOWED: Record<string, RegExp[]> = {
  'ActiveScreen.tsx': [/^style=\{\{ transform: `scaleX\(/], // progress through the workout
  'DoneScreen.tsx': [/^style=\{\{ left: p\.left, animationDelay: p\.delay \}\}/], // confetti positions
};

const sources = import.meta.glob<string>(['../**/*.tsx', '!../**/*.test.tsx'], { query: '?raw', import: 'default', eager: true });

describe('inline styles', () => {
  it('finds the component sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
  });

  it.each(Object.entries(sources))('%s only uses inline styles for runtime values', (file, src) => {
    const name = file.split('/').pop() ?? file;
    const uses = src.match(/style=\{[^\n]*/g) ?? [];
    const unexpected = uses.filter((u) => !(ALLOWED[name] ?? []).some((re) => re.test(u)));
    expect(unexpected).toEqual([]);
  });
});
