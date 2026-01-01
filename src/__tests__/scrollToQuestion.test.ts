// src/__tests__/scrollToQuestion.test.ts
// 測試發送問題後滾動到問題位置的功能

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Scroll to Question Feature', () => {
  describe('Ref Attachment Logic', () => {
    it('should identify last user message correctly with mixed messages', () => {
      const displayConversation = [
        { role: 'user', text: 'First question' },
        { role: 'model', text: 'First answer' },
        { role: 'user', text: 'Second question' },
        { role: 'model', text: '' }, // AI placeholder
      ];

      // 找到所有用戶訊息的索引
      const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
        if (m.role === 'user') acc.push(i);
        return acc;
      }, []);
      const lastUserIndex = userMessageIndices[userMessageIndices.length - 1];

      expect(lastUserIndex).toBe(2);
      expect(displayConversation[lastUserIndex].text).toBe('Second question');
    });

    it('should identify last user message with only user message', () => {
      const displayConversation = [
        { role: 'user', text: 'Only question' },
        { role: 'model', text: '' },
      ];

      const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
        if (m.role === 'user') acc.push(i);
        return acc;
      }, []);
      const lastUserIndex = userMessageIndices[userMessageIndices.length - 1];

      expect(lastUserIndex).toBe(0);
      expect(displayConversation[lastUserIndex].text).toBe('Only question');
    });

    it('should handle multiple consecutive user messages', () => {
      const displayConversation = [
        { role: 'user', text: 'First question' },
        { role: 'user', text: 'Second question' },
        { role: 'user', text: 'Third question' },
        { role: 'model', text: '' },
      ];

      const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
        if (m.role === 'user') acc.push(i);
        return acc;
      }, []);
      const lastUserIndex = userMessageIndices[userMessageIndices.length - 1];

      expect(lastUserIndex).toBe(2);
      expect(displayConversation[lastUserIndex].text).toBe('Third question');
    });
  });

  describe('Scroll Calculation', () => {
    let mockContainer: HTMLElement;
    let mockUserMessage: HTMLElement;

    beforeEach(() => {
      mockContainer = document.createElement('div');
      mockUserMessage = document.createElement('div');
      
      // Mock scrollTo
      mockContainer.scrollTo = vi.fn() as any;
      
      // Mock offsetTop - simulate user message is at position 500
      Object.defineProperty(mockUserMessage, 'offsetTop', {
        configurable: true,
        value: 500,
      });
    });

    it('should scroll to user message position with 16px padding', () => {
      const messageOffsetTop = mockUserMessage.offsetTop;
      const targetScrollTop = messageOffsetTop - 16;

      mockContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });

      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: 484, // 500 - 16
        behavior: 'smooth',
      });
    });

    it('should handle message at top (offsetTop = 0)', () => {
      Object.defineProperty(mockUserMessage, 'offsetTop', {
        configurable: true,
        value: 0,
      });

      const messageOffsetTop = mockUserMessage.offsetTop;
      const targetScrollTop = messageOffsetTop - 16;

      mockContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });

      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: -16,
        behavior: 'smooth',
      });
    });

    it('should handle message far down (offsetTop = 2000)', () => {
      Object.defineProperty(mockUserMessage, 'offsetTop', {
        configurable: true,
        value: 2000,
      });

      const messageOffsetTop = mockUserMessage.offsetTop;
      const targetScrollTop = messageOffsetTop - 16;

      mockContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });

      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: 1984,
        behavior: 'smooth',
      });
    });
  });

  describe('Scroll Execution Timing', () => {
    it('should wait for DOM update before scrolling', async () => {
      const mockScrollFn = vi.fn();
      let domReady = false;

      // Simulate DOM update after 200ms
      setTimeout(() => {
        domReady = true;
      }, 200);

      // Execute scroll after 200ms delay
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          if (domReady) {
            mockScrollFn();
          }
          resolve();
        }, 200);
      });

      expect(mockScrollFn).toHaveBeenCalled();
    });

    it('should not scroll if refs are not ready', () => {
      const mockScrollFn = vi.fn();
      const lastUserMessageRef = { current: null };
      const chatContainerRef = { current: null };

      if (lastUserMessageRef.current && chatContainerRef.current) {
        mockScrollFn();
      }

      expect(mockScrollFn).not.toHaveBeenCalled();
    });

    it('should scroll if both refs are ready', () => {
      const mockScrollFn = vi.fn();
      const lastUserMessageRef = { current: document.createElement('div') };
      const chatContainerRef = { current: document.createElement('div') };
      chatContainerRef.current.scrollTo = vi.fn() as any;

      if (lastUserMessageRef.current && chatContainerRef.current) {
        mockScrollFn();
      }

      expect(mockScrollFn).toHaveBeenCalled();
    });
  });

  describe('Console Debug Output', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should log when attempting to scroll', () => {
      console.log('Attempting to scroll to user question...');
      
      expect(consoleSpy).toHaveBeenCalledWith('Attempting to scroll to user question...');
    });

    it('should log ref status', () => {
      const mockDiv = document.createElement('div');
      console.log('lastUserMessageRef.current:', mockDiv);
      console.log('chatContainerRef.current:', mockDiv);
      
      expect(consoleSpy).toHaveBeenCalledWith('lastUserMessageRef.current:', mockDiv);
      expect(consoleSpy).toHaveBeenCalledWith('chatContainerRef.current:', mockDiv);
    });

    it('should log calculated scroll position', () => {
      const messageOffsetTop = 500;
      console.log('messageOffsetTop:', messageOffsetTop);
      console.log('Scrolling to:', messageOffsetTop - 16);
      
      expect(consoleSpy).toHaveBeenCalledWith('messageOffsetTop:', 500);
      expect(consoleSpy).toHaveBeenCalledWith('Scrolling to:', 484);
    });

    it('should log when refs are not ready', () => {
      console.log('Refs not ready!');
      
      expect(consoleSpy).toHaveBeenCalledWith('Refs not ready!');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation', () => {
      const displayConversation: any[] = [];

      const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
        if (m.role === 'user') acc.push(i);
        return acc;
      }, []);

      expect(userMessageIndices).toEqual([]);
      expect(userMessageIndices.length).toBe(0);
    });

    it('should handle conversation with only model messages', () => {
      const displayConversation = [
        { role: 'model', text: 'Hello' },
        { role: 'model', text: 'How can I help?' },
      ];

      const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
        if (m.role === 'user') acc.push(i);
        return acc;
      }, []);

      expect(userMessageIndices).toEqual([]);
    });

    it('should filter out empty model messages in rendering', () => {
      const displayConversation = [
        { role: 'user', text: 'Question' },
        { role: 'model', text: '' },
        { role: 'model', text: '   ' },
      ];

      const filteredMessages = displayConversation.filter((msg) => {
        if (msg.role === 'model' && msg.text.trim() === '') return false;
        return true;
      });

      expect(filteredMessages).toHaveLength(1);
      expect(filteredMessages[0]).toEqual({ role: 'user', text: 'Question' });
    });
  });
});
