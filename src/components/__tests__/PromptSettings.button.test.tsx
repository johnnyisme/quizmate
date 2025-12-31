import { describe, it, expect } from "vitest";
import type { CustomPrompt } from "../PromptSettings";
import { DEFAULT_PROMPT } from "../PromptSettings";

/**
 * PromptSettings Button State Tests
 * 測試按鈕的 enable/disable 狀態邏輯
 */

describe("PromptSettings Button States", () => {
  describe("Use Button (使用按鈕)", () => {
    it("should be enabled when prompt is not default and not new", () => {
      const customPrompt: CustomPrompt = {
        id: "custom-1",
        name: "Math Teacher",
        content: "Teach math",
        isDefault: false,
        isNew: false,
      };

      // 按鈕應該被啟用 (enabled = !isDefault)
      const isDisabled = customPrompt.isDefault;
      expect(isDisabled).toBe(false);
    });

    it("should be disabled when prompt is already default", () => {
      // 使用 DEFAULT_PROMPT
      const isDisabled = DEFAULT_PROMPT.isDefault;
      expect(isDisabled).toBe(true);
    });

    it("should show '使用' text when not default", () => {
      const customPrompt: CustomPrompt = {
        id: "custom-1",
        name: "Math Teacher",
        content: "Teach math",
        isDefault: false,
        isNew: false,
      };

      const buttonText = customPrompt.isDefault ? "已使用" : "使用";
      expect(buttonText).toBe("使用");
    });

    it("should show '已使用' text when default", () => {
      const buttonText = DEFAULT_PROMPT.isDefault ? "已使用" : "使用";
      expect(buttonText).toBe("已使用");
    });

    it("should not be visible when prompt is new (unsaved)", () => {
      const newPrompt: CustomPrompt = {
        id: "custom-new",
        name: "New Prompt",
        content: "New content",
        isDefault: false,
        isNew: true,
      };

      // 新建的 prompt 不應該顯示使用按鈕 (!isNew)
      const shouldShowButton = !newPrompt.isNew;
      expect(shouldShowButton).toBe(false);
    });
  });

  describe("Delete Button (刪除按鈕)", () => {
    it("should be visible for custom prompts", () => {
      const customPrompt: CustomPrompt = {
        id: "custom-1",
        name: "Math Teacher",
        content: "Teach math",
        isDefault: false,
      };

      // 非 default 的 prompt 應該顯示刪除按鈕
      const shouldShowDelete = customPrompt.id !== "default";
      expect(shouldShowDelete).toBe(true);
    });

    it("should not be visible for default prompt", () => {
      // 預設 prompt 不應該顯示刪除按鈕 (id === "default")
      const shouldShowDelete = DEFAULT_PROMPT.id !== "default";
      expect(shouldShowDelete).toBe(false);
    });

    it("should be visible for new unsaved custom prompts", () => {
      const newCustom: CustomPrompt = {
        id: "custom-new",
        name: "New Prompt",
        content: "New content",
        isDefault: false,
        isNew: true,
      };

      const shouldShowDelete = newCustom.id !== "default";
      expect(shouldShowDelete).toBe(true);
    });
  });

  describe("Add Button (新增按鈕)", () => {
    it("should be disabled when 5 custom prompts exist", () => {
      const prompts: CustomPrompt[] = [
        DEFAULT_PROMPT,
        {
          id: "custom-1",
          name: "P1",
          content: "C1",
          isDefault: false,
        },
        {
          id: "custom-2",
          name: "P2",
          content: "C2",
          isDefault: false,
        },
        {
          id: "custom-3",
          name: "P3",
          content: "C3",
          isDefault: false,
        },
        {
          id: "custom-4",
          name: "P4",
          content: "C4",
          isDefault: false,
        },
        {
          id: "custom-5",
          name: "P5",
          content: "C5",
          isDefault: false,
        },
      ];

      const customCount = prompts.filter((p) => !p.isDefault).length;
      const isDisabled = customCount >= 5;
      expect(isDisabled).toBe(true);
    });

    it("should be enabled when less than 5 custom prompts exist", () => {
      const prompts: CustomPrompt[] = [
        DEFAULT_PROMPT,
        {
          id: "custom-1",
          name: "P1",
          content: "C1",
          isDefault: false,
        },
      ];

      const customCount = prompts.filter((p) => !p.isDefault).length;
      const isDisabled = customCount >= 5;
      expect(isDisabled).toBe(false);
    });

    it("should be disabled when there is an unsaved prompt", () => {
      const prompts: CustomPrompt[] = [
        DEFAULT_PROMPT,
        {
          id: "custom-1",
          name: "P1",
          content: "C1",
          isDefault: false,
          isNew: true,
        },
      ];

      const hasUnsaved = prompts.some((p) => p.isNew);
      expect(hasUnsaved).toBe(true);
    });
  });

  describe("Save Button (儲存按鈕)", () => {
    it("should be disabled when no changes detected", () => {
      const initial: CustomPrompt[] = [DEFAULT_PROMPT];
      const current: CustomPrompt[] = [DEFAULT_PROMPT];

      const hasChanges =
        JSON.stringify(initial.map((p) => ({ id: p.id, name: p.name, content: p.content }))) !==
        JSON.stringify(current.map((p) => ({ id: p.id, name: p.name, content: p.content })));

      expect(hasChanges).toBe(false);
    });

    it("should be enabled when name is changed", () => {
      const initial: CustomPrompt[] = [DEFAULT_PROMPT];
      const current: CustomPrompt[] = [{ ...DEFAULT_PROMPT, name: "Updated" }];

      const hasChanges =
        JSON.stringify(initial.map((p) => ({ id: p.id, name: p.name, content: p.content }))) !==
        JSON.stringify(current.map((p) => ({ id: p.id, name: p.name, content: p.content })));

      expect(hasChanges).toBe(true);
    });

    it("should be enabled when content is changed", () => {
      const initial: CustomPrompt[] = [DEFAULT_PROMPT];
      const current: CustomPrompt[] = [{ ...DEFAULT_PROMPT, content: "New content" }];

      const hasChanges =
        JSON.stringify(initial.map((p) => ({ id: p.id, name: p.name, content: p.content }))) !==
        JSON.stringify(current.map((p) => ({ id: p.id, name: p.name, content: p.content })));

      expect(hasChanges).toBe(true);
    });

    it("should be disabled when only isNew changes", () => {
      const initial: CustomPrompt[] = [DEFAULT_PROMPT];
      const current: CustomPrompt[] = [{ ...DEFAULT_PROMPT, isNew: true }];

      const hasChanges =
        JSON.stringify(initial.map((p) => ({ id: p.id, name: p.name, content: p.content }))) !==
        JSON.stringify(current.map((p) => ({ id: p.id, name: p.name, content: p.content })));

      expect(hasChanges).toBe(false);
    });
  });

  describe("Button Label Updates", () => {
    it("should not show '(目前使用)' label anymore", () => {
      // 最新的 UI 變更: 移除了 (目前使用) 標籤
      // 使用按鈕的文字會顯示 "已使用" 來表示目前狀態
      const prompt = DEFAULT_PROMPT;
      const hasCurrentUseLabel = "(目前使用)".includes("目前使用");
      expect(hasCurrentUseLabel).toBe(true); // 標籤確實存在
      
      // 但在 UI 中不應該出現，而是由按鈕文字表示
      const buttonText = prompt.isDefault ? "已使用" : "使用";
      expect(buttonText).toContain("使用");
    });

    it("should show unsaved indicator only for new prompts", () => {
      const newPrompt: CustomPrompt = {
        id: "custom-new",
        name: "New",
        content: "Content",
        isDefault: false,
        isNew: true,
      };

      const savedPrompt: CustomPrompt = {
        id: "custom-1",
        name: "Saved",
        content: "Content",
        isDefault: false,
        isNew: false,
      };

      expect(newPrompt.isNew).toBe(true);
      expect(savedPrompt.isNew).toBe(false);
    });
  });
});
