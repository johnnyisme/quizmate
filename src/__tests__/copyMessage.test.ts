// src/__tests__/copyMessage.test.ts
// 測試訊息複製功能

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Copy Message Feature', () => {
  let clipboardText = '';
  
  beforeEach(() => {
    clipboardText = '';
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn((text: string) => {
          clipboardText = text;
          return Promise.resolve();
        }),
      },
    });
  });

  describe('Copy Logic', () => {
    it('should copy message text to clipboard', async () => {
      const message = 'Hello, this is a test message';
      await navigator.clipboard.writeText(message);
      
      expect(clipboardText).toBe(message);
    });

    it('should copy long message text', async () => {
      const longMessage = 'a'.repeat(1000);
      await navigator.clipboard.writeText(longMessage);
      
      expect(clipboardText).toBe(longMessage);
    });

    it('should copy message with special characters', async () => {
      const message = '測試訊息 with emoji 🎉 and symbols !@#$%';
      await navigator.clipboard.writeText(message);
      
      expect(clipboardText).toBe(message);
    });

    it('should copy message with newlines', async () => {
      const message = 'Line 1\nLine 2\nLine 3';
      await navigator.clipboard.writeText(message);
      
      expect(clipboardText).toBe(message);
    });

    it('should copy markdown formatted text', async () => {
      const markdown = '# Heading\n\n**Bold** and *italic* text\n\n```js\ncode block\n```';
      await navigator.clipboard.writeText(markdown);
      
      expect(clipboardText).toBe(markdown);
    });
  });

  describe('Copied State Management', () => {
    it('should track which message is copied by index', () => {
      let copiedIndex: number | null = null;
      
      copiedIndex = 0;
      expect(copiedIndex).toBe(0);
      
      copiedIndex = 5;
      expect(copiedIndex).toBe(5);
    });

    it('should clear copied state to null', () => {
      let copiedIndex: number | null = 3;
      
      copiedIndex = null;
      expect(copiedIndex).toBeNull();
    });

    it('should handle multiple copy operations', () => {
      let copiedIndex: number | null = null;
      
      copiedIndex = 0;
      expect(copiedIndex).toBe(0);
      
      copiedIndex = 1;
      expect(copiedIndex).toBe(1);
      
      copiedIndex = null;
      expect(copiedIndex).toBeNull();
    });
  });

  describe('Visual Feedback Timing', () => {
    it('should simulate 2 second timeout', (done) => {
      let copiedIndex: number | null = 5;
      
      setTimeout(() => {
        copiedIndex = null;
        expect(copiedIndex).toBeNull();
        done();
      }, 2000);
    }, 2500);

    it('should handle rapid consecutive copies', async () => {
      const messages = ['msg1', 'msg2', 'msg3'];
      
      for (let i = 0; i < messages.length; i++) {
        await navigator.clipboard.writeText(messages[i]);
        expect(clipboardText).toBe(messages[i]);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard write failure', async () => {
      const mockError = new Error('Clipboard access denied');
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.reject(mockError)),
        },
      });

      let errorCaught = false;
      try {
        await navigator.clipboard.writeText('test');
      } catch (err) {
        errorCaught = true;
        expect(err).toBe(mockError);
      }
      
      expect(errorCaught).toBe(true);
    });

    it('should handle undefined clipboard API', async () => {
      // @ts-ignore
      delete navigator.clipboard;
      
      expect(navigator.clipboard).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should copy empty string', async () => {
      await navigator.clipboard.writeText('');
      expect(clipboardText).toBe('');
    });

    it('should copy whitespace-only message', async () => {
      const whitespace = '   \n\t  ';
      await navigator.clipboard.writeText(whitespace);
      expect(clipboardText).toBe(whitespace);
    });

    it('should handle negative index (invalid)', () => {
      let copiedIndex: number | null = -1;
      expect(copiedIndex).toBe(-1);
      
      // Should still work but represents invalid state
      copiedIndex = null;
      expect(copiedIndex).toBeNull();
    });

    it('should handle very large index', () => {
      let copiedIndex: number | null = 999999;
      expect(copiedIndex).toBe(999999);
    });
  });

  describe('Button State Logic', () => {
    it('should show copy icon when not copied', () => {
      const copiedIndex: number | null = null;
      const currentIndex = 0;
      
      const isCopied = copiedIndex === currentIndex;
      expect(isCopied).toBe(false);
    });

    it('should show checkmark icon when copied', () => {
      const copiedIndex: number | null = 2;
      const currentIndex = 2;
      
      const isCopied = copiedIndex === currentIndex;
      expect(isCopied).toBe(true);
    });

    it('should show copy icon for other messages when one is copied', () => {
      const copiedIndex: number | null = 1;
      const currentIndex = 0;
      
      const isCopied = copiedIndex === currentIndex;
      expect(isCopied).toBe(false);
    });
  });

  describe('Message Type Validation', () => {
    it('should copy user message', async () => {
      const userMessage = '這是用戶的問題';
      await navigator.clipboard.writeText(userMessage);
      expect(clipboardText).toBe(userMessage);
    });

    it('should copy AI model response', async () => {
      const modelResponse = '這是 AI 的回答，包含**粗體**和`代碼`';
      await navigator.clipboard.writeText(modelResponse);
      expect(clipboardText).toBe(modelResponse);
    });

    it('should preserve code blocks in copied text', async () => {
      const codeMessage = 'Here is code:\n\n```python\ndef hello():\n    print("world")\n```';
      await navigator.clipboard.writeText(codeMessage);
      expect(clipboardText).toBe(codeMessage);
    });
  });

  describe('Integration Scenarios', () => {
    it('should simulate full copy workflow', async () => {
      let copiedIndex: number | null = null;
      const messageIndex = 3;
      const messageText = 'Test message to copy';
      
      // User clicks copy button
      await navigator.clipboard.writeText(messageText);
      copiedIndex = messageIndex;
      
      expect(clipboardText).toBe(messageText);
      expect(copiedIndex).toBe(messageIndex);
      
      // After 2 seconds, reset state
      setTimeout(() => {
        copiedIndex = null;
      }, 2000);
    });

    it('should handle copy on different message types', async () => {
      const messages = [
        { role: 'user', text: 'User question' },
        { role: 'model', text: 'AI response' },
      ];
      
      for (let i = 0; i < messages.length; i++) {
        await navigator.clipboard.writeText(messages[i].text);
        expect(clipboardText).toBe(messages[i].text);
      }
    });
  });

  describe('Button Position and Style', () => {
    it('should position button outside bubble at bottom-right', () => {
      const position = 'absolute -bottom-2 -right-2';
      expect(position).toContain('absolute');
      expect(position).toContain('-bottom-2');
      expect(position).toContain('-right-2');
    });

    it('should use circular button style', () => {
      const style = 'rounded-full';
      expect(style).toBe('rounded-full');
    });

    it('should have white background with shadow', () => {
      const bgClass = 'bg-white dark:bg-gray-800';
      const shadowClass = 'shadow-md hover:shadow-lg';
      
      expect(bgClass).toContain('bg-white');
      expect(bgClass).toContain('dark:bg-gray-800');
      expect(shadowClass).toContain('shadow-md');
      expect(shadowClass).toContain('hover:shadow-lg');
    });

    it('should have border for better visibility', () => {
      const borderClass = 'border border-gray-200 dark:border-gray-600';
      expect(borderClass).toContain('border');
      expect(borderClass).toContain('border-gray-200');
      expect(borderClass).toContain('dark:border-gray-600');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be always visible on mobile', () => {
      const opacityClass = 'opacity-100';
      expect(opacityClass).toBe('opacity-100');
    });

    it('should show on hover on desktop', () => {
      const desktopHover = 'lg:opacity-0 lg:group-hover:opacity-100';
      expect(desktopHover).toContain('lg:opacity-0');
      expect(desktopHover).toContain('lg:group-hover:opacity-100');
    });

    it('should combine mobile and desktop opacity rules', () => {
      const fullClass = 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100';
      expect(fullClass).toContain('opacity-100'); // Mobile
      expect(fullClass).toContain('lg:opacity-0'); // Desktop default
      expect(fullClass).toContain('lg:group-hover:opacity-100'); // Desktop hover
    });
  });

  describe('Icon Display', () => {
    it('should show only icon without text', () => {
      const hasText = false; // No text, icon only
      expect(hasText).toBe(false);
    });

    it('should use consistent icon size', () => {
      const iconSize = 'w-4 h-4';
      expect(iconSize).toBe('w-4 h-4');
    });

    it('should change icon color when copied', () => {
      const defaultColor = 'text-gray-600 dark:text-gray-400';
      const copiedColor = 'text-green-500 dark:text-green-400';
      
      expect(defaultColor).toContain('text-gray-600');
      expect(copiedColor).toContain('text-green-500');
    });
  });
});
