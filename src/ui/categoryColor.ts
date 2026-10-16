import type { Category } from '../domain/types';

export interface CatColor {
  /** vivid SOLID colour — dark enough to carry white text at AA contrast */
  ink: string;
  /** a faint tint of `ink`, only for the rare soft fill we still keep */
  soft: string;
  /** display label */
  label: string;
}

// One vivid, SOLID, high-contrast hue per movement type — a colourful map of
// the body. No pinks, no pastels: every `ink` is saturated yet dark enough to
// hold white text (AA, ≥4.5:1), so category tags read as bold colour blocks.
const COLORS: Record<Category, CatColor> = {
  warmup:   { ink: '#c2410c', soft: '#fbe7da', label: 'Warm-up' },  // burnt orange
  push:     { ink: '#c81e1e', soft: '#fbdede', label: 'Push' },     // red
  pull:     { ink: '#1d4ed8', soft: '#dde6fb', label: 'Pull' },     // blue
  legs:     { ink: '#15803d', soft: '#dbf0e2', label: 'Legs' },     // green
  hinge:    { ink: '#6d28d9', soft: '#e7defb', label: 'Hinge' },    // violet
  carry:    { ink: '#b45309', soft: '#f8e8d4', label: 'Carry' },    // amber
  crawl:    { ink: '#0e7490', soft: '#d7eef4', label: 'Crawl' },    // cyan
  core:     { ink: '#4338ca', soft: '#e0def7', label: 'Core' },     // indigo
  balance:  { ink: '#4d7c0f', soft: '#e6f0d6', label: 'Balance' },  // lime
  mobility: { ink: '#0f766e', soft: '#d6eeeb', label: 'Mobility' }, // teal
};

const FALLBACK: CatColor = { ink: '#1a1c22', soft: '#e7e9ee', label: 'Move' };

export function catColor(category: string): CatColor {
  return COLORS[category as Category] ?? FALLBACK;
}
