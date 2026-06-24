import '@testing-library/jest-dom';

// Mock localStorage since jsdom seems to not provide it properly
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => { delete store[k]; }); },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] || null,
};

// Replace window.localStorage and global.localStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
}
if (typeof global !== 'undefined') {
  (global as any).localStorage = mockLocalStorage;
}
