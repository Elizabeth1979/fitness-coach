import type { Category } from '../domain/types';

export interface CatColor {
  /** vivid foreground for text + accents (AA-readable on `soft`) */
  ink: string;
  /** pale tinted background */
  soft: string;
  /** display label */
  label: string;
}

// A muted, distinct hue per movement type — the category coding whispers
// rather than shouts. Inks are darkened to stay AA-readable on their
// near-white `soft` backgrounds.
const COLORS: Record<Category, CatColor> = {
  warmup:   { ink: '#9c4a67', soft: '#f9f1f4', label: 'Warm-up' },
  push:     { ink: '#a3524d', soft: '#faf1f0', label: 'Push' },
  pull:     { ink: '#46688f', soft: '#eff3f8', label: 'Pull' },
  legs:     { ink: '#4a7354', soft: '#f0f5f1', label: 'Legs' },
  hinge:    { ink: '#6a5b9e', soft: '#f3f1f9', label: 'Hinge' },
  carry:    { ink: '#8a5c25', soft: '#f9f3ea', label: 'Carry' },
  crawl:    { ink: '#3f7079', soft: '#eef5f6', label: 'Crawl' },
  core:     { ink: '#9d4f72', soft: '#f9f0f4', label: 'Core' },
  balance:  { ink: '#4d5d99', soft: '#f0f2f9', label: 'Balance' },
  mobility: { ink: '#84518f', soft: '#f7f1f8', label: 'Mobility' },
};

const FALLBACK: CatColor = { ink: '#5d4a7e', soft: '#f2f0f6', label: 'Move' };

export function catColor(category: string): CatColor {
  return COLORS[category as Category] ?? FALLBACK;
}
