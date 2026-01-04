/**
 * useMessageActions Hook 依賴陣列測試
 * 
 * 測試目標：驗證 long-press timer 和其他事件處理的正確清理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMessageActions } from '@/hooks/useMessageActions';

describe('useMessageActions - 依賴陣列與 Timer 清理測試', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Long-Press Timer 清理', () => {
    it('handleLongPressStart 應該設置 500ms 計時器', () => {
      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode: vi.fn(),
          setSelectedMessages: vi.fn(),
          setError: vi.fn(),
        })
      );

      result.current.handleLongPressStart(0);

      // 計時器應該被設置
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('handleLongPressEnd 應該清除長按計時器', () => {
      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode: vi.fn(),
          setSelectedMessages: vi.fn(),
          setError: vi.fn(),
        })
      );

      result.current.handleLongPressStart(0);
      const timerCountBefore = vi.getTimerCount();

      result.current.handleLongPressEnd();
      const timerCountAfter = vi.getTimerCount();

      // 計時器應該被清除
      expect(timerCountAfter).toBeLessThan(timerCountBefore);
    });

    it('500ms 後應該進入選擇模式', () => {
      const setIsSelectMode = vi.fn();
      const setSelectedMessages = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode,
          setSelectedMessages,
          setError: vi.fn(),
        })
      );

      result.current.handleLongPressStart(0);

      // 還沒到 500ms
      vi.advanceTimersByTime(499);
      expect(setIsSelectMode).not.toHaveBeenCalled();

      // 500ms 後
      vi.advanceTimersByTime(1);
      expect(setIsSelectMode).toHaveBeenCalledWith(true);
    });

    it('觸發 handleLongPressEnd 應該取消長按動作', () => {
      const setIsSelectMode = vi.fn();
      const setSelectedMessages = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode,
          setSelectedMessages,
          setError: vi.fn(),
        })
      );

      result.current.handleLongPressStart(0);
      vi.advanceTimersByTime(250); // 時間未到

      result.current.handleLongPressEnd();
      vi.advanceTimersByTime(300); // 超過 500ms，但計時器已取消

      // setIsSelectMode 不應該被呼叫
      expect(setIsSelectMode).not.toHaveBeenCalled();
    });
  });

  describe('複製訊息功能', () => {
    it('handleCopyMessage 應該複製文字到剪貼簿', async () => {
      const setCopiedMessageIndex = vi.fn();
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex,
          setIsSelectMode: vi.fn(),
          setSelectedMessages: vi.fn(),
          setError: vi.fn(),
        })
      );

      await result.current.handleCopyMessage('複製的文字', 0);

      // writeText 應該被呼叫
      expect(writeTextSpy).toHaveBeenCalledWith('複製的文字');
    });

    it('複製後應該顯示 2 秒提示', async () => {
      const setCopiedMessageIndex = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex,
          setIsSelectMode: vi.fn(),
          setSelectedMessages: vi.fn(),
          setError: vi.fn(),
        })
      );

      await result.current.handleCopyMessage('文字', 0);

      // setCopiedMessageIndex 應該被呼叫
      expect(setCopiedMessageIndex).toHaveBeenCalledWith(0);

      // 2 秒後應該清除指示
      vi.advanceTimersByTime(2000);
      expect(setCopiedMessageIndex).toHaveBeenCalledWith(null);
    });
  });

  describe('訊息選擇功能', () => {
    it('toggleMessageSelect 應該切換訊息選擇狀態', () => {
      const setSelectedMessages = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: true,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode: vi.fn(),
          setSelectedMessages,
          setError: vi.fn(),
        })
      );

      result.current.toggleMessageSelect(0);

      // setSelectedMessages 應該被呼叫
      expect(setSelectedMessages).toHaveBeenCalled();
    });

    it('selectAllMessages 應該選擇所有訊息', () => {
      const setSelectedMessages = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: true,
          selectedMessages: new Set(),
          displayConversation: [
            { role: 'user', text: '問題 1' },
            { role: 'model', text: '回應 1' },
            { role: 'user', text: '問題 2' },
          ],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode: vi.fn(),
          setSelectedMessages,
          setError: vi.fn(),
        })
      );

      result.current.selectAllMessages();

      // setSelectedMessages 應該被呼叫，包含所有訊息索引
      expect(setSelectedMessages).toHaveBeenCalled();
    });

    it('clearSelection 應該清除選擇並退出選擇模式', () => {
      const setSelectedMessages = vi.fn();
      const setIsSelectMode = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: true,
          selectedMessages: new Set([0, 1]),
          displayConversation: [
            { role: 'user', text: '問題' },
            { role: 'model', text: '回應' },
          ],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode,
          setSelectedMessages,
          setError: vi.fn(),
        })
      );

      result.current.clearSelection();

      // 應該清除選擇並退出模式
      expect(setSelectedMessages).toHaveBeenCalledWith(new Set());
      expect(setIsSelectMode).toHaveBeenCalledWith(false);
    });
  });

  describe('訊息分享功能', () => {
    it('formatSelectedMessages 應該格式化選定訊息為 Markdown', () => {
      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: true,
          selectedMessages: new Set([0, 1]),
          displayConversation: [
            { role: 'user', text: '問題' },
            { role: 'model', text: '回應' },
          ],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode: vi.fn(),
          setSelectedMessages: vi.fn(),
          setError: vi.fn(),
        })
      );

      const formatted = result.current.formatSelectedMessages();

      // 應該包含標題和訊息
      expect(formatted).toContain('與 QuizMate AI 老師的討論');
      expect(formatted).toContain('👤 用戶：問題');
      expect(formatted).toContain('🤖 AI：回應');
    });

    it('enterShareMode 應該設置為分享模式', () => {
      const setIsSelectMode = vi.fn();
      const setSelectedMessages = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode,
          setSelectedMessages,
          setError: vi.fn(),
        })
      );

      result.current.enterShareMode(0);

      // 應該進入選擇模式並選擇該訊息
      expect(setIsSelectMode).toHaveBeenCalledWith(true);
      expect(setSelectedMessages).toHaveBeenCalled();
    });

    it('shareSelectedMessages 應該正確處理分享', async () => {
      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: true,
          selectedMessages: new Set([0]),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode: vi.fn(),
          setSelectedMessages: vi.fn(),
          setError: vi.fn(),
        })
      );

      await result.current.shareSelectedMessages();

      // 應該嘗試使用 Web Share API 或 clipboard
      // 由於我們 mock 了 clipboard，應該會使用 fallback
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('完整流程測試', () => {
    it('長按流程：longPressStart → 等待 500ms → 進入選擇模式', () => {
      const setIsSelectMode = vi.fn();
      const setSelectedMessages = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex: vi.fn(),
          setIsSelectMode,
          setSelectedMessages,
          setError: vi.fn(),
        })
      );

      // Step 1: 開始長按
      result.current.handleLongPressStart(0);
      expect(setIsSelectMode).not.toHaveBeenCalled();

      // Step 2: 等待 500ms
      vi.advanceTimersByTime(500);
      expect(setIsSelectMode).toHaveBeenCalledWith(true);

      // Step 3: 清除選擇
      result.current.clearSelection();
      expect(setIsSelectMode).toHaveBeenCalledWith(false);
    });

    it('複製流程：複製 → 顯示提示 → 自動清除', async () => {
      const setCopiedMessageIndex = vi.fn();

      const { result } = renderHook(() =>
        useMessageActions({
          isSelectMode: false,
          selectedMessages: new Set(),
          displayConversation: [{ role: 'user', text: '問題' }],
          setCopiedMessageIndex,
          setIsSelectMode: vi.fn(),
          setSelectedMessages: vi.fn(),
          setError: vi.fn(),
        })
      );

      // Step 1: 複製訊息
      await result.current.handleCopyMessage('複製的文字', 0);
      expect(setCopiedMessageIndex).toHaveBeenCalledWith(0);

      // Step 2: 等待 2 秒
      vi.advanceTimersByTime(2000);
      expect(setCopiedMessageIndex).toHaveBeenCalledWith(null);
    });
  });
});
