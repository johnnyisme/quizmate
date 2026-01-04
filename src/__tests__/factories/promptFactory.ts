/**
 * Prompt Factory - Generate test prompt data
 * ──────────────────────────────────────────
 * Factory pattern for creating consistent test prompts
 */

export interface CustomPrompt {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
  category?: string;
  createdAt?: number;
}

export class PromptFactory {
  private static promptCounter = 0;

  /**
   * Create a simple prompt
   */
  static createPrompt(
    id: string = `prompt-${++this.promptCounter}`,
    name: string = `自訂 Prompt ${this.promptCounter}`,
    content: string = '請作為一位耐心的中學數學老師，詳細解答問題。'
  ): CustomPrompt {
    return {
      id,
      name,
      content,
      isDefault: false,
      createdAt: Date.now(),
    };
  }

  /**
   * Create default prompt
   */
  static createDefaultPrompt(): CustomPrompt {
    return {
      id: 'default',
      name: '預設 Prompt',
      content: '你是一位耐心且專業的中學數學老師。請用以下結構回答：\n\n1. **解答**\n2. **核心概念**\n3. **解題步驟**\n4. **相關公式**',
      isDefault: true,
      category: 'default',
      createdAt: Date.now(),
    };
  }

  /**
   * Create prompt for math tutoring
   */
  static createMathTutoringPrompt(): CustomPrompt {
    return this.createPrompt(
      'math-tutor',
      '數學輔導老師',
      '你是一位熟悉各種數學概念的中學數學老師。請：\n1. 首先確認學生是否理解題目\n2. 逐步引導解題\n3. 強調關鍵概念\n4. 提供類似題目建議'
    );
  }

  /**
   * Create prompt for homework help
   */
  static createHomeworkPrompt(): CustomPrompt {
    return this.createPrompt(
      'homework-helper',
      '功課幫手',
      '你是一位耐心的功課幫手。當學生上傳習題時：\n1. 先分析題目類型\n2. 確認學生的困惑點\n3. 提供清晰的解答\n4. 建議延伸學習資源'
    );
  }

  /**
   * Create prompt for exam prep
   */
  static createExamPrepPrompt(): CustomPrompt {
    return this.createPrompt(
      'exam-prep',
      '考試準備',
      '你是一位考試教練。幫助學生：\n1. 理解考試重點\n2. 練習常見題型\n3. 提供應試技巧\n4. 評估學習進度'
    );
  }

  /**
   * Create multiple prompts
   */
  static createMultiplePrompts(count: number = 5): CustomPrompt[] {
    return [
      this.createDefaultPrompt(),
      this.createMathTutoringPrompt(),
      this.createHomeworkPrompt(),
      this.createExamPrepPrompt(),
      ...Array.from({ length: Math.max(0, count - 4) }, (_, i) =>
        this.createPrompt()
      ),
    ];
  }

  /**
   * Create prompt with very long content
   */
  static createLongPrompt(): CustomPrompt {
    const longContent = '你是一位教育專家。\n'.repeat(50) + '請提供詳細的教學指導。';
    return this.createPrompt(
      'long-prompt',
      '詳細教學 Prompt',
      longContent
    );
  }

  /**
   * Create prompt with special characters
   */
  static createSpecialCharacterPrompt(): CustomPrompt {
    return this.createPrompt(
      'special-prompt',
      '特殊字符 <>&"\'`',
      '你是一位老師。請回答：\n1. 數字 123\n2. 符號 !@#$%^&*()\n3. 標籤 <tag>content</tag>'
    );
  }

  /**
   * Create prompt with category
   */
  static createPromptWithCategory(category: string = 'math'): CustomPrompt {
    const prompt = this.createPrompt();
    prompt.category = category;
    return prompt;
  }

  /**
   * Create prompt from data
   */
  static fromData(data: Partial<CustomPrompt>): CustomPrompt {
    return {
      id: data.id || `prompt-${++this.promptCounter}`,
      name: data.name || `Prompt ${this.promptCounter}`,
      content: data.content || '請作為一位教師回答問題。',
      isDefault: data.isDefault ?? false,
      category: data.category,
      createdAt: data.createdAt ?? Date.now(),
    };
  }

  /**
   * Reset counter
   */
  static resetCounter(): void {
    this.promptCounter = 0;
  }

  /**
   * Create empty prompt
   */
  static createEmptyPrompt(): CustomPrompt {
    return {
      id: 'empty',
      name: '空 Prompt',
      content: '',
      isDefault: false,
    };
  }

  /**
   * Create minimal prompt (required fields only)
   */
  static createMinimalPrompt(): CustomPrompt {
    return {
      id: `prompt-${++this.promptCounter}`,
      name: `Prompt ${this.promptCounter}`,
      content: '回答問題',
    };
  }
}
