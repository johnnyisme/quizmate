import { DisplayMessage } from '@/hooks/useChatState';

/**
 * Message Factory - Generate test message data
 * ────────────────────────────────────────────
 * Factory pattern for creating consistent test messages
 */

export class MessageFactory {
  /**
   * Create a user message
   */
  static createUserMessage(text: string = '測試問題', image?: string): DisplayMessage {
    return {
      role: 'user',
      text,
      image,
    };
  }

  /**
   * Create an AI/model message
   */
  static createModelMessage(text: string = '這是 AI 的回答'): DisplayMessage {
    return {
      role: 'model',
      text,
    };
  }

  /**
   * Create a conversation with multiple messages
   */
  static createConversation(count: number = 5): DisplayMessage[] {
    const messages: DisplayMessage[] = [];
    
    for (let i = 0; i < count; i++) {
      if (i % 2 === 0) {
        messages.push(this.createUserMessage(`問題 ${Math.floor(i / 2) + 1}`));
      } else {
        messages.push(this.createModelMessage(`回答 ${Math.floor(i / 2) + 1}`));
      }
    }
    
    return messages;
  }

  /**
   * Create messages with images
   */
  static createMessagesWithImages(count: number = 3): DisplayMessage[] {
    const messages: DisplayMessage[] = [];
    
    for (let i = 0; i < count; i++) {
      messages.push(
        this.createUserMessage(
          `上傳圖片的問題 ${i + 1}`,
          `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`
        )
      );
      messages.push(this.createModelMessage(`圖片 ${i + 1} 的分析結果`));
    }
    
    return messages;
  }

  /**
   * Create error message
   */
  static createErrorMessage(): DisplayMessage {
    return {
      role: 'model',
      text: '抱歉，發生錯誤',
    };
  }

  /**
   * Create long message for testing overflow
   */
  static createLongMessage(sentences: number = 10): DisplayMessage {
    const longText = Array(sentences)
      .fill(null)
      .map((_, i) => `這是第 ${i + 1} 句話。`)
      .join('');
    
    return this.createModelMessage(longText);
  }

  /**
   * Create message with markdown
   */
  static createMarkdownMessage(): DisplayMessage {
    return this.createModelMessage(`
# 標題

## 副標題

這是 **粗體** 和 *斜體*。

- 列表項 1
- 列表項 2
- 列表項 3

\`\`\`typescript
const x = 5;
console.log(x);
\`\`\`

| 欄位 | 值 |
|------|-----|
| A    | 1   |
| B    | 2   |
    `);
  }

  /**
   * Create message with math formula
   */
  static createMathMessage(): DisplayMessage {
    return this.createModelMessage(`
解：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

\\$\\$x^2 + 2x + 1 = 0\\$\\$
    `);
  }

  /**
   * Create empty message
   */
  static createEmptyMessage(): DisplayMessage {
    return this.createUserMessage('');
  }

  /**
   * Create message with special characters
   */
  static createSpecialCharactersMessage(): DisplayMessage {
    return this.createUserMessage('特殊字符: <>&"\'`!@#$%^&*()[]{}');
  }
}
