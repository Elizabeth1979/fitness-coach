import type { CSSProperties } from 'react';
import type { CatColor } from './categoryColor';

/**
 * Bridge a category's colours into the CSS cascade as custom properties.
 * Spread onto any element; global classes (`.cat`, `.panel`, `.icon-badge`,
 * `.swap-pill`, …) read `var(--cat)` / `var(--cat-soft)`. This is the one
 * place the data-driven colour meets the stylesheet — styling rules stay in
 * index.css, only the *value* is passed in.
 */
export function catVars(c: CatColor): CSSProperties {
  return { '--cat': c.ink, '--cat-soft': c.soft } as CSSProperties;
}
