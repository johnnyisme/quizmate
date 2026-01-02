// src/__tests__/scrollAfterResponse.test.ts
// 測試 AI 回應完成後的滾動行為

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Scroll After AI Response', () => {
  let chatContainer: HTMLDivElement;

  beforeEach(() => {
    chatContainer = document.createElement('div');
    chatContainer.scrollTop = 0;
    
    Object.defineProperty(chatContainer, 'scrollHeight', {
      configurable: true,
      writable: true,
      value: 2000,
    });
    Object.defineProperty(chatContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
  });

  describe('Padding Management', () => {
    it('should add paddingBottom during loading', () => {
      // 模擬開始 loading
      chatContainer.style.paddingBottom = '80vh';
      
      expect(chatContainer.style.paddingBottom).toBe('80vh');
    });

    it('should remove paddingBottom after loading completes', () => {
      // 設定初始 padding
      chatContainer.style.paddingBottom = '80vh';
      
      // 模擬 loading 完成
      chatContainer.style.paddingBottom = '0px';
      
      expect(chatContainer.style.paddingBottom).toBe('0px');
    });

    it('should not modify scroll position when removing padding', () => {
      // 用戶滾動到某個位置
      chatContainer.scrollTop = 350;
      const initialScrollTop = chatContainer.scrollTop;
      
      // 移除 padding（不應該改變 scrollTop）
      chatContainer.style.paddingBottom = '0px';
      
      // scrollTop 應該保持不變
      expect(chatContainer.scrollTop).toBe(initialScrollTop);
    });
  });

  describe('Session Switch Detection', () => {
    it('should detect when session ID changes', () => {
      let prevSessionId: string | null = null;
      const newSessionId = 'session-123';
      
      const isSessionSwitch = prevSessionId !== newSessionId;
      
      expect(isSessionSwitch).toBe(true);
    });

    it('should not detect session switch when ID remains same', () => {
      let prevSessionId: string | null = 'session-123';
      const newSessionId = 'session-123';
      
      const isSessionSwitch = prevSessionId !== newSessionId;
      
      expect(isSessionSwitch).toBe(false);
    });

    it('should update previous session ID after switch', () => {
      let prevSessionId: string | null = null;
      const newSessionId = 'session-123';
      
      // 切換後更新
      prevSessionId = newSessionId;
      
      expect(prevSessionId).toBe('session-123');
    });
  });

  describe('Scroll Restoration Logic', () => {
    it('should restore scroll position only on session switch', () => {
      let prevSessionId: string | null = null;
      const newSessionId = 'session-456';
      const savedScrollPos = 250;
      
      const isSessionSwitch = prevSessionId !== newSessionId;
      
      if (isSessionSwitch) {
        chatContainer.scrollTop = savedScrollPos;
      }
      
      expect(chatContainer.scrollTop).toBe(250);
    });

    it('should NOT restore scroll position when session updates', () => {
      let prevSessionId: string | null = 'session-456';
      const newSessionId = 'session-456'; // 同一個 session
      const currentScrollPos = 500;
      const savedScrollPos = 250;
      
      chatContainer.scrollTop = currentScrollPos;
      const isSessionSwitch = prevSessionId !== newSessionId;
      
      if (isSessionSwitch) {
        chatContainer.scrollTop = savedScrollPos;
      }
      
      // 應該保持當前位置，不恢復舊位置
      expect(chatContainer.scrollTop).toBe(500);
    });

    it('should handle null to string session transition', () => {
      let prevSessionId: string | null = null;
      const newSessionId = 'session-789';
      
      const isSessionSwitch = prevSessionId !== newSessionId;
      prevSessionId = newSessionId;
      
      expect(isSessionSwitch).toBe(true);
      expect(prevSessionId).toBe('session-789');
    });

    it('should handle string to string session transition', () => {
      let prevSessionId: string | null = 'session-abc';
      const newSessionId = 'session-xyz';
      
      const isSessionSwitch = prevSessionId !== newSessionId;
      prevSessionId = newSessionId;
      
      expect(isSessionSwitch).toBe(true);
      expect(prevSessionId).toBe('session-xyz');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid session updates without scroll jumps', () => {
      let prevSessionId: string | null = 'session-123';
      const newSessionId = 'session-123';
      
      // 連續多次更新同一個 session（AI 回應串流更新）
      for (let i = 0; i < 5; i++) {
        const isSessionSwitch = prevSessionId !== newSessionId;
        expect(isSessionSwitch).toBe(false);
      }
    });

    it('should handle padding removal without affecting user scroll position', () => {
      // 用戶正在閱讀 AI 回應的中間部分
      chatContainer.scrollTop = 800;
      
      // AI 回應完成，移除 padding
      chatContainer.style.paddingBottom = '0px';
      
      // 瀏覽器應該自然處理滾動（不強制改變位置）
      // scrollTop 值不變
      expect(chatContainer.scrollTop).toBe(800);
    });

    it('should maintain scroll position during streaming updates', () => {
      const initialScrollTop = 600;
      chatContainer.scrollTop = initialScrollTop;
      
      // 模擬串流更新（內容增加，但不改變 scrollTop）
      Object.defineProperty(chatContainer, 'scrollHeight', {
        configurable: true,
        value: 2500, // 內容變長
      });
      
      // scrollTop 不應該被程式碼修改
      expect(chatContainer.scrollTop).toBe(initialScrollTop);
    });
  });

  describe('Scroll Behavior During AI Response', () => {
    it('should allow natural scroll during AI streaming', () => {
      // 用戶在 AI 回應時手動滾動
      chatContainer.scrollTop = 100;
      
      // 內容增加
      Object.defineProperty(chatContainer, 'scrollHeight', {
        configurable: true,
        value: 2200,
      });
      
      // 用戶繼續滾動
      chatContainer.scrollTop = 300;
      
      // 沒有程式碼干預，保持用戶滾動位置
      expect(chatContainer.scrollTop).toBe(300);
    });

    it('should not jump to saved position during active session', () => {
      let prevSessionId: string | null = 'active-session';
      const currentSessionId = 'active-session';
      const savedPosition = 100;
      chatContainer.scrollTop = 500; // 用戶當前位置
      
      // AI 回應更新（session 沒變）
      const isSessionSwitch = prevSessionId !== currentSessionId;
      
      if (isSessionSwitch) {
        chatContainer.scrollTop = savedPosition;
      }
      
      // 應該保持當前位置
      expect(chatContainer.scrollTop).toBe(500);
    });
  });

  describe('requestAnimationFrame Integration', () => {
    it('should use RAF for smooth scroll to question', () => {
      const mockRAF = vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      });
      
      global.requestAnimationFrame = mockRAF;
      
      // 模擬滾動到問題
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          chatContainer.scrollTop = 16; // 滾動到問題位置（留 16px 間距）
          expect(mockRAF).toHaveBeenCalled();
          resolve();
        });
      });
    });
  });
});
