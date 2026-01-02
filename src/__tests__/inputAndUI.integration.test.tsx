// src/__tests__/inputAndUI.integration.test.tsx
// Integration tests for input auto-grow, theme toggle, and sidebar animation

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState, useRef, useEffect } from 'react';

// Mock auto-growing textarea component
function AutoGrowTextarea() {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 22;
      const maxHeight = lineHeight * 3; // 3 lines max
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (textareaRef.current && value) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 22;
      const maxHeight = lineHeight * 3;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  };

  return (
    <div>
      <button
        className={`upload-btn ${isFocused ? 'w-0 opacity-0 pointer-events-none' : 'w-9 opacity-100'}`}
        data-testid="upload-btn"
      >
        Upload
      </button>
      <button
        className={`camera-btn ${isFocused ? 'w-0 opacity-0 pointer-events-none' : 'w-9 opacity-100'}`}
        data-testid="camera-btn"
      >
        Camera
      </button>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid="auto-grow-textarea"
        style={{ minHeight: '36px', maxHeight: '66px' }}
      />
    </div>
  );
}

// Mock theme toggle component
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    setIsDark(shouldBeDark);
    
    document.documentElement.classList.toggle('dark', shouldBeDark);
    document.documentElement.classList.toggle('light', !shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    document.documentElement.classList.toggle('dark', newTheme);
    document.documentElement.classList.toggle('light', !newTheme);
  };

  return (
    <div>
      <button onClick={toggleTheme} data-testid="theme-toggle">
        {isDark ? 'Light' : 'Dark'}
      </button>
      <div data-testid="theme-indicator" className={isDark ? 'dark-mode' : 'light-mode'}>
        Current: {isDark ? 'Dark' : 'Light'}
      </div>
    </div>
  );
}

// Mock sidebar animation component
function Sidebar() {
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const storedState = localStorage.getItem('sidebar-open');
    if (storedState === 'true') {
      setShowSidebar(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !showSidebar;
    setShowSidebar(newState);
    localStorage.setItem('sidebar-open', newState.toString());
  };

  return (
    <div>
      <button onClick={toggleSidebar} data-testid="sidebar-toggle">
        Toggle Sidebar
      </button>
      <div
        data-testid="sidebar"
        className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed transition-transform`}
      >
        Sidebar Content
      </div>
    </div>
  );
}

describe('Input and UI State Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('Auto-Growing Textarea', () => {
    it('should start with min height of 36px', () => {
      render(<AutoGrowTextarea />);
      
      const textarea = screen.getByTestId('auto-grow-textarea') as HTMLTextAreaElement;
      expect(textarea.style.minHeight).toBe('36px');
    });

    it('should expand height on typing up to 3 lines', () => {
      render(<AutoGrowTextarea />);
      
      const textarea = screen.getByTestId('auto-grow-textarea') as HTMLTextAreaElement;
      
      // Type multiple lines
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });
      
      // Height should be set (scrollHeight calculation)
      expect(textarea.style.height).toBeTruthy();
      expect(textarea.style.maxHeight).toBe('66px'); // 22px * 3
    });

    it('should hide upload/camera buttons when focused', () => {
      render(<AutoGrowTextarea />);
      
      const uploadBtn = screen.getByTestId('upload-btn');
      const cameraBtn = screen.getByTestId('camera-btn');
      const textarea = screen.getByTestId('auto-grow-textarea');
      
      // Initially visible
      expect(uploadBtn).toHaveClass('w-9', 'opacity-100');
      expect(cameraBtn).toHaveClass('w-9', 'opacity-100');
      
      // Focus textarea
      fireEvent.focus(textarea);
      
      // Should be hidden
      expect(uploadBtn).toHaveClass('w-0', 'opacity-0', 'pointer-events-none');
      expect(cameraBtn).toHaveClass('w-0', 'opacity-0', 'pointer-events-none');
    });

    it('should show upload/camera buttons when blurred', () => {
      render(<AutoGrowTextarea />);
      
      const uploadBtn = screen.getByTestId('upload-btn');
      const textarea = screen.getByTestId('auto-grow-textarea');
      
      // Focus then blur
      fireEvent.focus(textarea);
      expect(uploadBtn).toHaveClass('w-0', 'opacity-0');
      
      fireEvent.blur(textarea);
      expect(uploadBtn).toHaveClass('w-9', 'opacity-100');
    });

    it('should reset to 36px height on blur', () => {
      render(<AutoGrowTextarea />);
      
      const textarea = screen.getByTestId('auto-grow-textarea') as HTMLTextAreaElement;
      
      // Type and focus
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
      fireEvent.focus(textarea);
      
      // Blur should reset
      fireEvent.blur(textarea);
      expect(textarea.style.height).toBe('36px');
    });
  });

  describe('Theme Toggle', () => {
    it('should initialize theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('theme-indicator')).toHaveClass('dark-mode');
      expect(screen.getByTestId('theme-toggle')).toHaveTextContent('Light');
    });

    it('should toggle theme on button click', () => {
      render(<ThemeToggle />);
      
      const toggleBtn = screen.getByTestId('theme-toggle');
      const indicator = screen.getByTestId('theme-indicator');
      
      // Initial state (light)
      expect(indicator).toHaveClass('light-mode');
      
      // Toggle to dark
      fireEvent.click(toggleBtn);
      expect(indicator).toHaveClass('dark-mode');
      expect(toggleBtn).toHaveTextContent('Light');
      
      // Toggle back to light
      fireEvent.click(toggleBtn);
      expect(indicator).toHaveClass('light-mode');
      expect(toggleBtn).toHaveTextContent('Dark');
    });

    it('should persist theme to localStorage', () => {
      render(<ThemeToggle />);
      
      const toggleBtn = screen.getByTestId('theme-toggle');
      
      // Toggle to dark
      fireEvent.click(toggleBtn);
      expect(localStorage.getItem('theme')).toBe('dark');
      
      // Toggle to light
      fireEvent.click(toggleBtn);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should update document classes on toggle', () => {
      render(<ThemeToggle />);
      
      const toggleBtn = screen.getByTestId('theme-toggle');
      
      // Toggle to dark
      fireEvent.click(toggleBtn);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
      
      // Toggle to light
      fireEvent.click(toggleBtn);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });

  describe('Sidebar Animation', () => {
    it('should initialize hidden by default', () => {
      render(<Sidebar />);
      
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('-translate-x-full');
      expect(sidebar).not.toHaveClass('translate-x-0');
    });

    it('should restore open state from localStorage', () => {
      localStorage.setItem('sidebar-open', 'true');
      render(<Sidebar />);
      
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('translate-x-0');
      expect(sidebar).not.toHaveClass('-translate-x-full');
    });

    it('should toggle sidebar visibility on button click', () => {
      render(<Sidebar />);
      
      const toggleBtn = screen.getByTestId('sidebar-toggle');
      const sidebar = screen.getByTestId('sidebar');
      
      // Initially hidden
      expect(sidebar).toHaveClass('-translate-x-full');
      
      // Click to show
      fireEvent.click(toggleBtn);
      expect(sidebar).toHaveClass('translate-x-0');
      
      // Click to hide
      fireEvent.click(toggleBtn);
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should persist sidebar state to localStorage', () => {
      render(<Sidebar />);
      
      const toggleBtn = screen.getByTestId('sidebar-toggle');
      
      // Open sidebar
      fireEvent.click(toggleBtn);
      expect(localStorage.getItem('sidebar-open')).toBe('true');
      
      // Close sidebar
      fireEvent.click(toggleBtn);
      expect(localStorage.getItem('sidebar-open')).toBe('false');
    });

    it('should have transition-transform class for animation', () => {
      render(<Sidebar />);
      
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('fixed', 'transition-transform');
    });
  });
});
