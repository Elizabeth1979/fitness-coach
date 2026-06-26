import type { Category } from '../domain/types';

export interface CatColor {
  /** vivid foreground for text + accents (AA-readable on `soft`) */
  ink: string;
  /** pale tinted background */
  soft: string;
  /** display label */
  label: string;
}

// A cheerful, distinct hue per movement type — turns the all-purple circuit
// into a colorful map of the body. Inks are darkened to stay AA-readable on
// their pale `soft` backgrounds.
const COLORS: Record<Category, CatColor> = {
  warmup:   { ink: '#c2255c', soft: '#ffe1ee', label: 'Warm-up' },
  push:     { ink: '#e8454f', soft: '#ffe7e7', label: 'Push' },
  pull:     { ink: '#1c7ed6', soft: '#e1f0fd', label: 'Pull' },
  legs:     { ink: '#2f9e44', soft: '#e3f8ea', label: 'Legs' },
  hinge:    { ink: '#7048e8', soft: '#ece5fc', label: 'Hinge' },
  carry:    { ink: '#e8830c', soft: '#fff1db', label: 'Carry' },
  crawl:    { ink: '#0c8599', soft: '#d8f3f7', label: 'Crawl' },
  core:     { ink: '#d6336c', soft: '#ffe3ee', label: 'Core' },
  balance:  { ink: '#3b5bdb', soft: '#e6ebff', label: 'Balance' },
  mobility: { ink: '#9c36b5', soft: '#f8e6fb', label: 'Mobility' },
};

const FALLBACK: CatColor = { ink: '#7338b0', soft: '#f0e7fb', label: 'Move' };

export function catColor(category: string): CatColor {
  return COLORS[category as Category] ?? FALLBACK;
}
