import type { Message as DBMessage } from '@/lib/db';

/**
 * Session Factory - Generate test session data
 * ─────────────────────────────────────────────
 * Factory pattern for creating consistent test sessions
 */

export interface TestSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: DBMessage[];
  imageBase64?: string;
}

export class SessionFactory {
  private static messageCounter = 0;

  /**
   * Create a simple session
   */
  static createSession(
    id: string = 'session-' + Date.now(),
    title: string = '測試會話',
    messageCount: number = 0
  ): TestSession {
    const createdAt = Date.now();
    const messages: DBMessage[] = [];

    for (let i = 0; i < messageCount; i++) {
      if (i % 2 === 0) {
        messages.push({
          role: 'user',
          content: `問題 ${i / 2 + 1}`,
          timestamp: createdAt + i * 1000,
        });
      } else {
        messages.push({
          role: 'model',
          content: `AI 的回答 ${Math.floor(i / 2) + 1}`,
          timestamp: createdAt + i * 1000,
        });
      }
    }

    return {
      id,
      title,
      createdAt,
      updatedAt: createdAt,
      messages,
    };
  }

  /**
   * Create session with conversation
   */
  static createSessionWithConversation(
    exchanges: number = 3
  ): TestSession {
    const session = this.createSession('session-' + Date.now(), `會話 ${++this.messageCounter}`, 0);
    const baseTime = Date.now();

    for (let i = 0; i < exchanges; i++) {
      session.messages.push({
        role: 'user',
        content: `用戶問題 ${i + 1}`,
        timestamp: baseTime + i * 2000,
      });

      session.messages.push({
        role: 'model',
        content: `AI 回答 ${i + 1}。這是對問題 ${i + 1} 的詳細回答。`,
        timestamp: baseTime + i * 2000 + 1000,
      });
    }

    return session;
  }

  /**
   * Create session with image
   */
  static createSessionWithImage(
    imageBase64: string = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  ): TestSession {
    const session = this.createSession();
    
    // Add a message with image
    session.messages.push({
      role: 'user',
      content: '請分析這張圖片',
      timestamp: Date.now(),
      imageBase64,
    });

    session.messages.push({
      role: 'model',
      content: '這是對圖片的分析結果。',
      timestamp: Date.now() + 1000,
    });

    session.imageBase64 = imageBase64;
    return session;
  }

  /**
   * Create multiple sessions
   */
  static createMultipleSessions(count: number = 5): TestSession[] {
    return Array.from({ length: count }, (_, i) => 
      this.createSessionWithConversation(2 + i)
    );
  }

  /**
   * Create session with long title
   */
  static createSessionWithLongTitle(): TestSession {
    const longTitle = '這是一個非常長的會話標題，用來測試標題截斷和顯示是否正確處理超長文本的情況';
    return this.createSession('session-' + Date.now(), longTitle);
  }

  /**
   * Create session with special characters in title
   */
  static createSessionWithSpecialTitle(): TestSession {
    const specialTitle = '特殊字符: <>&"\'`!@#$%^&*()[]{}';
    return this.createSession('session-' + Date.now(), specialTitle);
  }

  /**
   * Create session with many messages (performance test)
   */
  static createLargeSession(messageCount: number = 100): TestSession {
    return this.createSession('session-' + Date.now(), '大型會話', messageCount);
  }

  /**
   * Create session with timestamp
   */
  static createSessionWithTimestamp(timestamp: number): TestSession {
    const session = this.createSession();
    session.createdAt = timestamp;
    session.updatedAt = timestamp;
    return session;
  }

  /**
   * Reset counter for testing
   */
  static resetCounter(): void {
    this.messageCounter = 0;
  }

  /**
   * Create empty session
   */
  static createEmptySession(): TestSession {
    return this.createSession('session-' + Date.now(), '空會話', 0);
  }

  /**
   * Create session from data
   */
  static fromData(data: Partial<TestSession>): TestSession {
    return {
      id: data.id || 'session-' + Date.now(),
      title: data.title || '測試會話',
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      messages: data.messages || [],
      imageBase64: data.imageBase64,
    };
  }
}
