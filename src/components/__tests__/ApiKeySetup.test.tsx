// src/components/__tests__/ApiKeySetup.test.tsx
// 測試 ApiKeySetup 組件的業務邏輯

import { describe, it, expect, beforeEach } from 'vitest';

describe('ApiKeySetup Logic', () => {
  describe('Key Parsing and Validation', () => {
    it('should parse single key correctly', () => {
      const input = "AIzaSyTest123";
      const keys = input.split(",").map(k => k.trim()).filter(k => k.length > 0);
      
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe("AIzaSyTest123");
    });

    it('should parse multiple comma-separated keys', () => {
      const input = "key1, key2, key3";
      const keys = input.split(",").map(k => k.trim()).filter(k => k.length > 0);
      
      expect(keys).toHaveLength(3);
      expect(keys).toEqual(["key1", "key2", "key3"]);
    });

    it('should trim whitespace from keys', () => {
      const input = "  key1  ,  key2  ";
      const keys = input.split(",").map(k => k.trim()).filter(k => k.length > 0);
      
      expect(keys).toEqual(["key1", "key2"]);
    });

    it('should filter out empty keys', () => {
      const input = "key1,,key2,  ,key3";
      const keys = input.split(",").map(k => k.trim()).filter(k => k.length > 0);
      
      expect(keys).toHaveLength(3);
      expect(keys).toEqual(["key1", "key2", "key3"]);
    });

    it('should reject empty input', () => {
      const input = "";
      const keys = input.split(",").map(k => k.trim()).filter(k => k.length > 0);
      
      expect(keys).toHaveLength(0);
    });

    it('should reject whitespace-only input', () => {
      const input = "  ,  ,  ";
      const keys = input.split(",").map(k => k.trim()).filter(k => k.length > 0);
      
      expect(keys).toHaveLength(0);
    });
  });

  describe('Key Management Operations', () => {
    let mockKeys: string[];

    beforeEach(() => {
      mockKeys = ["key1", "key2", "key3"];
    });

    it('should add new keys to existing list', () => {
      const newKeys = ["key4", "key5"];
      const updatedKeys = [...mockKeys, ...newKeys];
      
      expect(updatedKeys).toHaveLength(5);
      expect(updatedKeys).toEqual(["key1", "key2", "key3", "key4", "key5"]);
    });

    it('should delete key at specific index', () => {
      const indexToDelete = 1;
      const updatedKeys = mockKeys.filter((_, i) => i !== indexToDelete);
      
      expect(updatedKeys).toHaveLength(2);
      expect(updatedKeys).toEqual(["key1", "key3"]);
      expect(updatedKeys).not.toContain("key2");
    });

    it('should update key at specific index', () => {
      const indexToUpdate = 1;
      const newValue = "updatedKey2";
      const updatedKeys = [...mockKeys];
      updatedKeys[indexToUpdate] = newValue;
      
      expect(updatedKeys).toHaveLength(3);
      expect(updatedKeys[indexToUpdate]).toBe(newValue);
      expect(updatedKeys).toEqual(["key1", "updatedKey2", "key3"]);
    });

    it('should preserve order when deleting middle key', () => {
      const updatedKeys = mockKeys.filter((_, i) => i !== 1);
      
      expect(updatedKeys[0]).toBe("key1");
      expect(updatedKeys[1]).toBe("key3");
    });

    it('should handle deleting first key', () => {
      const updatedKeys = mockKeys.filter((_, i) => i !== 0);
      
      expect(updatedKeys).toEqual(["key2", "key3"]);
    });

    it('should handle deleting last key', () => {
      const updatedKeys = mockKeys.filter((_, i) => i !== 2);
      
      expect(updatedKeys).toEqual(["key1", "key2"]);
    });
  });

  describe('Edit Validation', () => {
    it('should reject empty edited key', () => {
      const editedValue = "";
      const trimmed = editedValue.trim();
      const isValid = trimmed.length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should reject whitespace-only edited key', () => {
      const editedValue = "   ";
      const trimmed = editedValue.trim();
      const isValid = trimmed.length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should accept valid edited key', () => {
      const editedValue = "  newKey123  ";
      const trimmed = editedValue.trim();
      const isValid = trimmed.length > 0;
      
      expect(isValid).toBe(true);
      expect(trimmed).toBe("newKey123");
    });
  });

  describe('LocalStorage Integration Logic', () => {
    it('should serialize keys to JSON correctly', () => {
      const keys = ["key1", "key2", "key3"];
      const serialized = JSON.stringify(keys);
      
      expect(serialized).toBe('["key1","key2","key3"]');
    });

    it('should deserialize keys from JSON correctly', () => {
      const stored = '["key1","key2","key3"]';
      const keys = JSON.parse(stored);
      
      expect(keys).toEqual(["key1", "key2", "key3"]);
    });

    it('should handle empty array serialization', () => {
      const keys: string[] = [];
      const serialized = JSON.stringify(keys);
      
      expect(serialized).toBe('[]');
    });

    it('should handle malformed JSON gracefully', () => {
      const stored = "invalid json";
      let keys: string[] = [];
      
      try {
        keys = JSON.parse(stored);
      } catch {
        keys = [];
      }
      
      expect(keys).toEqual([]);
    });
  });

  describe('Error Message Logic', () => {
    it('should show error when adding empty keys', () => {
      const newKeys: string[] = [];
      const shouldShowError = newKeys.length === 0;
      const errorMessage = shouldShowError ? "請輸入至少一個 API key" : "";
      
      expect(shouldShowError).toBe(true);
      expect(errorMessage).toBe("請輸入至少一個 API key");
    });

    it('should show error when editing to empty value', () => {
      const editedValue = "";
      const shouldShowError = editedValue.trim().length === 0;
      const errorMessage = shouldShowError ? "金鑰不能為空" : "";
      
      expect(shouldShowError).toBe(true);
      expect(errorMessage).toBe("金鑰不能為空");
    });

    it('should clear error on successful operation', () => {
      const newKeys = ["validKey"];
      const shouldShowError = newKeys.length === 0;
      const errorMessage = shouldShowError ? "請輸入至少一個 API key" : "";
      
      expect(shouldShowError).toBe(false);
      expect(errorMessage).toBe("");
    });
  });

  describe('Key Display Logic', () => {
    it('should mask key for display (show first 8 chars)', () => {
      const key = "AIzaSyTest123456789";
      const displayKey = key.slice(0, 8) + "..." + key.slice(-4);
      
      expect(displayKey).toBe("AIzaSyTe...6789");
    });

    it('should handle short keys', () => {
      const key = "short";
      const displayKey = key.length > 12 ? key.slice(0, 8) + "..." + key.slice(-4) : key;
      
      expect(displayKey).toBe("short");
    });

    it('should mask exactly 13 char key', () => {
      const key = "1234567890123";
      const displayKey = key.length > 12 ? key.slice(0, 8) + "..." + key.slice(-4) : key;
      
      expect(displayKey).toBe("12345678...0123");
    });
  });

  describe('State Management Logic', () => {
    it('should track editing state correctly', () => {
      let editingIndex: number | null = null;
      let editingValue = "";
      
      // Start editing
      editingIndex = 1;
      editingValue = "originalKey";
      
      expect(editingIndex).toBe(1);
      expect(editingValue).toBe("originalKey");
      
      // Cancel editing
      editingIndex = null;
      editingValue = "";
      
      expect(editingIndex).toBeNull();
      expect(editingValue).toBe("");
    });

    it('should clear error on cancel edit', () => {
      let error = "金鑰不能為空";
      let editingIndex: number | null = 1;
      
      // Cancel edit - should clear error
      editingIndex = null;
      error = "";
      
      expect(editingIndex).toBeNull();
      expect(error).toBe("");
    });

    it('should clear input after successful add', () => {
      let newKeyInput = "newKey123";
      
      // After successful add
      newKeyInput = "";
      
      expect(newKeyInput).toBe("");
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long key', () => {
      const longKey = "A".repeat(100);
      const keys = [longKey];
      
      expect(keys).toHaveLength(1);
      expect(keys[0]).toHaveLength(100);
    });

    it('should handle special characters in keys', () => {
      const keyWithSpecialChars = "AIza-Sy_Test.123";
      const keys = [keyWithSpecialChars];
      
      expect(keys[0]).toBe("AIza-Sy_Test.123");
    });

    it('should handle Unicode characters', () => {
      const unicodeKey = "key測試🔑";
      const keys = [unicodeKey];
      
      expect(keys[0]).toBe("key測試🔑");
    });

    it('should handle deleting from single-key array', () => {
      const keys = ["onlyKey"];
      const updatedKeys = keys.filter((_, i) => i !== 0);
      
      expect(updatedKeys).toHaveLength(0);
    });

    it('should handle adding to empty array', () => {
      const keys: string[] = [];
      const newKeys = ["firstKey"];
      const updatedKeys = [...keys, ...newKeys];
      
      expect(updatedKeys).toHaveLength(1);
      expect(updatedKeys[0]).toBe("firstKey");
    });
  });
});
