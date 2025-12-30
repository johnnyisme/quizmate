'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // 服務端渲染時返回默認值
    if (typeof window === 'undefined') return 'system';
    // 客戶端立即從 localStorage 讀取
    const stored = localStorage.getItem('theme') as Theme | null;
    return (stored && ['light', 'dark', 'system'].includes(stored)) ? stored : 'system';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // 監聽 theme 變化並應用到 DOM
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      console.log('Applying theme:', isDark ? 'dark' : 'light');
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        setResolvedTheme('dark');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    if (theme === 'system') {
      // 監聽系統偏好變化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setThemeAndSave = (newTheme: Theme) => {
    console.log('Setting theme to:', newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  return { theme, resolvedTheme, setTheme: setThemeAndSave };
}
