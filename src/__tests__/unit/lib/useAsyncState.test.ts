import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncState } from '@/lib/useAsyncState';

describe('useAsyncState', () => {
  describe('initialization', () => {
    it('should initialize with provided value', () => {
      const { result } = renderHook(() => useAsyncState('initial'));
      
      expect(result.current.value).toBe('initial');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with object value', () => {
      const initialObj = { id: 1, name: 'test' };
      const { result } = renderHook(() => useAsyncState(initialObj));
      
      expect(result.current.value).toEqual(initialObj);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with null value', () => {
      const { result } = renderHook(() => useAsyncState<string | null>(null));
      
      expect(result.current.value).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with undefined value', () => {
      const { result } = renderHook(() => useAsyncState<string | undefined>(undefined));
      
      expect(result.current.value).toBeUndefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with array value', () => {
      const initialArray = [1, 2, 3];
      const { result } = renderHook(() => useAsyncState(initialArray));
      
      expect(result.current.value).toEqual(initialArray);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('value management', () => {
    it('should update value', () => {
      const { result } = renderHook(() => useAsyncState('initial'));
      
      act(() => {
        result.current.setValue('updated');
      });
      
      expect(result.current.value).toBe('updated');
    });

    it('should update value multiple times', () => {
      const { result } = renderHook(() => useAsyncState(0));
      
      act(() => {
        result.current.setValue(1);
      });
      expect(result.current.value).toBe(1);
      
      act(() => {
        result.current.setValue(2);
      });
      expect(result.current.value).toBe(2);
      
      act(() => {
        result.current.setValue(3);
      });
      expect(result.current.value).toBe(3);
    });

    it('should update value to same value', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setValue('test');
      });
      
      expect(result.current.value).toBe('test');
    });
  });

  describe('loading state management', () => {
    it('should set loading to true', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setLoading(true);
      });
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.loading).toBe(false);
    });

    it('should toggle loading state', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.loading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      expect(result.current.loading).toBe(false);
      
      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.loading).toBe(true);
    });
  });

  describe('error management', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setError('Something went wrong');
      });
      
      expect(result.current.error).toBe('Something went wrong');
    });

    it('should clear error by setting to null', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setError('Error');
      });
      expect(result.current.error).toBe('Error');
      
      act(() => {
        result.current.setError(null);
      });
      expect(result.current.error).toBeNull();
    });

    it('should update error message', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setError('First error');
      });
      expect(result.current.error).toBe('First error');
      
      act(() => {
        result.current.setError('Second error');
      });
      expect(result.current.error).toBe('Second error');
    });
  });

  describe('reset functionality', () => {
    it('should reset to initial value', () => {
      const { result } = renderHook(() => useAsyncState('initial'));
      
      act(() => {
        result.current.setValue('changed');
        result.current.setLoading(true);
        result.current.setError('error');
      });
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.value).toBe('initial');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset loading state', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.loading).toBe(true);
      
      act(() => {
        result.current.reset();
      });
      expect(result.current.loading).toBe(false);
    });

    it('should reset error state', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setError('Error message');
      });
      expect(result.current.error).toBe('Error message');
      
      act(() => {
        result.current.reset();
      });
      expect(result.current.error).toBeNull();
    });

    it('should reset multiple times', () => {
      const { result } = renderHook(() => useAsyncState(0));
      
      act(() => {
        result.current.setValue(1);
        result.current.reset();
      });
      expect(result.current.value).toBe(0);
      
      act(() => {
        result.current.setValue(2);
        result.current.reset();
      });
      expect(result.current.value).toBe(0);
    });

    it('should reset to initial object value', () => {
      const initialObj = { id: 1, name: 'test' };
      const { result } = renderHook(() => useAsyncState(initialObj));
      
      act(() => {
        result.current.setValue({ id: 2, name: 'changed' });
      });
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.value).toEqual(initialObj);
    });
  });

  describe('combined state management', () => {
    it('should handle async operation simulation', () => {
      const { result } = renderHook(() => useAsyncState<string | null>(null));
      
      // Start loading
      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.loading).toBe(true);
      expect(result.current.value).toBeNull();
      expect(result.current.error).toBeNull();
      
      // Success
      act(() => {
        result.current.setValue('data');
        result.current.setLoading(false);
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.value).toBe('data');
      expect(result.current.error).toBeNull();
    });

    it('should handle async operation with error', () => {
      const { result } = renderHook(() => useAsyncState<string | null>(null));
      
      // Start loading
      act(() => {
        result.current.setLoading(true);
      });
      
      // Error
      act(() => {
        result.current.setError('Failed to fetch');
        result.current.setLoading(false);
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.value).toBeNull();
      expect(result.current.error).toBe('Failed to fetch');
    });

    it('should handle retry after error', () => {
      const { result } = renderHook(() => useAsyncState<string | null>(null));
      
      // First attempt fails
      act(() => {
        result.current.setLoading(true);
      });
      act(() => {
        result.current.setError('Network error');
        result.current.setLoading(false);
      });
      
      expect(result.current.error).toBe('Network error');
      
      // Retry - clear error and load again
      act(() => {
        result.current.setError(null);
        result.current.setLoading(true);
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(true);
      
      // Success
      act(() => {
        result.current.setValue('data');
        result.current.setLoading(false);
      });
      
      expect(result.current.value).toBe('data');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should maintain independent state variables', () => {
      const { result } = renderHook(() => useAsyncState('test'));
      
      act(() => {
        result.current.setValue('new value');
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      
      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.value).toBe('new value');
      expect(result.current.error).toBeNull();
      
      act(() => {
        result.current.setError('error');
      });
      expect(result.current.value).toBe('new value');
      expect(result.current.loading).toBe(true);
    });
  });

  describe('type safety', () => {
    it('should work with string type', () => {
      const { result } = renderHook(() => useAsyncState<string>('test'));
      
      act(() => {
        result.current.setValue('new string');
      });
      
      expect(result.current.value).toBe('new string');
    });

    it('should work with number type', () => {
      const { result } = renderHook(() => useAsyncState<number>(42));
      
      act(() => {
        result.current.setValue(100);
      });
      
      expect(result.current.value).toBe(100);
    });

    it('should work with boolean type', () => {
      const { result } = renderHook(() => useAsyncState<boolean>(false));
      
      act(() => {
        result.current.setValue(true);
      });
      
      expect(result.current.value).toBe(true);
    });

    it('should work with complex object type', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }
      
      const initialUser: User = { id: 1, name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useAsyncState<User>(initialUser));
      
      act(() => {
        result.current.setValue({ id: 2, name: 'Jane', email: 'jane@example.com' });
      });
      
      expect(result.current.value).toEqual({ id: 2, name: 'Jane', email: 'jane@example.com' });
    });
  });

  describe('initial value dependency', () => {
    it('should use updated initial value when reset is called', () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useAsyncState(initialValue),
        { initialProps: { initialValue: 'first' } }
      );
      
      act(() => {
        result.current.setValue('changed');
      });
      expect(result.current.value).toBe('changed');
      
      // Change initial value prop
      rerender({ initialValue: 'second' });
      
      // Reset should use new initial value
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.value).toBe('second');
    });
  });
});
