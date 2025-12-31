import { describe, it, expect } from "vitest";

/**
 * Utility function: truncatePromptName
 * 根據語言自適應截斷 prompt 名稱
 * - 有中文字元 → 截斷到 4 字元
 * - 純英文/數字 → 截斷到 12 字元
 */
const truncatePromptName = (name: string) => {
  const hasChinese = /[\u4E00-\u9FFF]/.test(name);

  // 只要有中文字元就用短限制（中文字寬度大）；純英文/數字允許更長
  const maxLength = hasChinese ? 4 : 12;

  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
};

describe("truncatePromptName", () => {
  describe("Chinese characters", () => {
    it("should truncate Chinese names to 4 characters with ellipsis", () => {
      expect(truncatePromptName("中文提示詞")).toBe("中文提示...");
      expect(truncatePromptName("高中數學老師")).toBe("高中數學...");
      expect(truncatePromptName("物理")).toBe("物理");
      expect(truncatePromptName("化學解題")).toBe("化學解題");
    });

    it("should truncate mixed Chinese and English to 4 characters", () => {
      expect(truncatePromptName("中文English")).toBe("中文En...");
      expect(truncatePromptName("高中老師123456")).toBe("高中老師...");
      expect(truncatePromptName("TestA中文")).toBe("Test...");
    });

    it("should handle Chinese numbers", () => {
      expect(truncatePromptName("第一個提示詞")).toBe("第一個提...");
      expect(truncatePromptName("一二三四五")).toBe("一二三四...");
    });
  });

  describe("English characters", () => {
    it("should allow up to 12 characters for English names", () => {
      expect(truncatePromptName("MyPrompt")).toBe("MyPrompt");
      expect(truncatePromptName("EnglishTeacher")).toBe("EnglishTeach...");
      expect(truncatePromptName("Math")).toBe("Math");
      expect(truncatePromptName("QuizMateHelper")).toBe("QuizMateHelp...");
    });

    it("should truncate long English names at 12 characters", () => {
      expect(truncatePromptName("VeryLongEnglishPromptName")).toBe("VeryLongEngl...");
      expect(truncatePromptName("1234567890123")).toBe("123456789012...");
    });

    it("should handle numbers correctly", () => {
      expect(truncatePromptName("Prompt123")).toBe("Prompt123");
      expect(truncatePromptName("12345678901234")).toBe("123456789012...");
      expect(truncatePromptName("A1B2C3D4E5F6G7")).toBe("A1B2C3D4E5F6...");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty strings", () => {
      expect(truncatePromptName("")).toBe("");
    });

    it("should handle exactly 4 character Chinese names", () => {
      expect(truncatePromptName("中文提示")).toBe("中文提示");
    });

    it("should handle exactly 12 character English names", () => {
      expect(truncatePromptName("123456789012")).toBe("123456789012");
    });

    it("should handle single character", () => {
      expect(truncatePromptName("A")).toBe("A");
      expect(truncatePromptName("中")).toBe("中");
    });

    it("should handle special characters", () => {
      expect(truncatePromptName("Test-Prompt")).toBe("Test-Prompt");
      expect(truncatePromptName("Prompt_v2_Final")).toBe("Prompt_v2_Fi...");
      expect(truncatePromptName("中文-English")).toBe("中文-E...");
    });

    it("should handle spaces", () => {
      expect(truncatePromptName("My English Prompt")).toBe("My English P...");
      expect(truncatePromptName("中文 English")).toBe("中文 E...");
    });
  });

  describe("Real-world examples", () => {
    it("should handle real Chinese prompt names", () => {
      expect(truncatePromptName("高中數學老師")).toBe("高中數學...");
      expect(truncatePromptName("耐心的國中全科老師")).toBe("耐心的國...");
      expect(truncatePromptName("英語口語練習")).toBe("英語口語...");
    });

    it("should handle real English prompt names", () => {
      expect(truncatePromptName("Advanced Math Tutor")).toBe("Advanced Mat...");
      expect(truncatePromptName("QuizMate")).toBe("QuizMate");
      expect(truncatePromptName("High School Physics Tutor")).toBe("High School ...");
    });

    it("should handle product/brand names", () => {
      expect(truncatePromptName("ChatGPT")).toBe("ChatGPT");
      expect(truncatePromptName("Claude3Sonnet")).toBe("Claude3Sonne...");
      expect(truncatePromptName("Gemini2.5Pro")).toBe("Gemini2.5Pro");
    });
  });
});
