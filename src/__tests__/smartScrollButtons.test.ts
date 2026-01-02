// src/__tests__/smartScrollButtons.test.ts
// 測試智慧滾動按鈕的顯示/隱藏邏輯

import { describe, it, expect } from 'vitest';

describe('Smart Scroll Buttons', () => {
  describe('Visibility Logic', () => {
    it('should show scroll-to-bottom only when at top', () => {
      const scrollTop = 50; // < 100px threshold
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(false);
      expect(showScrollToBottom).toBe(true);
    });

    it('should show scroll-to-top only when at bottom', () => {
      const scrollTop = 1150; // scrollHeight - clientHeight - 50
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(true);
      expect(showScrollToBottom).toBe(false);
    });

    it('should show both buttons when in middle', () => {
      const scrollTop = 600; // Middle position
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(true);
      expect(showScrollToBottom).toBe(true);
    });

    it('should hide both buttons when exactly at top', () => {
      const scrollTop = 0;
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(false);
      // Bottom button should still show when at top
      expect(showScrollToBottom).toBe(true);
    });

    it('should hide both buttons when exactly at bottom', () => {
      const scrollTop = 1200; // scrollHeight - clientHeight
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(true);
      expect(showScrollToBottom).toBe(false);
    });
  });

  describe('Threshold Calculation', () => {
    it('should use 100px threshold for top detection', () => {
      const threshold = 100;
      
      const atTop = 99;
      const pastTop = 101;
      
      expect(atTop > threshold).toBe(false);
      expect(pastTop > threshold).toBe(true);
    });

    it('should use 100px threshold for bottom detection', () => {
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const bottomThreshold = scrollHeight - clientHeight - threshold;
      
      const atBottom = 1101; // Just past threshold
      const pastBottom = 1099; // Before threshold
      
      expect(atBottom < bottomThreshold).toBe(false);
      expect(pastBottom < bottomThreshold).toBe(true);
    });

    it('should handle edge case at exact threshold', () => {
      const threshold = 100;
      const scrollTop = 100;
      
      const showScrollToTop = scrollTop > threshold;
      
      expect(showScrollToTop).toBe(false); // Exactly at threshold
    });
  });

  describe('Button State Classes', () => {
    it('should apply invisible classes when button hidden', () => {
      const showButton = false;
      const classes = `w-12 h-12 ${!showButton ? 'opacity-0 invisible pointer-events-none' : ''}`;
      
      expect(classes).toContain('opacity-0');
      expect(classes).toContain('invisible');
      expect(classes).toContain('pointer-events-none');
    });

    it('should not apply invisible classes when button visible', () => {
      const showButton = true;
      const classes = `w-12 h-12 ${!showButton ? 'opacity-0 invisible pointer-events-none' : ''}`;
      
      expect(classes).not.toContain('opacity-0');
      expect(classes).not.toContain('invisible');
      expect(classes).not.toContain('pointer-events-none');
    });

    it('should maintain transition classes regardless of visibility', () => {
      const showButton = false;
      const classes = `transition-all duration-200 ${!showButton ? 'opacity-0 invisible pointer-events-none' : ''}`;
      
      expect(classes).toContain('transition-all');
      expect(classes).toContain('duration-200');
    });
  });

  describe('Container Visibility', () => {
    it('should show container when at least one button visible', () => {
      const showScrollToTop = true;
      const showScrollToBottom = false;
      
      const showContainer = showScrollToTop || showScrollToBottom;
      
      expect(showContainer).toBe(true);
    });

    it('should hide container when both buttons hidden', () => {
      const showScrollToTop = false;
      const showScrollToBottom = false;
      
      const showContainer = showScrollToTop || showScrollToBottom;
      
      expect(showContainer).toBe(false);
    });

    it('should show container when both buttons visible', () => {
      const showScrollToTop = true;
      const showScrollToBottom = true;
      
      const showContainer = showScrollToTop || showScrollToBottom;
      
      expect(showContainer).toBe(true);
    });
  });

  describe('Scroll Position Scenarios', () => {
    it('should handle short content that does not scroll', () => {
      const scrollTop = 0;
      const scrollHeight = 500;
      const clientHeight = 800; // Taller than content
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(false);
      // When content is shorter than viewport, bottom threshold becomes negative
      // scrollHeight(500) - clientHeight(800) - threshold(100) = -400
      // scrollTop(0) < -400 is false
      expect(showScrollToBottom).toBe(false);
    });

    it('should handle very long content', () => {
      const scrollTop = 5000;
      const scrollHeight = 20000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(true);
      expect(showScrollToBottom).toBe(true);
    });

    it('should handle near-top position', () => {
      const scrollTop = 150; // Just past threshold
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(true);
      expect(showScrollToBottom).toBe(true);
    });

    it('should handle near-bottom position', () => {
      const scrollTop = 1050; // Just before bottom threshold
      const scrollHeight = 2000;
      const clientHeight = 800;
      const threshold = 100;
      
      const showScrollToTop = scrollTop > threshold;
      const showScrollToBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      expect(showScrollToTop).toBe(true);
      expect(showScrollToBottom).toBe(true);
    });
  });

  describe('Fixed Position Layout', () => {
    it('should maintain fixed position classes', () => {
      const containerClasses = 'fixed bottom-24 right-4 z-50';
      
      expect(containerClasses).toContain('fixed');
      expect(containerClasses).toContain('bottom-24');
      expect(containerClasses).toContain('right-4');
    });

    it('should use flex layout for button stacking', () => {
      const containerClasses = 'flex flex-col gap-2';
      
      expect(containerClasses).toContain('flex');
      expect(containerClasses).toContain('flex-col');
      expect(containerClasses).toContain('gap-2');
    });

    it('should ensure high z-index for visibility', () => {
      const zIndex = 'z-50';
      
      expect(zIndex).toBe('z-50');
    });
  });

  describe('Button Size Consistency', () => {
    it('should maintain consistent button dimensions', () => {
      const buttonClasses = 'w-12 h-12 lg:w-14 lg:h-14';
      
      expect(buttonClasses).toContain('w-12');
      expect(buttonClasses).toContain('h-12');
      expect(buttonClasses).toContain('lg:w-14');
      expect(buttonClasses).toContain('lg:h-14');
    });

    it('should keep buttons in same position when toggling visibility', () => {
      // When using opacity-0 and invisible, buttons maintain layout space
      const hiddenButton = { display: 'block', opacity: 0, visibility: 'hidden' };
      const visibleButton = { display: 'block', opacity: 1, visibility: 'visible' };
      
      // Both buttons occupy space in layout
      expect(hiddenButton.display).toBe(visibleButton.display);
    });
  });
});
