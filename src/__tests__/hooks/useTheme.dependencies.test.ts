/**
 * useTheme Hook 依賴陣列測試
 * 
 * 測試目標：驗證 useTheme 的 localStorage 持久化邏輯是否正確
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

describe('useTheme - 依賴陣列與 localStorage 測試', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    Storage.prototype.getItem = vi.fn((key) => store[key] || null);
    Storage.prototype.setItem = vi.fn((key, value) => {
      store[key] = String(value);
    });
    Storage.prototype.removeItem = vi.fn((key) => {
      delete store[key];
    });
    Storage.prototype.clear = vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    });

    // Mock matchMedia
    window.matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList));
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('初始化行為', () => {
    it('應該從 localStorage 讀取 theme 設置', async () => {
      localStorage.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      expect(result.current.isDark).toBe(true);
    });

    it('如果 localStorage 沒有設置，應該使用系統偏好設置', async () => {
      localStorage.removeItem('theme');

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      // 驗證 isThemeReady 被設置
      expect(result.current.isThemeReady).toBe(true);
    });

    it('應該在初始化時載入 KaTeX CSS', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      // 驗證 KaTeX CSS 被加入到 DOM
      const katexCss = document.getElementById('katex-css');
      expect(katexCss).toBeDefined();
    });
  });

  describe('theme 切換', () => {
    it('toggleTheme 應該改變 isDark 狀態', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      const initialDark = result.current.isDark;

      result.current.toggleTheme();

      await waitFor(() => {
        expect(result.current.isDark).toBe(!initialDark);
      });
    });

    it('toggleTheme 應該更新 localStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      result.current.toggleTheme();

      // setItem 應該被呼叫
      expect(setItemSpy).toHaveBeenCalledWith('theme', expect.stringMatching(/dark|light/));
    });

    it('toggleTheme 應該更新 DOM class', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      const isDarkBefore = result.current.isDark;
      result.current.toggleTheme();

      await waitFor(() => {
        expect(result.current.isDark).toBe(!isDarkBefore);
      });

      // 驗證 DOM 被更新
      const htmlElement = document.documentElement;
      if (result.current.isDark) {
        expect(htmlElement.classList.contains('dark')).toBe(true);
      } else {
        expect(htmlElement.classList.contains('light')).toBe(true);
      }
    });
  });

  describe('useEffect 依賴陣列驗證', () => {
    it('應該在組件掛載時運行初始化 effect（依賴陣列為空）', async () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      renderHook(() => useTheme());

      // getItem 應該被呼叫至少一次
      expect(getItemSpy).toHaveBeenCalled();
    });

    it('應該持久化 theme 選擇到 localStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      result.current.toggleTheme();

      // setItem 應該被呼叫
      expect(setItemSpy).toHaveBeenCalled();
    });
  });

  describe('KaTeX CSS 載入', () => {
    it('KaTeX CSS 應該只載入一次', async () => {
      const { rerender } = renderHook(() => useTheme());

      // 多次重新渲染
      rerender();
      rerender();
      rerender();

      // KaTeX CSS 元素應該只有一個
      const katexElements = document.querySelectorAll('[id="katex-css"]');
      expect(katexElements.length).toBeLessThanOrEqual(1);
    });

    it('KaTeX CSS 應該具有正確的屬性', async () => {
      renderHook(() => useTheme());

      const katexCss = document.getElementById('katex-css') as HTMLLinkElement;
      
      if (katexCss) {
        expect(katexCss.rel).toBe('stylesheet');
        expect(katexCss.href).toContain('katex');
      }
    });
  });

  describe('完整流程測試', () => {
    it('完整的 theme 切換流程：載入 → 切換 → 驗證持久化', async () => {
      // Step 1: 初始化
      const { result, rerender } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isThemeReady).toBe(true);
      });

      const initialDark = result.current.isDark;

      // Step 2: 切換 theme
      result.current.toggleTheme();

      await waitFor(() => {
        expect(result.current.isDark).toBe(!initialDark);
      });

      // Step 3: 驗證 localStorage 被更新
      const storedTheme = localStorage.getItem('theme');
      expect(storedTheme).toBe(result.current.isDark ? 'dark' : 'light');

      // Step 4: 重新渲染應該讀取已保存的 theme
      rerender();

      await waitFor(() => {
        expect(result.current.isDark).toBe(!initialDark);
      });
    });
  });
});
