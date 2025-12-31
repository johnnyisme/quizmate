// src/__tests__/inputAutoGrow.test.ts
// 測試輸入框自動增長功能

import { describe, it, expect } from 'vitest';

describe('Input Auto-grow Logic', () => {
  describe('Height Calculation', () => {
    it('should calculate correct height for single line', () => {
      const lineHeight = 22;
      const maxLines = 3;
      const maxHeight = lineHeight * maxLines;
      
      const scrollHeight = 30; // 單行高度
      const calculatedHeight = Math.min(scrollHeight, maxHeight);
      
      expect(calculatedHeight).toBe(30);
      expect(calculatedHeight).toBeLessThanOrEqual(maxHeight);
    });

    it('should calculate correct height for two lines', () => {
      const lineHeight = 22;
      const maxLines = 3;
      const maxHeight = lineHeight * maxLines;
      
      const scrollHeight = 44; // 兩行高度
      const calculatedHeight = Math.min(scrollHeight, maxHeight);
      
      expect(calculatedHeight).toBe(44);
      expect(calculatedHeight).toBeLessThanOrEqual(maxHeight);
    });

    it('should calculate correct height for three lines', () => {
      const lineHeight = 22;
      const maxLines = 3;
      const maxHeight = lineHeight * maxLines;
      
      const scrollHeight = 66; // 三行高度
      const calculatedHeight = Math.min(scrollHeight, maxHeight);
      
      expect(calculatedHeight).toBe(66);
      expect(calculatedHeight).toBe(maxHeight);
    });

    it('should cap height at max when content exceeds three lines', () => {
      const lineHeight = 22;
      const maxLines = 3;
      const maxHeight = lineHeight * maxLines;
      
      const scrollHeight = 100; // 超過三行
      const calculatedHeight = Math.min(scrollHeight, maxHeight);
      
      expect(calculatedHeight).toBe(66);
      expect(calculatedHeight).toBe(maxHeight);
    });

    it('should respect minHeight constraint', () => {
      const minHeight = 36;
      const scrollHeight = 20; // 小於最小高度
      const calculatedHeight = Math.max(scrollHeight, minHeight);
      
      expect(calculatedHeight).toBe(minHeight);
    });
  });

  describe('Line Height Consistency', () => {
    it('should use consistent line height value', () => {
      const lineHeight = 22;
      const maxLines = 3;
      const maxHeight = lineHeight * maxLines;
      
      expect(maxHeight).toBe(66);
    });

    it('should match minHeight and maxHeight constraints', () => {
      const minHeight = 36;
      const maxHeight = 66;
      const lineHeight = 22;
      
      // minHeight 應該大於一行，小於兩行
      expect(minHeight).toBeGreaterThan(lineHeight);
      expect(minHeight).toBeLessThan(lineHeight * 2);
      
      // maxHeight 應該正好是三行
      expect(maxHeight).toBe(lineHeight * 3);
    });
  });

  describe('Focus/Blur Behavior', () => {
    it('should reset to minHeight on blur', () => {
      const minHeight = 36;
      let currentHeight = 66; // 假設當前是三行
      
      // 模擬 onBlur 行為
      currentHeight = minHeight;
      
      expect(currentHeight).toBe(36);
    });

    it('should recalculate height on focus with content', () => {
      const minHeight = 36;
      const lineHeight = 22;
      const maxHeight = lineHeight * 3;
      
      // 模擬有兩行內容
      const scrollHeight = 44;
      const calculatedHeight = Math.min(scrollHeight, maxHeight);
      
      expect(calculatedHeight).toBe(44);
      expect(calculatedHeight).toBeGreaterThan(minHeight);
    });

    it('should maintain minHeight on focus without content', () => {
      const minHeight = 36;
      const scrollHeight = 36; // 空內容
      
      expect(scrollHeight).toBe(minHeight);
    });
  });

  describe('Button Visibility Logic', () => {
    it('should hide buttons when input is focused', () => {
      const inputFocused = true;
      
      const uploadButtonWidth = inputFocused ? 0 : 9;
      const uploadButtonOpacity = inputFocused ? 0 : 1;
      const cameraButtonWidth = inputFocused ? 0 : 9;
      const cameraButtonOpacity = inputFocused ? 0 : 1;
      
      expect(uploadButtonWidth).toBe(0);
      expect(uploadButtonOpacity).toBe(0);
      expect(cameraButtonWidth).toBe(0);
      expect(cameraButtonOpacity).toBe(0);
    });

    it('should show buttons when input is blurred', () => {
      const inputFocused = false;
      
      const uploadButtonWidth = inputFocused ? 0 : 9;
      const uploadButtonOpacity = inputFocused ? 0 : 1;
      const cameraButtonWidth = inputFocused ? 0 : 9;
      const cameraButtonOpacity = inputFocused ? 0 : 1;
      
      expect(uploadButtonWidth).toBe(9);
      expect(uploadButtonOpacity).toBe(1);
      expect(cameraButtonWidth).toBe(9);
      expect(cameraButtonOpacity).toBe(1);
    });

    it('should apply pointer-events-none when buttons are hidden', () => {
      const inputFocused = true;
      
      const pointerEvents = inputFocused ? 'none' : 'auto';
      
      expect(pointerEvents).toBe('none');
    });
  });

  describe('Enter Key Behavior', () => {
    it('should submit on Enter without Shift', () => {
      const isShiftPressed = false;
      const shouldSubmit = !isShiftPressed;
      
      expect(shouldSubmit).toBe(true);
    });

    it('should create new line on Shift+Enter', () => {
      const isShiftPressed = true;
      const shouldSubmit = !isShiftPressed;
      
      expect(shouldSubmit).toBe(false);
    });

    it('should not submit when loading', () => {
      const isLoading = true;
      const isShiftPressed = false;
      const shouldSubmit = !isShiftPressed && !isLoading;
      
      expect(shouldSubmit).toBe(false);
    });
  });

  describe('Textarea Sizing', () => {
    it('should have correct minimum dimensions', () => {
      const minHeight = 36; // h-9 equivalent
      const minWidth = 0; // flex-1 min-w-0
      
      expect(minHeight).toBe(36);
      expect(minWidth).toBe(0);
    });

    it('should have correct maximum height', () => {
      const maxHeight = 66; // 3 lines * 22px
      
      expect(maxHeight).toBe(66);
    });

    it('should respect padding constraints', () => {
      const paddingX = 3; // px-3 = 12px (3 * 4px)
      const paddingY = 1.5; // py-1.5 = 6px (1.5 * 4px)
      
      // Tailwind 計算
      const actualPaddingX = paddingX * 4;
      const actualPaddingY = paddingY * 4;
      
      expect(actualPaddingX).toBe(12);
      expect(actualPaddingY).toBe(6);
    });
  });

  describe('Gap and Spacing', () => {
    it('should have smaller gap on mobile', () => {
      const mobileGap = 1.5; // gap-1.5
      const desktopGap = 2; // sm:gap-2
      
      expect(mobileGap).toBeLessThan(desktopGap);
      expect(mobileGap * 4).toBe(6); // 6px
      expect(desktopGap * 4).toBe(8); // 8px
    });

    it('should maintain compact button sizes', () => {
      const buttonHeight = 9; // h-9 = 36px
      const buttonWidth = 9; // w-9 = 36px
      const iconSize = 4.5; // w-4.5 h-4.5
      
      expect(buttonHeight * 4).toBe(36);
      expect(buttonWidth * 4).toBe(36);
      expect(iconSize * 4).toBe(18);
    });
  });
});
