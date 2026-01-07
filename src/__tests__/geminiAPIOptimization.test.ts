import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGeminiAPI } from '@/hooks/useGeminiAPI';
import type { ModelType } from '@/hooks/useSettingsState';

// Use vi.hoisted to ensure mocks are available before imports
const { mockGenerateContentStream, mockGetGenerativeModel, MockGoogleGenerativeAI } = vi.hoisted(() => {
  return {
    mockGenerateContentStream: vi.fn(),
    mockGetGenerativeModel: vi.fn(),
    MockGoogleGenerativeAI: vi.fn(),
  };
});

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI
  };
});

// Mock file utils
vi.mock('@/utils/fileUtils', () => ({
  fileToBase64: vi.fn().mockResolvedValue('base64data'),
}));

// Mock error handling
vi.mock('@/utils/errorHandling', () => ({
  getFriendlyErrorMessage: vi.fn().mockReturnValue({
    message: 'Error',
    suggestion: 'Try again'
  })
}));

describe('Gemini API Performance Optimizations', () => {
  const mockProps = {
    apiKeys: ['key1', 'key2', 'key3'],
    currentKeyIndex: 0,
    selectedModel: 'gemini-2.5-flash' as ModelType,
    thinkingMode: 'fast' as const,
    prompts: [{ id: 'default', name: 'Default', content: 'You are a helpful teacher' }],
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
    createNewSession: vi.fn().mockResolvedValue({ id: 'session1' }),
    addMessages: vi.fn().mockResolvedValue(undefined),
    performCleanup: vi.fn().mockResolvedValue(undefined),
    loadSessions: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock behavior
    mockGenerateContentStream.mockResolvedValue({
      stream: (async function* () {
        yield { text: () => 'Test response' };
      })(),
      response: Promise.resolve({ text: () => 'Test response' })
    });
    
    mockGetGenerativeModel.mockReturnValue({
      generateContentStream: mockGenerateContentStream
    });
    
    MockGoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));
  });

  describe('Client and Model Instance Caching', () => {
    it('should cache GoogleGenerativeAI clients using useMemo', () => {
      const { rerender } = renderHook(
        (props) => useGeminiAPI(props),
        { initialProps: mockProps }
      );

      const initialCallCount = MockGoogleGenerativeAI.mock.calls.length;

      // Re-render with same apiKeys
      rerender(mockProps);

      // Constructor should not be called again (cached)
      expect(MockGoogleGenerativeAI.mock.calls.length).toBe(initialCallCount);
    });

    it('should re-create clients when apiKeys change', () => {
      const { rerender } = renderHook(
        (props) => useGeminiAPI(props),
        { initialProps: mockProps }
      );

      const initialCallCount = MockGoogleGenerativeAI.mock.calls.length;

      // Re-render with different apiKeys
      rerender({
        ...mockProps,
        apiKeys: ['newkey1', 'newkey2']
      });

      // Constructor should be called again with new keys
      expect(MockGoogleGenerativeAI.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should cache model instances using useMemo', () => {
      const { rerender } = renderHook(
        (props) => useGeminiAPI(props),
        { initialProps: mockProps }
      );

      const initialCallCount = mockGetGenerativeModel.mock.calls.length;

      // Re-render with same model
      rerender(mockProps);

      // getGenerativeModel should not be called again (cached)
      expect(mockGetGenerativeModel.mock.calls.length).toBe(initialCallCount);
    });

    it('should re-create model instances when selectedModel changes', () => {
      const { rerender } = renderHook(
        (props) => useGeminiAPI(props),
        { initialProps: mockProps }
      );

      const initialCallCount = mockGetGenerativeModel.mock.calls.length;

      // Re-render with different model
      rerender({
        ...mockProps,
        selectedModel: 'gemini-2.5-pro' as ModelType
      });

      // getGenerativeModel should be called again with new model
      expect(mockGetGenerativeModel.mock.calls.length).toBeGreaterThan(initialCallCount);
      expect(mockGetGenerativeModel).toHaveBeenLastCalledWith({ model: 'gemini-2.5-pro' });
    });
  });

  describe('Load Balancing - API Key Rotation', () => {
    it('should rotate to next key after successful request', async () => {
      const setCurrentKeyIndex = vi.fn();
      const { result } = renderHook(() => useGeminiAPI({
        ...mockProps,
        currentKeyIndex: 0,
        setCurrentKeyIndex,
      }));

      await waitFor(() => {
        result.current.handleSubmit('Test question', null, '', vi.fn(), vi.fn());
      });

      await waitFor(() => {
        // Should rotate to next key (0 + 1) % 3 = 1
        expect(setCurrentKeyIndex).toHaveBeenCalledWith(1);
      });
    });

    it('should rotate correctly with different starting indices', async () => {
      const setCurrentKeyIndex = vi.fn();
      
      // Start from key index 1
      const { result } = renderHook(() => useGeminiAPI({
        ...mockProps,
        currentKeyIndex: 1,
        setCurrentKeyIndex,
      }));

      await waitFor(() => {
        result.current.handleSubmit('Test question', null, '', vi.fn(), vi.fn());
      });

      await waitFor(() => {
        // Should rotate to next key (1 + 1) % 3 = 2
        expect(setCurrentKeyIndex).toHaveBeenCalledWith(2);
      });
    });

    it('should wrap around to first key after last key', async () => {
      const setCurrentKeyIndex = vi.fn();
      
      // Start from last key index
      const { result } = renderHook(() => useGeminiAPI({
        ...mockProps,
        currentKeyIndex: 2,
        setCurrentKeyIndex,
      }));

      await waitFor(() => {
        result.current.handleSubmit('Test question', null, '', vi.fn(), vi.fn());
      });

      await waitFor(() => {
        // Should wrap around (2 + 1) % 3 = 0
        expect(setCurrentKeyIndex).toHaveBeenCalledWith(0);
      });
    });

    it('should distribute requests evenly across all keys', async () => {
      const setCurrentKeyIndex = vi.fn();
      let currentIndex = 0;
      
      const { result, rerender } = renderHook(
        (props) => useGeminiAPI(props),
        { 
          initialProps: {
            ...mockProps,
            currentKeyIndex: 0,
            setCurrentKeyIndex: (index: number) => {
              currentIndex = index;
              setCurrentKeyIndex(index);
            }
          }
        }
      );

      // Send 3 requests
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          result.current.handleSubmit(`Question ${i}`, null, '', vi.fn(), vi.fn());
        });
        
        // Update props with new index for next iteration
        rerender({
          ...mockProps,
          currentKeyIndex: currentIndex,
          setCurrentKeyIndex: (index: number) => {
            currentIndex = index;
            setCurrentKeyIndex(index);
          }
        });
      }

      // Should have used keys in order: 0 -> 1 -> 2
      const calls = setCurrentKeyIndex.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(3);
      expect(calls[0][0]).toBe(1); // After using key 0, rotate to 1
      expect(calls[1][0]).toBe(2); // After using key 1, rotate to 2
      expect(calls[2][0]).toBe(0); // After using key 2, wrap to 0
    });

    it('should only try next key on failure, not success', async () => {
      const setCurrentKeyIndex = vi.fn();

      const { result } = renderHook(() => useGeminiAPI({
        ...mockProps,
        currentKeyIndex: 0,
        setCurrentKeyIndex,
      }));

      await waitFor(() => {
        result.current.handleSubmit('Test', null, '', vi.fn(), vi.fn());
      });

      await waitFor(() => {
        // Should only call API once (first key succeeded)
        expect(mockGenerateContentStream).toHaveBeenCalledTimes(1);
        // Should rotate to next key
        expect(setCurrentKeyIndex).toHaveBeenCalledWith(1);
      });
    });

    it('should try all keys when first key fails', async () => {
      const setCurrentKeyIndex = vi.fn();
      
      let callCount = 0;
      mockGenerateContentStream.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return Promise.reject(new Error('API Error'));
        } else {
          // Second call succeeds
          return Promise.resolve({
            stream: (async function* () {
              yield { text: () => 'Success' };
            })(),
            response: Promise.resolve({ text: () => 'Success' })
          });
        }
      });

      const { result } = renderHook(() => useGeminiAPI({
        ...mockProps,
        currentKeyIndex: 0,
        setCurrentKeyIndex,
      }));

      await waitFor(() => {
        result.current.handleSubmit('Test', null, '', vi.fn(), vi.fn());
      });

      await waitFor(() => {
        // Should have tried at least 2 keys
        expect(mockGenerateContentStream.mock.calls.length).toBeGreaterThanOrEqual(2);
        // Should rotate to next successful key (0 failed, 1 succeeded, so rotate to 2)
        expect(setCurrentKeyIndex).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('Performance Benefits', () => {
    it('should reuse cached clients to avoid connection overhead', () => {
      const { rerender } = renderHook(
        (props) => useGeminiAPI(props),
        { initialProps: mockProps }
      );

      const firstRenderCalls = MockGoogleGenerativeAI.mock.calls.length;

      // Multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(mockProps);
      }

      // Should not create new clients
      expect(MockGoogleGenerativeAI.mock.calls.length).toBe(firstRenderCalls);
    });

    it('should maintain separate cached instances per API key', () => {
      renderHook(() => useGeminiAPI({
        ...mockProps,
        apiKeys: ['key1', 'key2', 'key3']
      }));

      // Should create one client per API key
      expect(MockGoogleGenerativeAI.mock.calls.length).toBe(3);
      expect(MockGoogleGenerativeAI.mock.calls[0][0]).toBe('key1');
      expect(MockGoogleGenerativeAI.mock.calls[1][0]).toBe('key2');
      expect(MockGoogleGenerativeAI.mock.calls[2][0]).toBe('key3');
    });
  });
});
