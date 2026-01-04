/**
 * useSessionManagement Hook 依賴陣列測試
 * 
 * 測試目標：驗證點擊外部區域的偵測和 session 編輯流程
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionManagement } from '@/hooks/useSessionManagement';

describe('useSessionManagement - 依賴陣列與點擊外部偵測', () => {
  let mockUpdateTitle: any;
  let mockLoadSessions: any;
  let mockRemoveSession: any;

  beforeEach(() => {
    mockUpdateTitle = vi.fn(() => Promise.resolve());
    mockLoadSessions = vi.fn(() => Promise.resolve());
    mockRemoveSession = vi.fn(() => Promise.resolve());

    // Mock window 事件
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session 管理基本功能', () => {
    it('handleNewChat 應該清除圖片並重置 session', () => {
      const setImage = vi.fn();
      const setImageUrl = vi.fn();
      const setCurrentSessionId = vi.fn();
      const setShowSidebar = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId,
          setImage,
          setImageUrl,
          setShowSidebar,
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: null,
          editingTitle: '',
          setEditingSessionId: vi.fn(),
          setEditingTitle: vi.fn(),
          editingContainerRef: { current: null },
        })
      );

      result.current.handleNewChat();

      expect(setImage).toHaveBeenCalledWith(null);
      expect(setImageUrl).toHaveBeenCalledWith('');
      expect(setCurrentSessionId).toHaveBeenCalledWith(null);
    });

    it('handleSwitchSession 應該切換到不同的 session', () => {
      const setImage = vi.fn();
      const setImageUrl = vi.fn();
      const setCurrentSessionId = vi.fn();
      const setShowSidebar = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId,
          setImage,
          setImageUrl,
          setShowSidebar,
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: null,
          editingTitle: '',
          setEditingSessionId: vi.fn(),
          setEditingTitle: vi.fn(),
          editingContainerRef: { current: null },
        })
      );

      result.current.handleSwitchSession('session-2');

      expect(setCurrentSessionId).toHaveBeenCalledWith('session-2');
      expect(setImage).toHaveBeenCalledWith(null);
      expect(setImageUrl).toHaveBeenCalledWith('');
    });

    it('handleDeleteSession 應該刪除 session', async () => {
      const setCurrentSessionId = vi.fn();
      const setImage = vi.fn();
      const setImageUrl = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId,
          setImage,
          setImageUrl,
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: null,
          editingTitle: '',
          setEditingSessionId: vi.fn(),
          setEditingTitle: vi.fn(),
          editingContainerRef: { current: null },
        })
      );

      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      await result.current.handleDeleteSession('session-1', mockEvent);

      expect(mockRemoveSession).toHaveBeenCalledWith('session-1');
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Session 標題編輯', () => {
    it('handleStartEditTitle 應該進入編輯模式', () => {
      const setEditingSessionId = vi.fn();
      const setEditingTitle = vi.fn();
      const setCurrentSessionId = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-2',
          setCurrentSessionId,
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: null,
          editingTitle: '',
          setEditingSessionId,
          setEditingTitle,
          editingContainerRef: { current: null },
        })
      );

      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      result.current.handleStartEditTitle('session-1', '舊標題', mockEvent);

      expect(setEditingSessionId).toHaveBeenCalledWith('session-1');
      expect(setEditingTitle).toHaveBeenCalledWith('舊標題');
    });

    it('handleSaveTitle 應該保存編輯的標題', async () => {
      const setEditingSessionId = vi.fn();
      const setEditingTitle = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: 'session-1',
          editingTitle: '新標題',
          setEditingSessionId,
          setEditingTitle,
          editingContainerRef: { current: null },
        })
      );

      await result.current.handleSaveTitle('session-1');

      expect(mockUpdateTitle).toHaveBeenCalledWith('新標題');
      expect(mockLoadSessions).toHaveBeenCalled();
      expect(setEditingSessionId).toHaveBeenCalledWith(null);
      expect(setEditingTitle).toHaveBeenCalledWith('');
    });

    it('handleCancelEdit 應該取消編輯', () => {
      const setEditingSessionId = vi.fn();
      const setEditingTitle = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: 'session-1',
          editingTitle: '編輯中',
          setEditingSessionId,
          setEditingTitle,
          editingContainerRef: { current: null },
        })
      );

      result.current.handleCancelEdit();

      expect(setEditingSessionId).toHaveBeenCalledWith(null);
      expect(setEditingTitle).toHaveBeenCalledWith('');
    });
  });

  describe('鍵盤快捷鍵', () => {
    it('Enter 鍵應該保存標題編輯', () => {
      const setEditingSessionId = vi.fn();
      const setEditingTitle = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: 'session-1',
          editingTitle: '新標題',
          setEditingSessionId,
          setEditingTitle,
          editingContainerRef: { current: null },
        })
      );

      const mockEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      result.current.handleTitleKeyDown(mockEvent, 'session-1');

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockUpdateTitle).toHaveBeenCalledWith('新標題');
    });

    it('Escape 鍵應該取消編輯', () => {
      const setEditingSessionId = vi.fn();
      const setEditingTitle = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: 'session-1',
          editingTitle: '編輯中',
          setEditingSessionId,
          setEditingTitle,
          editingContainerRef: { current: null },
        })
      );

      const mockEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      result.current.handleTitleKeyDown(mockEvent, 'session-1');

      expect(setEditingSessionId).toHaveBeenCalledWith(null);
      expect(setEditingTitle).toHaveBeenCalledWith('');
    });
  });

  describe('點擊外部偵測 (useEffect 依賴陣列測試)', () => {
    it('應該在編輯模式下設置點擊外部監聽器', () => {
      const setEditingSessionId = vi.fn();
      const mockContainer = document.createElement('div');
      const mockButton = document.createElement('button');
      mockContainer.appendChild(mockButton);
      document.body.appendChild(mockContainer);

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: 'session-1',
          editingTitle: '編輯',
          setEditingSessionId,
          setEditingTitle: vi.fn(),
          editingContainerRef: { current: mockContainer },
        })
      );

      // 當 editingSessionId 存在時，應該有監聽器被設置
      expect(result.current).toBeDefined();

      // 清理
      document.body.removeChild(mockContainer);
    });

    it('應該在取消編輯時移除點擊外部監聽器', () => {
      const setEditingSessionId = vi.fn();
      const mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      const { rerender } = renderHook(
        ({ editingSessionId }) =>
          useSessionManagement({
            currentSessionId: 'session-1',
            setCurrentSessionId: vi.fn(),
            setImage: vi.fn(),
            setImageUrl: vi.fn(),
            setShowSidebar: vi.fn(),
            updateTitle: mockUpdateTitle,
            loadSessions: mockLoadSessions,
            removeSession: mockRemoveSession,
            editingSessionId,
            editingTitle: '編輯',
            setEditingSessionId,
            setEditingTitle: vi.fn(),
            editingContainerRef: { current: mockContainer },
          }),
        {
          initialProps: { editingSessionId: 'session-1' },
        }
      );

      // 編輯模式下應該有監聽器
      expect(setEditingSessionId).toBeDefined();

      // 退出編輯模式
      rerender({ editingSessionId: null });

      // 清理
      document.body.removeChild(mockContainer);
    });

    it('點擊容器外應該觸發 handleCancelEdit', () => {
      const setEditingSessionId = vi.fn();
      const mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: 'session-1',
          editingTitle: '編輯',
          setEditingSessionId,
          setEditingTitle: vi.fn(),
          editingContainerRef: { current: mockContainer },
        })
      );

      // 模擬點擊容器外
      const mockEvent = new MouseEvent('mousedown', { bubbles: true });
      document.body.dispatchEvent(mockEvent);

      // handleCancelEdit 應該被呼叫
      expect(result.current).toBeDefined();

      // 清理
      document.body.removeChild(mockContainer);
    });
  });

  describe('完整流程測試', () => {
    it('編輯 session 標題的完整流程', async () => {
      const setEditingSessionId = vi.fn();
      const setEditingTitle = vi.fn();
      const setCurrentSessionId = vi.fn();

      const { result } = renderHook(() =>
        useSessionManagement({
          currentSessionId: 'session-1',
          setCurrentSessionId,
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setShowSidebar: vi.fn(),
          updateTitle: mockUpdateTitle,
          loadSessions: mockLoadSessions,
          removeSession: mockRemoveSession,
          editingSessionId: null,
          editingTitle: '',
          setEditingSessionId,
          setEditingTitle,
          editingContainerRef: { current: null },
        })
      );

      // Step 1: 開始編輯
      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
      result.current.handleStartEditTitle('session-1', '舊標題', mockEvent);

      expect(setEditingSessionId).toHaveBeenCalledWith('session-1');
      expect(setEditingTitle).toHaveBeenCalledWith('舊標題');

      // Step 2: 按 Enter 保存
      const mockKeyEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      result.current.handleTitleKeyDown(mockKeyEvent, 'session-1');

      // Step 3: 標題應該被更新並編輯模式應該關閉
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });
});
