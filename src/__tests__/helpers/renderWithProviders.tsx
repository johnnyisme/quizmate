import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

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
  setShowSettings: jest.fn(),
  setShowSidebar: jest.fn(),
  setShowCamera: jest.fn(),
  setPreviewImage: jest.fn(),
  setIsSelectMode: jest.fn(),
  setCopiedMessageIndex: jest.fn(),
  setShowScrollToTop: jest.fn(),
  setShowScrollToBottom: jest.fn(),
  setShowErrorSuggestion: jest.fn(),
  setShowTechnicalDetails: jest.fn(),
  updateUIState: jest.fn(),
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
  setApiKeys: jest.fn(),
  setCurrentKeyIndex: jest.fn(),
  setSelectedModel: jest.fn(),
  setThinkingMode: jest.fn(),
  setPrompts: jest.fn(),
  setSelectedPromptId: jest.fn(),
  setIsDark: jest.fn(),
  updateSettingsState: jest.fn(),
};

export const mockChatState = {
  displayConversation: [],
  apiHistory: [],
  currentPrompt: '',
  isLoading: false,
  error: null,
  setDisplayConversation: jest.fn(),
  setApiHistory: jest.fn(),
  setCurrentPrompt: jest.fn(),
  setIsLoading: jest.fn(),
  setError: jest.fn(),
  updateChatState: jest.fn(),
};

export const mockImageState = {
  image: null,
  imageUrl: '',
  cameraStream: null,
  setImage: jest.fn(),
  setImageUrl: jest.fn(),
  setCameraStream: jest.fn(),
  updateImageState: jest.fn(),
};

export const mockSelectionState = {
  selectedMessages: new Set(),
  editingSessionId: null,
  editingTitle: '',
  setSelectedMessages: jest.fn(),
  setEditingSessionId: jest.fn(),
  setEditingTitle: jest.fn(),
  updateSelectionState: jest.fn(),
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
  children: ReactElement;
  overrides?: ReturnType<typeof createMockProvider>;
}) {
  const mockContext = overrides || createMockProvider();

  return React.createElement(
    React.Fragment,
    null,
    children
  );
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

  function Wrapper({ children }: { children: ReactElement }) {
    return React.createElement(
      MockProvider,
      { overrides: mockContext },
      children
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
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
    value: jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
  return function Wrapper({ children }: { children: ReactElement }) {
    return React.createElement(
      MockProvider,
      { overrides: createMockProvider(defaultState) },
      children
    );
  };
}

/**
 * Assert mock function called with arguments
 */
export function assertMockCalled(
  mockFn: jest.Mock,
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
  mockFn: jest.Mock,
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
export function getLatestMockCall<T = any>(mockFn: jest.Mock): T[] | undefined {
  const calls = mockFn.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1] : undefined;
}
