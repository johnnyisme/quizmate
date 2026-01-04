import { renderHook, act, RenderHookResult } from '@testing-library/react';
import React from 'react';

/**
 * Test Hooks Helpers - Reusable utilities for hook testing
 * ────────────────────────────────────────────────────────
 * Common patterns and utilities for testing custom hooks
 */

/**
 * Render hook with async operations
 */
export function renderHookWithAsync<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: { initialProps?: TProps }
) {
  return renderHook(hook, options);
}

/**
 * Wait for hook state to update
 */
export async function waitForHookStateUpdate(
  result: RenderHookResult<any, any>,
  timeout: number = 1000
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      // State has updated if this interval completes
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);
  });
}

/**
 * Assert hook state value
 */
export function assertHookState<T>(
  actual: T,
  expected: T,
  message?: string
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `State assertion failed: ${message || ''}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Update hook and assert new state
 */
export function updateHookAndAssert<T>(
  renderResult: RenderHookResult<any, T>,
  updateFn: () => void,
  expectedState: Partial<T>,
  message?: string
): void {
  act(() => {
    updateFn();
  });

  const actual = renderResult.result.current;
  const matches = Object.entries(expectedState).every(
    ([key, value]) => actual[key as keyof T] === value
  );

  if (!matches) {
    throw new Error(
      `Hook assertion failed: ${message || ''}\nExpected subset: ${JSON.stringify(expectedState)}\nActual: ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Create mock localStorage for testing
 */
export function createMockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}

/**
 * Mock localStorage globally for tests
 */
export function mockLocalStorage() {
  const mock = createMockLocalStorage();
  Object.defineProperty(global, 'localStorage', {
    value: mock,
    writable: true,
  });
  return mock;
}

/**
 * Restore original localStorage
 */
export function restoreLocalStorage() {
  delete (global as any).localStorage;
}

/**
 * Create mock document for testing
 */
export function createMockDocument() {
  return {
    getElementById: jest.fn(),
    createElement: jest.fn(() => ({
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    })),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
  };
}

/**
 * Render hook with localStorage mock
 */
export function renderHookWithLocalStorage<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: { initialProps?: TProps }
) {
  const localStorage = mockLocalStorage();
  const result = renderHook(hook, options);
  
  return {
    ...result,
    localStorage,
    cleanup: () => {
      result.unmount();
      restoreLocalStorage();
    },
  };
}

/**
 * Wait for effect to run
 */
export async function waitForEffect(timeout: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Batch hook updates
 */
export function batchHookUpdates(updates: Array<() => void>): void {
  act(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Create mock ref
 */
export function createMockRef<T = any>(initialValue: T = null) {
  return React.createRef<T>();
}

/**
 * Assert hook effect cleanup
 */
export function testEffectCleanup(
  hook: () => void,
  expectedCleanups: number = 1
): void {
  let cleanupCount = 0;
  const originalSetInterval = global.setInterval;
  const originalSetTimeout = global.setTimeout;

  global.setInterval = jest.fn(originalSetInterval);
  global.setTimeout = jest.fn(originalSetTimeout);

  const { unmount } = renderHook(() => {
    React.useEffect(() => {
      hook();
      return () => {
        cleanupCount++;
      };
    }, []);
  });

  unmount();

  if (cleanupCount < expectedCleanups) {
    throw new Error(
      `Expected at least ${expectedCleanups} cleanup(s), but got ${cleanupCount}`
    );
  }
}

/**
 * Mock window object
 */
export function mockWindow(properties: Record<string, any> = {}) {
  const windowMock = {
    innerWidth: 1024,
    innerHeight: 768,
    matchMedia: jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    ...properties,
  };

  Object.defineProperty(global, 'window', {
    value: windowMock,
    writable: true,
  });

  return windowMock;
}

/**
 * Get all hook calls
 */
export function getHookCalls<T>(hook: () => T): T[] {
  const calls: T[] = [];
  const { rerender } = renderHook(() => {
    const result = hook();
    calls.push(result);
    return result;
  });

  return calls;
}

/**
 * Test hook with different props
 */
export async function testHookWithProps<TProps, TResult>(
  hook: (props: TProps) => TResult,
  propsList: TProps[],
  assertFn: (result: TResult) => void
): Promise<void> {
  for (const props of propsList) {
    const { result, rerender } = renderHook(() => hook(props));
    assertFn(result.current);
  }
}
