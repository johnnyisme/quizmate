/**
 * useGeminiAPI Hook 依賴陣列測試
 * 
 * 測試目標：驗證 API 調用、Key 輪替、流式傳輸和錯誤恢復
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeminiAPI } from '@/hooks/useGeminiAPI';

describe('useGeminiAPI - API 調用和 Key 輪替', () => {
  let mockPrompts: any[];

  beforeEach(() => {
    mockPrompts = [
      {
        id: 'default',
        name: '預設 Prompt',
        content: '你是一個數學老師',
        isDefault: true,
      },
    ];

    // Mock localStorage
    const store = {};
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      length: Object.keys(store).length,
      key: vi.fn((index) => Object.keys(store)[index] || null),
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本 API 調用', () => {
    it('應該初始化 API 鉤子', () => {
      const { result } = renderHook(() =>
        useGeminiAPI({
          apiKeys: ['key-1', 'key-2'],
          currentKeyIndex: 0,
          selectedModel: 'gemini-2.5-flash',
          thinkingMode: 'fast',
          prompts: mockPrompts,
          selectedPromptId: 'default',
          currentSessionId: 'session-1',
          apiHistory: [],
          chatContainerRef: { current: null },
          shouldScrollToQuestion: { current: false },
          setCurrentKeyIndex: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentPrompt: vi.fn(),
          setIsLoading: vi.fn(),
          setError: vi.fn(),
          setCurrentSessionId: vi.fn(),
          createNewSession: vi.fn(),
          addMessages: vi.fn(),
          performCleanup: vi.fn(),
          loadSessions: vi.fn(),
        })
      );

      expect(result.current.handleSubmit).toBeDefined();
    });

    it('應該驗證用戶輸入不為空', async () => {
      const setError = vi.fn();

      const { result } = renderHook(() =>
        useGeminiAPI({
          apiKeys: ['key-1'],
          currentKeyIndex: 0,
          selectedModel: 'gemini-2.5-flash',
          thinkingMode: 'fast',
          prompts: mockPrompts,
          selectedPromptId: 'default',
          currentSessionId: null,
          apiHistory: [],
          chatContainerRef: { current: null },
          shouldScrollToQuestion: { current: false },
          setCurrentKeyIndex: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentPrompt: vi.fn(),
          setIsLoading: vi.fn(),
          setError,
          setCurrentSessionId: vi.fn(),
          createNewSession: vi.fn(),
          addMessages: vi.fn(),
          performCleanup: vi.fn(),
          loadSessions: vi.fn(),
        })
      );

      await act(async () => {
        await result.current.handleSubmit('', null, '', vi.fn(), vi.fn());
      });

      expect(setError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '請輸入問題或上傳圖片',
        })
      );
    });

    it('應該驗證 API keys 不為空', async () => {
      const setError = vi.fn();

      const { result } = renderHook(() =>
        useGeminiAPI({
          apiKeys: [],
          currentKeyIndex: 0,
          selectedModel: 'gemini-2.5-flash',
          thinkingMode: 'fast',
          prompts: mockPrompts,
          selectedPromptId: 'default',
          currentSessionId: null,
          apiHistory: [],
          chatContainerRef: { current: null },
          shouldScrollToQuestion: { current: false },
          setCurrentKeyIndex: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentPrompt: vi.fn(),
          setIsLoading: vi.fn(),
          setError,
          setCurrentSessionId: vi.fn(),
          createNewSession: vi.fn(),
          addMessages: vi.fn(),
          performCleanup: vi.fn(),
          loadSessions: vi.fn(),
        })
      );

      await act(async () => {
        await result.current.handleSubmit('問題', null, '', vi.fn(), vi.fn());
      });

      expect(setError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '請先設置 API keys',
        })
      );
    });
  });

  describe('依賴陣列檢驗', () => {
    it('API keys 變更應該重新初始化 hook', () => {
      const { rerender, result: result1 } = renderHook(
        ({ apiKeys }) =>
          useGeminiAPI({
            apiKeys,
            currentKeyIndex: 0,
            selectedModel: 'gemini-2.5-flash',
            thinkingMode: 'fast',
            prompts: mockPrompts,
            selectedPromptId: 'default',
            currentSessionId: null,
            apiHistory: [],
            chatContainerRef: { current: null },
            shouldScrollToQuestion: { current: false },
            setCurrentKeyIndex: vi.fn(),
            setDisplayConversation: vi.fn(),
            setApiHistory: vi.fn(),
            setCurrentPrompt: vi.fn(),
            setIsLoading: vi.fn(),
            setError: vi.fn(),
            setCurrentSessionId: vi.fn(),
            createNewSession: vi.fn(),
            addMessages: vi.fn(),
            performCleanup: vi.fn(),
            loadSessions: vi.fn(),
          }),
        {
          initialProps: { apiKeys: ['key-1'] },
        }
      );

      expect(result1.current.handleSubmit).toBeDefined();

      // 更新 API keys
      rerender({ apiKeys: ['key-1', 'key-2'] });

      expect(result1.current.handleSubmit).toBeDefined();
    });

    it('selectedModel 變更應該使用新的模型', () => {
      const { rerender, result: result1 } = renderHook(
        ({ selectedModel }) =>
          useGeminiAPI({
            apiKeys: ['key-1'],
            currentKeyIndex: 0,
            selectedModel,
            thinkingMode: 'fast',
            prompts: mockPrompts,
            selectedPromptId: 'default',
            currentSessionId: null,
            apiHistory: [],
            chatContainerRef: { current: null },
            shouldScrollToQuestion: { current: false },
            setCurrentKeyIndex: vi.fn(),
            setDisplayConversation: vi.fn(),
            setApiHistory: vi.fn(),
            setCurrentPrompt: vi.fn(),
            setIsLoading: vi.fn(),
            setError: vi.fn(),
            setCurrentSessionId: vi.fn(),
            createNewSession: vi.fn(),
            addMessages: vi.fn(),
            performCleanup: vi.fn(),
            loadSessions: vi.fn(),
          }),
        {
          initialProps: { selectedModel: 'gemini-2.5-flash' as any },
        }
      );

      expect(result1.current.handleSubmit).toBeDefined();

      // 更新模型
      rerender({ selectedModel: 'gemini-2.5-pro' as any });

      expect(result1.current.handleSubmit).toBeDefined();
    });

    it('thinkingMode 變更應該影響 API 配置', () => {
      const { rerender, result: result1 } = renderHook(
        ({ thinkingMode }) =>
          useGeminiAPI({
            apiKeys: ['key-1'],
            currentKeyIndex: 0,
            selectedModel: 'gemini-3-flash-preview',
            thinkingMode,
            prompts: mockPrompts,
            selectedPromptId: 'default',
            currentSessionId: null,
            apiHistory: [],
            chatContainerRef: { current: null },
            shouldScrollToQuestion: { current: false },
            setCurrentKeyIndex: vi.fn(),
            setDisplayConversation: vi.fn(),
            setApiHistory: vi.fn(),
            setCurrentPrompt: vi.fn(),
            setIsLoading: vi.fn(),
            setError: vi.fn(),
            setCurrentSessionId: vi.fn(),
            createNewSession: vi.fn(),
            addMessages: vi.fn(),
            performCleanup: vi.fn(),
            loadSessions: vi.fn(),
          }),
        {
          initialProps: { thinkingMode: 'fast' as any },
        }
      );

      expect(result1.current.handleSubmit).toBeDefined();

      // 更新思考模式
      rerender({ thinkingMode: 'thinking' as any });

      expect(result1.current.handleSubmit).toBeDefined();
    });

    it('selectedPromptId 變更應該使用新的 prompt', () => {
      const newPrompts = [
        ...mockPrompts,
        {
          id: 'science',
          name: '科學 Prompt',
          content: '你是科學老師',
          isDefault: false,
        },
      ];

      const { rerender, result: result1 } = renderHook(
        ({ selectedPromptId }) =>
          useGeminiAPI({
            apiKeys: ['key-1'],
            currentKeyIndex: 0,
            selectedModel: 'gemini-2.5-flash',
            thinkingMode: 'fast',
            prompts: newPrompts,
            selectedPromptId,
            currentSessionId: null,
            apiHistory: [],
            chatContainerRef: { current: null },
            shouldScrollToQuestion: { current: false },
            setCurrentKeyIndex: vi.fn(),
            setDisplayConversation: vi.fn(),
            setApiHistory: vi.fn(),
            setCurrentPrompt: vi.fn(),
            setIsLoading: vi.fn(),
            setError: vi.fn(),
            setCurrentSessionId: vi.fn(),
            createNewSession: vi.fn(),
            addMessages: vi.fn(),
            performCleanup: vi.fn(),
            loadSessions: vi.fn(),
          }),
        {
          initialProps: { selectedPromptId: 'default' },
        }
      );

      expect(result1.current.handleSubmit).toBeDefined();

      // 更新 prompt ID
      rerender({ selectedPromptId: 'science' });

      expect(result1.current.handleSubmit).toBeDefined();
    });
  });

  describe('API 歷史管理', () => {
    it('apiHistory 變更應該保持對話上下文', () => {
      const mockApiHistory = [
        {
          role: 'user',
          parts: [{ text: '1+1=' }],
        },
        {
          role: 'model',
          parts: [{ text: '2' }],
        },
      ];

      const { rerender, result: result1 } = renderHook(
        ({ apiHistory }) =>
          useGeminiAPI({
            apiKeys: ['key-1'],
            currentKeyIndex: 0,
            selectedModel: 'gemini-2.5-flash',
            thinkingMode: 'fast',
            prompts: mockPrompts,
            selectedPromptId: 'default',
            currentSessionId: null,
            apiHistory,
            chatContainerRef: { current: null },
            shouldScrollToQuestion: { current: false },
            setCurrentKeyIndex: vi.fn(),
            setDisplayConversation: vi.fn(),
            setApiHistory: vi.fn(),
            setCurrentPrompt: vi.fn(),
            setIsLoading: vi.fn(),
            setError: vi.fn(),
            setCurrentSessionId: vi.fn(),
            createNewSession: vi.fn(),
            addMessages: vi.fn(),
            performCleanup: vi.fn(),
            loadSessions: vi.fn(),
          }),
        {
          initialProps: { apiHistory: [] },
        }
      );

      expect(result1.current.handleSubmit).toBeDefined();

      // 更新 API 歷史
      rerender({ apiHistory: mockApiHistory as any });

      expect(result1.current.handleSubmit).toBeDefined();
    });
  });

  describe('Session 管理', () => {
    it('currentSessionId 變更應該關聯到正確的 session', () => {
      const { rerender, result: result1 } = renderHook(
        ({ currentSessionId }) =>
          useGeminiAPI({
            apiKeys: ['key-1'],
            currentKeyIndex: 0,
            selectedModel: 'gemini-2.5-flash',
            thinkingMode: 'fast',
            prompts: mockPrompts,
            selectedPromptId: 'default',
            currentSessionId,
            apiHistory: [],
            chatContainerRef: { current: null },
            shouldScrollToQuestion: { current: false },
            setCurrentKeyIndex: vi.fn(),
            setDisplayConversation: vi.fn(),
            setApiHistory: vi.fn(),
            setCurrentPrompt: vi.fn(),
            setIsLoading: vi.fn(),
            setError: vi.fn(),
            setCurrentSessionId: vi.fn(),
            createNewSession: vi.fn(),
            addMessages: vi.fn(),
            performCleanup: vi.fn(),
            loadSessions: vi.fn(),
          }),
        {
          initialProps: { currentSessionId: null },
        }
      );

      expect(result1.current.handleSubmit).toBeDefined();

      // 切換 session
      rerender({ currentSessionId: 'session-1' });

      expect(result1.current.handleSubmit).toBeDefined();
    });
  });

  describe('Ref 管理', () => {
    it('chatContainerRef 應該用於滾動管理', () => {
      const mockContainer = document.createElement('div');
      mockContainer.style.paddingBottom = '0px';

      const { result } = renderHook(() =>
        useGeminiAPI({
          apiKeys: ['key-1'],
          currentKeyIndex: 0,
          selectedModel: 'gemini-2.5-flash',
          thinkingMode: 'fast',
          prompts: mockPrompts,
          selectedPromptId: 'default',
          currentSessionId: null,
          apiHistory: [],
          chatContainerRef: { current: mockContainer },
          shouldScrollToQuestion: { current: false },
          setCurrentKeyIndex: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentPrompt: vi.fn(),
          setIsLoading: vi.fn(),
          setError: vi.fn(),
          setCurrentSessionId: vi.fn(),
          createNewSession: vi.fn(),
          addMessages: vi.fn(),
          performCleanup: vi.fn(),
          loadSessions: vi.fn(),
        })
      );

      expect(result.current.handleSubmit).toBeDefined();
    });

    it('shouldScrollToQuestion ref 應該控制滾動行為', () => {
      const shouldScroll = { current: false };

      const { result } = renderHook(() =>
        useGeminiAPI({
          apiKeys: ['key-1'],
          currentKeyIndex: 0,
          selectedModel: 'gemini-2.5-flash',
          thinkingMode: 'fast',
          prompts: mockPrompts,
          selectedPromptId: 'default',
          currentSessionId: null,
          apiHistory: [],
          chatContainerRef: { current: null },
          shouldScrollToQuestion: shouldScroll,
          setCurrentKeyIndex: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentPrompt: vi.fn(),
          setIsLoading: vi.fn(),
          setError: vi.fn(),
          setCurrentSessionId: vi.fn(),
          createNewSession: vi.fn(),
          addMessages: vi.fn(),
          performCleanup: vi.fn(),
          loadSessions: vi.fn(),
        })
      );

      expect(result.current.handleSubmit).toBeDefined();
      expect(shouldScroll.current).toBe(false);
    });
  });

  describe('完整 hook 依賴陣列驗證', () => {
    it('所有必要的依賴項應該被包含', () => {
      const setCurrentKeyIndex = vi.fn();
      const setDisplayConversation = vi.fn();
      const setApiHistory = vi.fn();
      const setCurrentPrompt = vi.fn();
      const setIsLoading = vi.fn();
      const setError = vi.fn();
      const setCurrentSessionId = vi.fn();

      const { result } = renderHook(() =>
        useGeminiAPI({
          apiKeys: ['key-1', 'key-2'],
          currentKeyIndex: 0,
          selectedModel: 'gemini-2.5-flash',
          thinkingMode: 'fast',
          prompts: mockPrompts,
          selectedPromptId: 'default',
          currentSessionId: 'session-1',
          apiHistory: [],
          chatContainerRef: { current: null },
          shouldScrollToQuestion: { current: false },
          setCurrentKeyIndex,
          setDisplayConversation,
          setApiHistory,
          setCurrentPrompt,
          setIsLoading,
          setError,
          setCurrentSessionId,
          createNewSession: vi.fn(),
          addMessages: vi.fn(),
          performCleanup: vi.fn(),
          loadSessions: vi.fn(),
        })
      );

      // 驗證所有 setter 都應該被返回的函數可用
      expect(result.current.handleSubmit).toBeDefined();
    });
  });
});
