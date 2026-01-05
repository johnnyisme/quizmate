import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Render with Providers - Test utility for rendering components with context
 * ──────────────────────────────────────────────────────────────────────────
 * Provides a consistent testing environment with all necessary providers/mocks
 */

// Mock context values
export const mockUIState = {
  showSettings: false,
  showSidebar: false,
  showCamera: false,
  previewImage: null,
  isSelectMode: false,
  copiedMessageIndex: null,
  showScrollToTop: false,
  showScrollToBottom: false,
  showErrorSuggestion: false,
  showTechnicalDetails: false,
  setShowSettings: vi.fn(),
  setShowSidebar: vi.fn(),
  setShowCamera: vi.fn(),
  setPreviewImage: vi.fn(),
  setIsSelectMode: vi.fn(),
  setCopiedMessageIndex: vi.fn(),
  setShowScrollToTop: vi.fn(),
  setShowScrollToBottom: vi.fn(),
  setShowErrorSuggestion: vi.fn(),
  setShowTechnicalDetails: vi.fn(),
  updateUIState: vi.fn(),
};

export const mockSettingsState = {
  apiKeys: ['test-key'],
  currentKeyIndex: 0,
  selectedModel: 'gemini-2.5-flash' as const,
  thinkingMode: 'fast' as const,
  prompts: [
    {
      id: 'default',
      name: '預設',
      content: '你是一位老師',
      isDefault: true,
    },
  ],
  selectedPromptId: 'default',
  isDark: false,
  setApiKeys: vi.fn(),
  setCurrentKeyIndex: vi.fn(),
  setSelectedModel: vi.fn(),
  setThinkingMode: vi.fn(),
  setPrompts: vi.fn(),
  setSelectedPromptId: vi.fn(),
  setIsDark: vi.fn(),
  updateSettingsState: vi.fn(),
};

export const mockChatState = {
  displayConversation: [],
  apiHistory: [],
  currentPrompt: '',
  isLoading: false,
  error: null,
  setDisplayConversation: vi.fn(),
  setApiHistory: vi.fn(),
  setCurrentPrompt: vi.fn(),
  setIsLoading: vi.fn(),
  setError: vi.fn(),
  updateChatState: vi.fn(),
};

export const mockImageState = {
  image: null,
  imageUrl: '',
  cameraStream: null,
  setImage: vi.fn(),
  setImageUrl: vi.fn(),
  setCameraStream: vi.fn(),
  updateImageState: vi.fn(),
};

export const mockSelectionState = {
  selectedMessages: new Set(),
  editingSessionId: null,
  editingTitle: '',
  setSelectedMessages: vi.fn(),
  setEditingSessionId: vi.fn(),
  setEditingTitle: vi.fn(),
  updateSelectionState: vi.fn(),
};

/**
 * Reset all mock functions
 */
export function resetAllMocks(): void {
  Object.values(mockUIState).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
  Object.values(mockSettingsState).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
  Object.values(mockChatState).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
  Object.values(mockImageState).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
  Object.values(mockSelectionState).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
}

/**
 * Create mock context provider
 */
export function createMockProvider(overrides?: {
  uiState?: Partial<typeof mockUIState>;
  settingsState?: Partial<typeof mockSettingsState>;
  chatState?: Partial<typeof mockChatState>;
  imageState?: Partial<typeof mockImageState>;
  selectionState?: Partial<typeof mockSelectionState>;
}) {
  const finalUIState = { ...mockUIState, ...overrides?.uiState };
  const finalSettingsState = {
    ...mockSettingsState,
    ...overrides?.settingsState,
  };
  const finalChatState = { ...mockChatState, ...overrides?.chatState };
  const finalImageState = { ...mockImageState, ...overrides?.imageState };
  const finalSelectionState = {
    ...mockSelectionState,
    ...overrides?.selectionState,
  };

  return {
    uiState: finalUIState,
    settingsState: finalSettingsState,
    chatState: finalChatState,
    imageState: finalImageState,
    selectionState: finalSelectionState,
  };
}

/**
 * Mock Provider Component
 */
export function MockProvider({
  children,
  overrides,
}: {
  children: React.ReactNode;
  overrides?: ReturnType<typeof createMockProvider>;
}) {
  const mockContext = overrides || createMockProvider();

  return <>{children}</>;
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  uiState?: Partial<typeof mockUIState>;
  settingsState?: Partial<typeof mockSettingsState>;
  chatState?: Partial<typeof mockChatState>;
  imageState?: Partial<typeof mockImageState>;
  selectionState?: Partial<typeof mockSelectionState>;
}

/**
 * Render component with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    uiState,
    settingsState,
    chatState,
    imageState,
    selectionState,
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  const mockContext = createMockProvider({
    uiState,
    settingsState,
    chatState,
    imageState,
    selectionState,
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockProvider overrides={mockContext}>
        {children}
      </MockProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }>, ...renderOptions }),
    mockContext,
    resetMocks: resetAllMocks,
  };
}

/**
 * Setup test environment
 */
export function setupTestEnvironment() {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
  });

  // Mock window.matchMedia
  Object.defineProperty(global, 'matchMedia', {
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  return {
    localStorage: localStorageMock,
  };
}

/**
 * Cleanup test environment
 */
export function cleanupTestEnvironment() {
  resetAllMocks();
  (global.localStorage as any)?.clear();
}

/**
 * Create component test wrapper with default state
 */
export function createComponentTestWrapper(
  defaultState?: RenderWithProvidersOptions
) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockProvider overrides={createMockProvider(defaultState)}>
        {children}
      </MockProvider>
    );
  };
}

/**
 * Assert mock function called with arguments
 */
export function assertMockCalled(
  mockFn: ReturnType<typeof vi.fn>,
  expectedCalls: any[][],
  message?: string
): void {
  if (mockFn.mock.calls.length !== expectedCalls.length) {
    throw new Error(
      `${message || 'Mock'} called ${mockFn.mock.calls.length} times, expected ${expectedCalls.length}`
    );
  }

  expectedCalls.forEach((expectedCall, index) => {
    const actualCall = mockFn.mock.calls[index];
    if (JSON.stringify(actualCall) !== JSON.stringify(expectedCall)) {
      throw new Error(
        `${message || 'Mock'} call ${index} mismatch\nExpected: ${JSON.stringify(expectedCall)}\nActual: ${JSON.stringify(actualCall)}`
      );
    }
  });
}

/**
 * Wait for mock to be called
 */
export async function waitForMockCall(
  mockFn: ReturnType<typeof vi.fn>,
  timeout: number = 1000
): Promise<void> {
  const startTime = Date.now();
  
  while (mockFn.mock.calls.length === 0) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Mock function was not called within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Get latest mock call
 */
export function getLatestMockCall<T = any>(mockFn: ReturnType<typeof vi.fn>): T[] | undefined {
  const calls = mockFn.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1] : undefined;
}
