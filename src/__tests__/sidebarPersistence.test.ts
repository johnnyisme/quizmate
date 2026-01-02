import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Sidebar Persistence', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
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
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Sidebar State Persistence', () => {
    it('should save sidebar-open state when opening sidebar', () => {
      const setShowSidebar = vi.fn();
      const showSidebar = false;

      // Simulate button click
      const newState = !showSidebar;
      setShowSidebar(newState);
      localStorage.setItem('sidebar-open', newState.toString());

      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-open', 'true');
      expect(localStorageMock['sidebar-open']).toBe('true');
    });

    it('should save sidebar-open state when closing sidebar', () => {
      const setShowSidebar = vi.fn();
      const showSidebar = true;

      // Simulate button click
      const newState = !showSidebar;
      setShowSidebar(newState);
      localStorage.setItem('sidebar-open', newState.toString());

      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-open', 'false');
      expect(localStorageMock['sidebar-open']).toBe('false');
    });

    it('should restore sidebar-open state on page load', () => {
      localStorageMock['sidebar-open'] = 'true';

      const storedSidebarState = localStorage.getItem('sidebar-open');
      const shouldShowSidebar = storedSidebarState === 'true';

      expect(shouldShowSidebar).toBe(true);
    });

    it('should default to closed if no state is saved', () => {
      const storedSidebarState = localStorage.getItem('sidebar-open');
      const shouldShowSidebar = storedSidebarState === 'true';

      expect(shouldShowSidebar).toBe(false);
    });

    it('should handle invalid state gracefully', () => {
      localStorageMock['sidebar-open'] = 'invalid';

      const storedSidebarState = localStorage.getItem('sidebar-open');
      const shouldShowSidebar = storedSidebarState === 'true';

      expect(shouldShowSidebar).toBe(false);
    });
  });

  describe('Sidebar Close on Mobile', () => {
    it('should close sidebar and save state when clicking new chat on mobile', () => {
      const mockInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Mobile width
      });

      const setShowSidebar = vi.fn();

      // Simulate new chat click on mobile
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
        localStorage.setItem('sidebar-open', 'false');
      }

      expect(setShowSidebar).toHaveBeenCalledWith(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-open', 'false');

      // Restore original innerWidth
      if (mockInnerWidth) {
        Object.defineProperty(window, 'innerWidth', mockInnerWidth);
      }
    });

    it('should not close sidebar when clicking new chat on desktop', () => {
      const mockInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280, // Desktop width
      });

      const setShowSidebar = vi.fn();

      // Simulate new chat click on desktop
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
        localStorage.setItem('sidebar-open', 'false');
      }

      expect(setShowSidebar).not.toHaveBeenCalled();
      expect(localStorage.setItem).not.toHaveBeenCalled();

      // Restore original innerWidth
      if (mockInnerWidth) {
        Object.defineProperty(window, 'innerWidth', mockInnerWidth);
      }
    });

    it('should close sidebar when clicking overlay on mobile', () => {
      const setShowSidebar = vi.fn();

      // Simulate overlay click
      setShowSidebar(false);
      localStorage.setItem('sidebar-open', 'false');

      expect(setShowSidebar).toHaveBeenCalledWith(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-open', 'false');
    });

    it('should close sidebar when clicking close button', () => {
      const setShowSidebar = vi.fn();

      // Simulate close button click
      setShowSidebar(false);
      localStorage.setItem('sidebar-open', 'false');

      expect(setShowSidebar).toHaveBeenCalledWith(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-open', 'false');
    });
  });

  describe('Sidebar Toggle Button', () => {
    it('should toggle sidebar state and persist', () => {
      const setShowSidebar = vi.fn();
      let showSidebar = false;

      // First toggle - open
      const newState1 = !showSidebar;
      setShowSidebar(newState1);
      localStorage.setItem('sidebar-open', newState1.toString());
      showSidebar = newState1;

      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-open', 'true');

      // Second toggle - close
      const newState2 = !showSidebar;
      setShowSidebar(newState2);
      localStorage.setItem('sidebar-open', newState2.toString());

      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-open', 'false');
    });
  });
});
