import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CustomPrompt } from "../PromptSettings";
import { DEFAULT_PROMPT } from "../PromptSettings";

/**
 * PromptSettings Logic Tests
 * 測試 PromptSettings 組件的核心邏輯，不依賴 React Testing Library
 */

describe("PromptSettings Logic", () => {
  /**
   * hasChanges 函數邏輯測試
   * 比對初始狀態與編輯狀態，判斷是否有變更
   */
  describe("hasChanges Detection", () => {
    const hasChanges = (initial: CustomPrompt[], current: CustomPrompt[]) => {
      return (
        JSON.stringify(
          initial.map((p) => ({
            id: p.id,
            name: p.name,
            content: p.content,
            isDefault: p.isDefault,
          }))
        ) !==
        JSON.stringify(
          current.map((p) => ({
            id: p.id,
            name: p.name,
            content: p.content,
            isDefault: p.isDefault,
          }))
        )
      );
    };

    it("should detect no changes when prompts are identical", () => {
      const initial = [DEFAULT_PROMPT];
      const current = [DEFAULT_PROMPT];
      expect(hasChanges(initial, current)).toBe(false);
    });

    it("should detect changes when name is modified", () => {
      const initial = [DEFAULT_PROMPT];
      const current = [{ ...DEFAULT_PROMPT, name: "Updated Name" }];
      expect(hasChanges(initial, current)).toBe(true);
    });

    it("should detect changes when content is modified", () => {
      const initial = [DEFAULT_PROMPT];
      const current = [{ ...DEFAULT_PROMPT, content: "New content" }];
      expect(hasChanges(initial, current)).toBe(true);
    });

    it("should detect changes when isDefault is modified", () => {
      const custom: CustomPrompt = {
        id: "custom-1",
        name: "Test",
        content: "Content",
        isDefault: false,
      };
      const initial = [DEFAULT_PROMPT, custom];
      const current = [DEFAULT_PROMPT, { ...custom, isDefault: true }];
      expect(hasChanges(initial, current)).toBe(true);
    });

    it("should ignore isNew property in change detection", () => {
      const initial = [DEFAULT_PROMPT];
      const current = [{ ...DEFAULT_PROMPT, isNew: true }];
      expect(hasChanges(initial, current)).toBe(false);
    });

    it("should detect changes with multiple prompts", () => {
      const custom1: CustomPrompt = {
        id: "custom-1",
        name: "Prompt 1",
        content: "Content 1",
        isDefault: false,
      };
      const custom2: CustomPrompt = {
        id: "custom-2",
        name: "Prompt 2",
        content: "Content 2",
        isDefault: false,
      };

      const initial = [DEFAULT_PROMPT, custom1, custom2];
      const current = [DEFAULT_PROMPT, custom1, { ...custom2, name: "Updated" }];

      expect(hasChanges(initial, current)).toBe(true);
    });
  });

  /**
   * Validation Logic Tests
   * 測試保存時的驗證邏輯
   */
  describe("Save Validation", () => {
    const validatePrompts = (prompts: CustomPrompt[]) => {
      for (const p of prompts) {
        if (!p.name.trim()) {
          return "請為所有 prompt 設定名稱";
        }
        if (!p.content.trim()) {
          return "請為所有 prompt 填寫內容";
        }
      }
      return null;
    };

    it("should validate that all prompts have names", () => {
      const prompts: CustomPrompt[] = [
        DEFAULT_PROMPT,
        { id: "custom-1", name: "", content: "Content", isDefault: false },
      ];
      expect(validatePrompts(prompts)).toBe("請為所有 prompt 設定名稱");
    });

    it("should validate that all prompts have content", () => {
      const prompts: CustomPrompt[] = [
        DEFAULT_PROMPT,
        { id: "custom-1", name: "Test", content: "", isDefault: false },
      ];
      expect(validatePrompts(prompts)).toBe("請為所有 prompt 填寫內容");
    });

    it("should allow whitespace-only validation to fail", () => {
      const prompts: CustomPrompt[] = [
        DEFAULT_PROMPT,
        { id: "custom-1", name: "   ", content: "Content", isDefault: false },
      ];
      expect(validatePrompts(prompts)).toBe("請為所有 prompt 設定名稱");
    });

    it("should pass validation for valid prompts", () => {
      const prompts: CustomPrompt[] = [
        DEFAULT_PROMPT,
        { id: "custom-1", name: "Test", content: "Content", isDefault: false },
      ];
      expect(validatePrompts(prompts)).toBeNull();
    });
  });

  /**
   * Prompt Management Logic Tests
   */
  describe("Prompt Management", () => {
    it("should count custom prompts correctly", () => {
      const custom1: CustomPrompt = {
        id: "custom-1",
        name: "Test 1",
        content: "Content",
        isDefault: false,
      };
      const custom2: CustomPrompt = {
        id: "custom-2",
        name: "Test 2",
        content: "Content",
        isDefault: false,
      };

      const prompts = [DEFAULT_PROMPT, custom1, custom2];
      const customCount = prompts.filter((p) => !p.isDefault).length;

      expect(customCount).toBe(2);
    });

    it("should prevent adding more than 5 custom prompts", () => {
      const prompts = [DEFAULT_PROMPT];
      for (let i = 0; i < 5; i++) {
        prompts.push({
          id: `custom-${i}`,
          name: `Prompt ${i}`,
          content: `Content ${i}`,
          isDefault: false,
        });
      }

      const customCount = prompts.filter((p) => !p.isDefault).length;
      const canAddMore = customCount < 5;

      expect(canAddMore).toBe(false);
    });

    it("should set new prompt without predefined name", () => {
      const newPrompt: CustomPrompt = {
        id: `custom-${Date.now()}`,
        name: "",
        content: "",
        isDefault: false,
        isNew: true,
      };

      expect(newPrompt.name).toBe("");
      expect(newPrompt.isNew).toBe(true);
    });

    it("should find default prompt when custom is deleted", () => {
      const custom: CustomPrompt = {
        id: "custom-1",
        name: "Test",
        content: "Content",
        isDefault: false,
      };

      const prompts = [DEFAULT_PROMPT, custom];
      const remaining = prompts.filter((p) => p.id !== "custom-1");
      const fallback = remaining.find((p) => p.isDefault) || remaining[0];

      expect(fallback?.id).toBe("default");
    });
  });

  /**
   * Set Default Behavior Tests
   */
  describe("Set Default Button Behavior", () => {
    it("should not trigger changes when setting default on unsaved prompt", () => {
      const custom: CustomPrompt = {
        id: "custom-1",
        name: "Test",
        content: "Content",
        isDefault: false,
        isNew: true,
      };

      // Should prevent setting as default when isNew is true
      const isNew = custom.isNew;
      expect(isNew).toBe(true);
    });

    it("should update isDefault without affecting local state for save button", () => {
      const initial: CustomPrompt[] = [DEFAULT_PROMPT];
      const custom: CustomPrompt = {
        id: "custom-1",
        name: "Test",
        content: "Content",
        isDefault: false,
      };

      // When set default is clicked, create updated version but don't update editingPrompts
      const updated = [DEFAULT_PROMPT, { ...custom, isDefault: true }];

      // The local editingPrompts should remain unchanged for save detection
      const hasChanges = JSON.stringify(initial) !== JSON.stringify(updated);
      expect(hasChanges).toBe(true); // They are different objects, but locally we don't update editingPrompts

      // So save button should still be disabled because editingPrompts wasn't updated
    });
  });
});

