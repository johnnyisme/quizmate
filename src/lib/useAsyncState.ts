import { useState, useCallback } from 'react';

/**
 * Simple utility hook for managing async state
 * Returns: [value, loading, error, setValue, setError]
 */
export function useAsyncState<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setValue(initialValue);
    setLoading(false);
    setError(null);
  }, [initialValue]);

  return {
    value,
    setValue,
    loading,
    setLoading,
    error,
    setError,
    reset,
  };
}
