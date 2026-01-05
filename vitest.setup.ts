// vitest.setup.ts
import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock URL.createObjectURL and revokeObjectURL (not available in jsdom)
global.URL.createObjectURL = (_blob: Blob | MediaSource) => {
  return `blob:${Math.random().toString(36).substring(7)}`;
};

global.URL.revokeObjectURL = (_url: string) => {
  // No-op in test environment
};
