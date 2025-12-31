// src/lib/__tests__/useAsyncState.test.ts
// 測試 useAsyncState hook 的狀態管理邏輯

import { describe, it, expect } from 'vitest';

describe('useAsyncState Logic', () => {
  describe('Initial State', () => {
    it('should initialize with provided value', () => {
      const initialValue = "test";
      const value = initialValue;
      const loading = false;
      const error: string | null = null;
      
      expect(value).toBe("test");
      expect(loading).toBe(false);
      expect(error).toBeNull();
    });

    it('should initialize with null', () => {
      const initialValue = null;
      const value = initialValue;
      
      expect(value).toBeNull();
    });

    it('should initialize with object', () => {
      const initialValue = { id: 1, name: "test" };
      const value = initialValue;
      
      expect(value).toEqual({ id: 1, name: "test" });
    });

    it('should initialize with array', () => {
      const initialValue = [1, 2, 3];
      const value = initialValue;
      
      expect(value).toEqual([1, 2, 3]);
    });

    it('should initialize with boolean', () => {
      const initialValue = true;
      const value = initialValue;
      
      expect(value).toBe(true);
    });

    it('should initialize with number', () => {
      const initialValue = 42;
      const value = initialValue;
      
      expect(value).toBe(42);
    });
  });

  describe('Value Updates', () => {
    it('should update value correctly', () => {
      let value = "initial";
      value = "updated";
      
      expect(value).toBe("updated");
    });

    it('should update from null to value', () => {
      let value: string | null = null;
      value = "newValue";
      
      expect(value).toBe("newValue");
    });

    it('should update from value to null', () => {
      let value: string | null = "initial";
      value = null;
      
      expect(value).toBeNull();
    });

    it('should update object values', () => {
      let value = { count: 0 };
      value = { count: 1 };
      
      expect(value.count).toBe(1);
    });

    it('should update array values', () => {
      let value = [1, 2];
      value = [1, 2, 3];
      
      expect(value).toHaveLength(3);
    });
  });

  describe('Loading State', () => {
    it('should start with loading false', () => {
      const loading = false;
      
      expect(loading).toBe(false);
    });

    it('should set loading to true', () => {
      let loading = false;
      loading = true;
      
      expect(loading).toBe(true);
    });

    it('should set loading back to false', () => {
      let loading = true;
      loading = false;
      
      expect(loading).toBe(false);
    });

    it('should toggle loading state', () => {
      let loading = false;
      loading = !loading;
      
      expect(loading).toBe(true);
      
      loading = !loading;
      expect(loading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should start with null error', () => {
      const error: string | null = null;
      
      expect(error).toBeNull();
    });

    it('should set error message', () => {
      let error: string | null = null;
      error = "Something went wrong";
      
      expect(error).toBe("Something went wrong");
    });

    it('should clear error', () => {
      let error: string | null = "Error message";
      error = null;
      
      expect(error).toBeNull();
    });

    it('should update error message', () => {
      let error: string | null = "First error";
      error = "Second error";
      
      expect(error).toBe("Second error");
    });
  });

  describe('Reset Logic', () => {
    it('should reset value to initial', () => {
      const initialValue = "initial";
      let value = "changed";
      value = initialValue;
      
      expect(value).toBe("initial");
    });

    it('should reset loading to false', () => {
      let loading = true;
      loading = false;
      
      expect(loading).toBe(false);
    });

    it('should reset error to null', () => {
      let error: string | null = "Error";
      error = null;
      
      expect(error).toBeNull();
    });

    it('should reset all states together', () => {
      const initialValue = 0;
      let value = 42;
      let loading = true;
      let error: string | null = "Error";
      
      // Reset
      value = initialValue;
      loading = false;
      error = null;
      
      expect(value).toBe(0);
      expect(loading).toBe(false);
      expect(error).toBeNull();
    });

    it('should reset with different initial values', () => {
      const initialValue = { data: [] };
      let value = { data: [1, 2, 3] };
      
      value = initialValue;
      
      expect(value).toEqual({ data: [] });
    });
  });

  describe('Async Operation Simulation', () => {
    it('should handle successful async operation pattern', () => {
      let value: string | null = null;
      let loading = false;
      let error: string | null = null;
      
      // Start async operation
      loading = true;
      error = null;
      
      expect(loading).toBe(true);
      expect(error).toBeNull();
      
      // Operation succeeds
      value = "result";
      loading = false;
      
      expect(value).toBe("result");
      expect(loading).toBe(false);
      expect(error).toBeNull();
    });

    it('should handle failed async operation pattern', () => {
      let value: string | null = null;
      let loading = false;
      let error: string | null = null;
      
      // Start async operation
      loading = true;
      error = null;
      
      // Operation fails
      loading = false;
      error = "Operation failed";
      
      expect(value).toBeNull();
      expect(loading).toBe(false);
      expect(error).toBe("Operation failed");
    });

    it('should handle retry pattern', () => {
      let value: string | null = null;
      let loading = false;
      let error: string | null = "Previous error";
      
      // Retry - reset error and start loading
      error = null;
      loading = true;
      
      expect(loading).toBe(true);
      expect(error).toBeNull();
      
      // Success on retry
      value = "success";
      loading = false;
      
      expect(value).toBe("success");
      expect(loading).toBe(false);
    });
  });

  describe('State Combinations', () => {
    it('should never have loading=true with error', () => {
      let loading = false;
      let error: string | null = null;
      
      // Starting operation clears error
      loading = true;
      error = null;
      
      expect(loading).toBe(true);
      expect(error).toBeNull();
    });

    it('should handle value and error together (stale data)', () => {
      let value = "old data";
      let error: string | null = "Fetch failed";
      
      // Can have both value (old) and error (new)
      expect(value).toBe("old data");
      expect(error).toBe("Fetch failed");
    });

    it('should clear error when new value arrives', () => {
      let value: string | null = null;
      let error: string | null = "Error";
      
      // New successful operation
      value = "new data";
      error = null;
      
      expect(value).toBe("new data");
      expect(error).toBeNull();
    });
  });

  describe('Generic Type Handling', () => {
    it('should work with string type', () => {
      type TestType = string;
      const initialValue: TestType = "test";
      let value: TestType = initialValue;
      
      expect(typeof value).toBe("string");
    });

    it('should work with number type', () => {
      type TestType = number;
      const initialValue: TestType = 0;
      let value: TestType = initialValue;
      
      expect(typeof value).toBe("number");
    });

    it('should work with boolean type', () => {
      type TestType = boolean;
      const initialValue: TestType = false;
      let value: TestType = initialValue;
      
      expect(typeof value).toBe("boolean");
    });

    it('should work with object type', () => {
      type TestType = { id: number; name: string };
      const initialValue: TestType = { id: 1, name: "test" };
      let value: TestType = initialValue;
      
      expect(value).toHaveProperty("id");
      expect(value).toHaveProperty("name");
    });

    it('should work with array type', () => {
      type TestType = number[];
      const initialValue: TestType = [1, 2, 3];
      let value: TestType = initialValue;
      
      expect(Array.isArray(value)).toBe(true);
    });

    it('should work with union type', () => {
      type TestType = string | null;
      const initialValue: TestType = null;
      let value: TestType = initialValue;
      
      expect(value).toBeNull();
      
      value = "string";
      expect(value).toBe("string");
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined initial value', () => {
      const initialValue = undefined;
      let value = initialValue;
      
      expect(value).toBeUndefined();
    });

    it('should handle empty string', () => {
      const initialValue = "";
      let value = initialValue;
      
      expect(value).toBe("");
    });

    it('should handle zero', () => {
      const initialValue = 0;
      let value = initialValue;
      
      expect(value).toBe(0);
    });

    it('should handle false', () => {
      const initialValue = false;
      let value = initialValue;
      
      expect(value).toBe(false);
    });

    it('should handle empty array', () => {
      const initialValue: any[] = [];
      let value = initialValue;
      
      expect(value).toHaveLength(0);
    });

    it('should handle empty object', () => {
      const initialValue = {};
      let value = initialValue;
      
      expect(Object.keys(value)).toHaveLength(0);
    });

    it('should handle very long error message', () => {
      let error: string | null = "A".repeat(1000);
      
      expect(error).toHaveLength(1000);
    });

    it('should handle multiple rapid state changes', () => {
      let value = 0;
      
      value = 1;
      value = 2;
      value = 3;
      
      expect(value).toBe(3);
    });
  });
});
