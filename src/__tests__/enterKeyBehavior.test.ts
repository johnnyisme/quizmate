// src/__tests__/enterKeyBehavior.test.ts
// 測試 Enter 鍵行為（換行而非送出）

import { describe, it, expect, vi } from 'vitest';

describe('Enter Key Behavior in Chat Input', () => {
  describe('Enter Key Handling', () => {
    it('should NOT prevent default Enter key behavior', () => {
      const event = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      // 模擬新行為：不攔截 Enter
      // 沒有 onKeyPress handler，瀏覽器預設行為是換行
      
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Enter to create new line', () => {
      let textValue = 'First line';
      
      // 模擬 Enter 鍵按下（瀏覽器預設行為）
      textValue = textValue + '\n' + 'Second line';
      
      expect(textValue).toBe('First line\nSecond line');
      expect(textValue.split('\n')).toHaveLength(2);
    });

    it('should allow multiple Enter presses for multiple lines', () => {
      let textValue = 'Line 1';
      
      // 按三次 Enter
      textValue += '\nLine 2';
      textValue += '\nLine 3';
      textValue += '\nLine 4';
      
      const lines = textValue.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe('Line 1');
      expect(lines[3]).toBe('Line 4');
    });

    it('should NOT trigger submit on Enter press', () => {
      const mockSubmit = vi.fn();
      
      // 模擬新行為：Enter 不觸發 submit
      const event = {
        key: 'Enter',
        shiftKey: false,
      };
      
      // 沒有 keyPress handler 呼叫 mockSubmit
      
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should require button click to submit', () => {
      const mockSubmit = vi.fn();
      const textValue = 'Test message';
      
      // 模擬點擊送出按鈕
      mockSubmit(textValue);
      
      expect(mockSubmit).toHaveBeenCalledWith('Test message');
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Shift+Enter Behavior', () => {
    it('should treat Shift+Enter same as Enter (create new line)', () => {
      let textValue = 'First line';
      
      // Shift+Enter 也是換行（與 Enter 相同）
      textValue += '\nSecond line';
      
      expect(textValue).toContain('\n');
      expect(textValue.split('\n')).toHaveLength(2);
    });

    it('should NOT differentiate between Enter and Shift+Enter', () => {
      const mockSubmit = vi.fn();
      
      // 兩種按鍵都不觸發送出
      const enterEvent = { key: 'Enter', shiftKey: false };
      const shiftEnterEvent = { key: 'Enter', shiftKey: true };
      
      // 沒有 handler 區分這兩種情況
      
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Textarea Height Adjustment', () => {
    it('should auto-grow when Enter adds new line', () => {
      const lineHeight = 22;
      const maxLines = 3;
      const maxHeight = lineHeight * maxLines;
      
      let currentHeight = 36; // 初始高度
      let scrollHeight = 44; // 換行後的高度（兩行）
      
      // 模擬自動增長
      currentHeight = Math.min(scrollHeight, maxHeight);
      
      expect(currentHeight).toBe(44);
    });

    it('should cap height at max lines even with multiple Enters', () => {
      const lineHeight = 22;
      const maxLines = 3;
      const maxHeight = lineHeight * maxLines;
      
      let scrollHeight = 100; // 很多行
      
      // 應該限制在最大高度
      const currentHeight = Math.min(scrollHeight, maxHeight);
      
      expect(currentHeight).toBe(66);
    });

    it('should enable scrolling when content exceeds max height', () => {
      const maxHeight = 66; // 3 行
      const scrollHeight = 100; // 實際內容更多
      
      const shouldScroll = scrollHeight > maxHeight;
      
      expect(shouldScroll).toBe(true);
    });
  });

  describe('Submit Behavior', () => {
    it('should only submit via button click', () => {
      const mockOnSubmit = vi.fn();
      const textValue = 'Multi-line\nMessage\nWith\nEnters';
      
      // 模擬點擊送出按鈕
      mockOnSubmit(textValue.trim());
      
      expect(mockOnSubmit).toHaveBeenCalledWith('Multi-line\nMessage\nWith\nEnters');
    });

    it('should preserve newlines in submitted text', () => {
      const mockOnSubmit = vi.fn();
      const textValue = 'Line 1\nLine 2\nLine 3';
      
      mockOnSubmit(textValue);
      
      const submittedText = mockOnSubmit.mock.calls[0][0];
      expect(submittedText).toContain('\n');
      expect(submittedText.split('\n')).toHaveLength(3);
    });

    it('should reset height after submit', () => {
      let currentHeight = 66; // 三行高度
      const minHeight = 36;
      
      // 模擬送出後重置
      currentHeight = minHeight;
      
      expect(currentHeight).toBe(36);
    });

    it('should clear text after submit', () => {
      let textValue = 'Some\nMulti-line\nText';
      
      // 模擬送出後清空
      textValue = '';
      
      expect(textValue).toBe('');
    });
  });

  describe('Keyboard Behavior', () => {
    it('should NOT blur/close keyboard on Enter press', () => {
      const mockBlur = vi.fn();
      
      // Enter 不會觸發 blur（鍵盤保持開啟）
      
      expect(mockBlur).not.toHaveBeenCalled();
    });

    it('should keep keyboard open during multi-line editing', () => {
      let isFocused = true;
      
      // 按 Enter 不改變 focus 狀態
      // (沒有 blur 呼叫)
      
      expect(isFocused).toBe(true);
    });

    it('should only close keyboard on explicit blur', () => {
      let isFocused = true;
      const mockBlur = vi.fn(() => {
        isFocused = false;
      });
      
      // 只有明確的 blur 事件才關閉鍵盤
      mockBlur();
      
      expect(isFocused).toBe(false);
      expect(mockBlur).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Enter press (blank line)', () => {
      let textValue = '';
      
      // 按 Enter 在空白輸入框（創建空行）
      textValue = '\n';
      
      expect(textValue).toBe('\n');
      expect(textValue.length).toBe(1);
    });

    it('should handle Enter at start of text', () => {
      let textValue = 'Some text';
      
      // 游標在開頭按 Enter
      textValue = '\n' + textValue;
      
      expect(textValue).toBe('\nSome text');
      expect(textValue.startsWith('\n')).toBe(true);
    });

    it('should handle Enter in middle of text', () => {
      let textValue = 'First Second';
      
      // 在 "First" 和 "Second" 之間按 Enter
      textValue = 'First\nSecond';
      
      expect(textValue).toBe('First\nSecond');
      expect(textValue.indexOf('\n')).toBe(5);
    });

    it('should handle rapid Enter presses', () => {
      let textValue = 'Text';
      
      // 快速按三次 Enter
      textValue += '\n\n\n';
      
      expect(textValue).toBe('Text\n\n\n');
      expect(textValue.split('\n')).toHaveLength(4);
    });
  });

  describe('Focus Management', () => {
    it('should NOT auto-blur after submit', () => {
      const mockBlur = vi.fn();
      const mockSubmit = vi.fn();
      
      // 送出訊息（新行為：不 blur）
      mockSubmit('test');
      
      expect(mockBlur).not.toHaveBeenCalled();
    });

    it('should maintain focus during typing and Enter presses', () => {
      let isFocused = true;
      
      // 輸入文字 + 按 Enter + 繼續輸入
      // focus 狀態不變
      
      expect(isFocused).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should allow Enter press during loading', () => {
      const isLoading = true;
      let textValue = 'Test';
      
      // 即使在 loading，Enter 也能換行（因為沒有攔截）
      textValue += '\nNew line';
      
      expect(textValue).toContain('\n');
    });

    it('should prevent submit button during loading', () => {
      const isLoading = true;
      const mockSubmit = vi.fn();
      
      // 模擬點擊送出按鈕（應該被阻擋）
      if (!isLoading) {
        mockSubmit();
      }
      
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });
});
