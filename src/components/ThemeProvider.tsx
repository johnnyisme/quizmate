'use client';

import { useEffect } from 'react';

export function ThemeProvider() {
  useEffect(() => {
    // 從 localStorage 讀取主題偏好
    const stored = localStorage.getItem('theme');
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    if (stored === 'dark') {
      applyTheme(true);
    } else if (stored === 'light') {
      applyTheme(false);
    } else {
      // system - 使用系統偏好
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
    }
  }, []);

  return null;
}
