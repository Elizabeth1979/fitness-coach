import type { Category } from '../domain/types';

export interface CatColor {
  /** display label, e.g. "Push" */
  label: string;
}

// Movement categories are shown as plain grey words, not colours: colour in
// this app is reserved for "do this" (Start, the running timer, done).
const COLORS: Record<Category, CatColor> = {
  warmup:   { label: 'Warm-up' },
  push:     { label: 'Push' },
  pull:     { label: 'Pull' },
  legs:     { label: 'Legs' },
  hinge:    { label: 'Hinge' },
  carry:    { label: 'Carry' },
  crawl:    { label: 'Crawl' },
  core:     { label: 'Core' },
  balance:  { label: 'Balance' },
  mobility: { label: 'Mobility' },
};

const FALLBACK: CatColor = { label: 'Move' };

export function catColor(category: string): CatColor {
  return COLORS[category as Category] ?? FALLBACK;
}
