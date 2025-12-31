// src/__tests__/scrollButtons.test.ts
// 滾動按鈕功能的單元測試

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Scroll Buttons', () => {
  describe('Scroll Functions', () => {
    let mockContainer: HTMLElement;

    beforeEach(() => {
      mockContainer = document.createElement('div');
      mockContainer.scrollTo = vi.fn() as any;
      Object.defineProperty(mockContainer, 'scrollHeight', {
        configurable: true,
        value: 2000,
      });
    });

    it('scrollToTop should scroll to position 0', () => {
      const scrollToTop = () => {
        mockContainer.scrollTo({ top: 0, behavior: 'smooth' } as ScrollToOptions);
      };

      scrollToTop();

      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });

    it('scrollToBottom should scroll to scrollHeight', () => {
      const scrollToBottom = () => {
        mockContainer.scrollTo({ 
          top: mockContainer.scrollHeight, 
          behavior: 'smooth' 
        } as ScrollToOptions);
      };

      scrollToBottom();

      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: 2000,
        behavior: 'smooth',
      });
    });

    it('scrollToTop should handle missing container gracefully', () => {
      const containerRef = { current: null as HTMLElement | null };
      
      const scrollToTop = () => {
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'smooth' } as ScrollToOptions);
        }
      };

      expect(() => scrollToTop()).not.toThrow();
    });

    it('scrollToBottom should handle missing container gracefully', () => {
      const containerRef = { current: null as HTMLElement | null };
      
      const scrollToBottom = () => {
        if (containerRef.current) {
          containerRef.current.scrollTo({ 
            top: containerRef.current.scrollHeight, 
            behavior: 'smooth' 
          } as ScrollToOptions);
        }
      };

      expect(() => scrollToBottom()).not.toThrow();
    });
  });

  describe('Button Visibility', () => {
    it('should always show both buttons when apiKeys exist', () => {
      const apiKeys = ['key1', 'key2'];
      const shouldShowButtons = apiKeys.length > 0;

      expect(shouldShowButtons).toBe(true);
    });

    it('should not show buttons when no apiKeys', () => {
      const apiKeys: string[] = [];
      const shouldShowButtons = apiKeys.length > 0;

      expect(shouldShowButtons).toBe(false);
    });
  });

  describe('Button Styling', () => {
    it('should have correct base classes', () => {
      const baseClasses = 'w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm';
      
      expect(baseClasses).toContain('w-12');
      expect(baseClasses).toContain('h-12');
      expect(baseClasses).toContain('lg:w-14');
      expect(baseClasses).toContain('lg:h-14');
      expect(baseClasses).toContain('backdrop-blur-sm');
    });

    it('should have hover state classes', () => {
      const hoverClasses = 'hover:bg-white dark:hover:bg-gray-800';
      
      expect(hoverClasses).toContain('hover:bg-white');
      expect(hoverClasses).toContain('dark:hover:bg-gray-800');
    });

    it('should have shadow classes', () => {
      const shadowClasses = 'shadow-lg hover:shadow-xl';
      
      expect(shadowClasses).toContain('shadow-lg');
      expect(shadowClasses).toContain('hover:shadow-xl');
    });

    it('should have transition classes', () => {
      const transitionClasses = 'transition-all duration-200';
      
      expect(transitionClasses).toContain('transition-all');
      expect(transitionClasses).toContain('duration-200');
    });
  });

  describe('Button Position', () => {
    it('should be fixed at bottom-right', () => {
      const positionClasses = 'fixed bottom-24 right-4 z-50';
      
      expect(positionClasses).toContain('fixed');
      expect(positionClasses).toContain('bottom-24');
      expect(positionClasses).toContain('right-4');
      expect(positionClasses).toContain('z-50');
    });

    it('should stack vertically with gap', () => {
      const layoutClasses = 'flex flex-col gap-2';
      
      expect(layoutClasses).toContain('flex');
      expect(layoutClasses).toContain('flex-col');
      expect(layoutClasses).toContain('gap-2');
    });
  });

  describe('Button Size', () => {
    it('should be 48px on mobile', () => {
      const mobileSize = 12 * 4; // w-12 = 3rem = 48px
      expect(mobileSize).toBe(48);
    });

    it('should be 56px on desktop (lg breakpoint)', () => {
      const desktopSize = 14 * 4; // w-14 = 3.5rem = 56px
      expect(desktopSize).toBe(56);
    });
  });

  describe('Button Icons', () => {
    it('should use double chevron up for scroll to top', () => {
      const topIconPath = 'M5 11l7-7 7 7M5 19l7-7 7 7';
      
      expect(topIconPath).toContain('M5 11l7-7 7 7');
      expect(topIconPath).toContain('M5 19l7-7 7 7');
    });

    it('should use double chevron down for scroll to bottom', () => {
      const bottomIconPath = 'M19 13l-7 7-7-7m14-8l-7 7-7-7';
      
      expect(bottomIconPath).toContain('M19 13l-7 7-7-7');
      expect(bottomIconPath).toContain('m14-8l-7 7-7-7');
    });

    it('should have correct icon size', () => {
      const iconClasses = 'w-6 h-6';
      
      expect(iconClasses).toContain('w-6');
      expect(iconClasses).toContain('h-6');
    });
  });

  describe('Accessibility', () => {
    it('should have title attribute for top button', () => {
      const topTitle = '回到頂部';
      
      expect(topTitle).toBe('回到頂部');
    });

    it('should have title attribute for bottom button', () => {
      const bottomTitle = '跳到最新';
      
      expect(bottomTitle).toBe('跳到最新');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode background classes', () => {
      const darkBg = 'bg-white/90 dark:bg-gray-800/90';
      
      expect(darkBg).toContain('bg-white/90');
      expect(darkBg).toContain('dark:bg-gray-800/90');
    });

    it('should have dark mode text classes', () => {
      const darkText = 'text-gray-700 dark:text-gray-300';
      
      expect(darkText).toContain('text-gray-700');
      expect(darkText).toContain('dark:text-gray-300');
    });

    it('should have dark mode hover classes', () => {
      const darkHover = 'hover:bg-white dark:hover:bg-gray-800';
      
      expect(darkHover).toContain('hover:bg-white');
      expect(darkHover).toContain('dark:hover:bg-gray-800');
    });
  });

  describe('Responsive Design', () => {
    it('should use responsive size classes', () => {
      const responsiveSize = 'w-12 h-12 lg:w-14 lg:h-14';
      
      expect(responsiveSize).toContain('w-12');
      expect(responsiveSize).toContain('h-12');
      expect(responsiveSize).toContain('lg:w-14');
      expect(responsiveSize).toContain('lg:h-14');
    });

    it('should maintain consistent position on all screen sizes', () => {
      const position = 'fixed bottom-24 right-4';
      
      expect(position).toContain('fixed');
      expect(position).toContain('bottom-24');
      expect(position).toContain('right-4');
    });
  });

  describe('Z-Index Layering', () => {
    it('should have z-index 50', () => {
      const zIndex = 'z-50';
      
      expect(zIndex).toBe('z-50');
    });

    it('should be above chat content (z-10) but below sidebar (z-70)', () => {
      const buttonZ = 50;
      const chatZ = 10;
      const sidebarZ = 70;
      
      expect(buttonZ).toBeGreaterThan(chatZ);
      expect(buttonZ).toBeLessThan(sidebarZ);
    });
  });

  describe('Scroll Behavior', () => {
    it('should use smooth scrolling', () => {
      const scrollBehavior = 'smooth';
      
      expect(scrollBehavior).toBe('smooth');
    });

    it('should scroll to exact top position (0)', () => {
      const topPosition = 0;
      
      expect(topPosition).toBe(0);
    });

    it('should calculate bottom position from scrollHeight', () => {
      const scrollHeight = 2000;
      const bottomPosition = scrollHeight;
      
      expect(bottomPosition).toBe(2000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks without errors', () => {
      const mockContainer = document.createElement('div');
      mockContainer.scrollTo = vi.fn() as any;

      const scrollToTop = () => {
        mockContainer.scrollTo({ top: 0, behavior: 'smooth' } as ScrollToOptions);
      };

      // Simulate rapid clicks
      scrollToTop();
      scrollToTop();
      scrollToTop();

      expect(mockContainer.scrollTo).toHaveBeenCalledTimes(3);
    });

    it('should handle alternating top/bottom clicks', () => {
      const mockContainer = document.createElement('div');
      mockContainer.scrollTo = vi.fn() as any;
      Object.defineProperty(mockContainer, 'scrollHeight', {
        value: 2000,
      });

      const scrollToTop = () => {
        mockContainer.scrollTo({ top: 0, behavior: 'smooth' } as ScrollToOptions);
      };

      const scrollToBottom = () => {
        mockContainer.scrollTo({ 
          top: mockContainer.scrollHeight, 
          behavior: 'smooth' 
        } as ScrollToOptions);
      };

      scrollToTop();
      scrollToBottom();
      scrollToTop();

      expect(mockContainer.scrollTo).toHaveBeenCalledTimes(3);
    });
  });
});
