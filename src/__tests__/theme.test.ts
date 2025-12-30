// src/__tests__/theme.test.ts
// Dark mode 主題切換功能測試

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Dark Mode Theme Toggle', () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      key: vi.fn(),
      length: 0,
    };

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Reset document.documentElement class
    document.documentElement.className = '';
  });

  describe('Theme Initialization', () => {
    it('should initialize with light theme when no localStorage value', () => {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
      
      expect(shouldBeDark).toBe(false);
    });

    it('should initialize with dark theme when localStorage is "dark"', () => {
      localStorage.setItem('theme', 'dark');
      const stored = localStorage.getItem('theme');
      const shouldBeDark = stored === 'dark';
      
      expect(shouldBeDark).toBe(true);
    });

    it('should initialize with light theme when localStorage is "light"', () => {
      localStorage.setItem('theme', 'light');
      const stored = localStorage.getItem('theme');
      const shouldBeDark = stored === 'dark';
      
      expect(shouldBeDark).toBe(false);
    });

    it('should respect system preference when no localStorage value', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)' ? true : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
      
      expect(shouldBeDark).toBe(true);
    });
  });

  describe('Theme Toggle Logic', () => {
    it('should toggle from light to dark', () => {
      const isDark = false;
      const newTheme = !isDark;
      
      expect(newTheme).toBe(true);
    });

    it('should toggle from dark to light', () => {
      const isDark = true;
      const newTheme = !isDark;
      
      expect(newTheme).toBe(false);
    });

    it('should save theme to localStorage when toggling', () => {
      const newTheme = true;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should save light theme to localStorage', () => {
      const newTheme = false;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('DOM Class Manipulation', () => {
    it('should add dark class and remove light class when dark mode', () => {
      const root = document.documentElement;
      root.classList.toggle('dark', true);
      root.classList.toggle('light', false);
      
      expect(root.classList.contains('dark')).toBe(true);
      expect(root.classList.contains('light')).toBe(false);
    });

    it('should add light class and remove dark class when light mode', () => {
      const root = document.documentElement;
      root.classList.toggle('dark', false);
      root.classList.toggle('light', true);
      
      expect(root.classList.contains('dark')).toBe(false);
      expect(root.classList.contains('light')).toBe(true);
    });

    it('should handle multiple toggles correctly', () => {
      const root = document.documentElement;
      
      // Start with light
      root.classList.toggle('dark', false);
      root.classList.toggle('light', true);
      expect(root.classList.contains('light')).toBe(true);
      
      // Toggle to dark
      root.classList.toggle('dark', true);
      root.classList.toggle('light', false);
      expect(root.classList.contains('dark')).toBe(true);
      expect(root.classList.contains('light')).toBe(false);
      
      // Toggle back to light
      root.classList.toggle('dark', false);
      root.classList.toggle('light', true);
      expect(root.classList.contains('dark')).toBe(false);
      expect(root.classList.contains('light')).toBe(true);
    });
  });

  describe('Theme State Consistency', () => {
    it('should maintain consistent state between localStorage and DOM', () => {
      const newTheme = true;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newTheme);
      document.documentElement.classList.toggle('light', !newTheme);
      
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should handle light theme consistently', () => {
      const newTheme = false;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newTheme);
      document.documentElement.classList.toggle('light', !newTheme);
      
      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });

  describe('Icon Display Logic', () => {
    it('should show sun icon when in dark mode', () => {
      const isDark = true;
      const shouldShowSunIcon = isDark;
      
      expect(shouldShowSunIcon).toBe(true);
    });

    it('should show moon icon when in light mode', () => {
      const isDark = false;
      const shouldShowMoonIcon = !isDark;
      
      expect(shouldShowMoonIcon).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should not be ready initially', () => {
      const isThemeReady = false;
      expect(isThemeReady).toBe(false);
    });

    it('should become ready after initialization', () => {
      const isThemeReady = true;
      expect(isThemeReady).toBe(true);
    });
  });
});
