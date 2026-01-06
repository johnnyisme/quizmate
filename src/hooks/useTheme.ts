// Custom hook for managing theme
import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isThemeReady, setIsThemeReady] = useState<boolean>(false);

  // Initialize theme + dynamic KaTeX CSS loading
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    document.documentElement.classList.toggle('light', !shouldBeDark);
    
    // Dynamic KaTeX CSS loading (only when needed)
    if (typeof window !== 'undefined' && !document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/katex.min.css';
      link.integrity = 'sha384-Pu5+C18nP5dwykLJOhd2U4Xen7rjScHN/qusop27hdd2drI+lL5KvX7YntvT8yew';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    
    // Immediately show content for loading screen
    setIsThemeReady(true);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    const root = document.documentElement;
    root.classList.toggle('dark', newTheme);
    root.classList.toggle('light', !newTheme);
  };

  return {
    isDark,
    isThemeReady,
    toggleTheme,
  };
};
