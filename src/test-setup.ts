import '@testing-library/jest-dom';

// Provide a working localStorage for environments where jsdom doesn't supply one
// (e.g. when vitest launches jsdom without a URL/localstorage-file).
if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string): string | null => store[k] ?? null,
      setItem: (k: string, v: string): void => { store[k] = v; },
      removeItem: (k: string): void => { delete store[k]; },
      clear: (): void => { for (const k of Object.keys(store)) delete store[k]; },
      get length(): number { return Object.keys(store).length; },
      key: (i: number): string | null => Object.keys(store)[i] ?? null,
    },
    writable: true,
  });
}
