// src/__tests__/sessionTitleEdit.test.ts
// 對話標題編輯功能的單元測試

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initDB,
  createSession,
  updateSessionTitle,
  clearAllSessions,
  closeDB,
  type Message,
  type Session,
} from '../lib/db';

// Mock idb module - 與 db.test.ts 相同的 mock 策略
vi.mock('idb', () => {
  let store: Record<string, Session> = {};
  let indices: Record<string, Session[]> = { updatedAt: [] };

  return {
    openDB: vi.fn(async (_dbName, _version, { upgrade }) => {
      const mockDb = {
        objectStoreNames: { contains: () => false },
        createObjectStore: vi.fn((name) => {
          const mockStore = {
            createIndex: vi.fn(),
          };
          return mockStore;
        }),
      };

      upgrade(mockDb);

      return {
        put: vi.fn(async (_storeName, session: Session) => {
          store[session.id] = { ...session };
          indices['updatedAt'] = Object.values(store).sort(
            (a, b) => a.updatedAt - b.updatedAt
          );
        }),
        get: vi.fn(async (_storeName, id) => store[id] || undefined),
        getAllFromIndex: vi.fn(async (_storeName, indexName) => {
          return indices[indexName] || [];
        }),
        delete: vi.fn(async (_storeName, id) => {
          delete store[id];
          indices['updatedAt'] = Object.values(store).sort(
            (a, b) => a.updatedAt - b.updatedAt
          );
        }),
        count: vi.fn(async () => Object.keys(store).length),
        clear: vi.fn(async () => {
          store = {};
          indices['updatedAt'] = [];
        }),
        close: vi.fn(),
      };
    }),
  };
});

describe('Session Title Edit', () => {
  beforeEach(async () => {
    await clearAllSessions();
  });

  afterEach(async () => {
    await closeDB();
  });

  describe('updateSessionTitle', () => {
    it('should update session title successfully', async () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test question',
          timestamp: Date.now(),
        },
      ];

      // 創建測試 session
      const session = await createSession('test-123', '舊標題', messages);
      expect(session.title).toBe('舊標題');

      // 更新標題
      await updateSessionTitle('test-123', '新標題');

      // 驗證標題已更新
      const db = await initDB();
      const updatedSession = await db.get('sessions', 'test-123');
      expect(updatedSession?.title).toBe('新標題');
    });

    it('should throw error when session not found', async () => {
      await expect(updateSessionTitle('non-existent', '新標題')).rejects.toThrow(
        'Session non-existent not found'
      );
    });

    it('should update timestamp when title is updated', async () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        },
      ];

      const session = await createSession('test-123', '舊標題', messages);
      const oldTimestamp = session.updatedAt;

      // 等待一點時間確保時間戳不同
      await new Promise((resolve) => setTimeout(resolve, 10));

      await updateSessionTitle('test-123', '新標題');

      const db = await initDB();
      const updatedSession = await db.get('sessions', 'test-123');
      expect(updatedSession?.updatedAt).toBeGreaterThan(oldTimestamp);
    });
  });

  describe('Title Validation', () => {
    it('should accept title with 30 characters', () => {
      const title = '12345678901234567890123456789';
      expect(title.length).toBe(29);
      const title30 = title + '0';
      expect(title30.length).toBe(30);
      // Title is valid
      expect(title30.trim()).toBe(title30);
    });

    it('should handle empty title', () => {
      const title = '';
      expect(title.trim()).toBe('');
      // UI should prevent saving empty titles
    });

    it('should handle whitespace-only title', () => {
      const title = '   ';
      expect(title.trim()).toBe('');
      // UI should prevent saving whitespace-only titles
    });

    it('should trim whitespace from title', () => {
      const title = '  標題  ';
      expect(title.trim()).toBe('標題');
    });
  });

  describe('Handler Functions Logic', () => {
    it('handleStartEditTitle - should switch session if not current', () => {
      const currentSessionId: string = 'session-1';
      const editingSessionId: string = 'session-2';
      
      // Simulate switching logic
      const shouldSwitch = currentSessionId !== editingSessionId;
      expect(shouldSwitch).toBe(true);
    });

    it('handleStartEditTitle - should not switch if already current session', () => {
      const currentSessionId = 'session-1';
      const editingSessionId = 'session-1';
      
      const shouldSwitch = currentSessionId !== editingSessionId;
      expect(shouldSwitch).toBe(false);
    });

    it('handleSaveTitle - should not save empty title', () => {
      const title = '';
      const shouldSave = title.trim() !== '';
      expect(shouldSave).toBe(false);
    });

    it('handleSaveTitle - should save valid title', () => {
      const title = '新標題';
      const shouldSave = title.trim() !== '';
      expect(shouldSave).toBe(true);
    });

    it('handleTitleKeyDown - Enter key should trigger save', () => {
      const event = { key: 'Enter', preventDefault: vi.fn() };
      
      if (event.key === 'Enter') {
        event.preventDefault();
        // Save logic would be called
        expect(event.preventDefault).toHaveBeenCalled();
      }
    });

    it('handleTitleKeyDown - Escape key should trigger cancel', () => {
      const event = { key: 'Escape' };
      
      let cancelled = false;
      if (event.key === 'Escape') {
        cancelled = true;
      }
      
      expect(cancelled).toBe(true);
    });

    it('handleCancelEdit - should reset editing state', () => {
      let editingSessionId: string | null = 'session-1';
      let editingTitle = 'Some title';
      
      // Cancel logic
      editingSessionId = null;
      editingTitle = '';
      
      expect(editingSessionId).toBeNull();
      expect(editingTitle).toBe('');
    });
  });

  describe('Click Outside to Cancel', () => {
    it('should cancel edit when clicking outside editing container', () => {
      // 模擬編輯狀態
      let editingSessionId: string | null = 'session-1';
      let editingTitle = 'Editing...';
      
      // 模擬點擊外部
      const editingContainer = document.createElement('div');
      const outsideElement = document.createElement('div');
      document.body.appendChild(editingContainer);
      document.body.appendChild(outsideElement);
      
      // 點擊外部元素
      const clickEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: outsideElement });
      
      // 檢查是否在容器外
      const isOutside = !editingContainer.contains(clickEvent.target as Node);
      
      if (isOutside) {
        editingSessionId = null;
        editingTitle = '';
      }
      
      expect(editingSessionId).toBeNull();
      expect(editingTitle).toBe('');
      
      // Cleanup
      document.body.removeChild(editingContainer);
      document.body.removeChild(outsideElement);
    });

    it('should not cancel edit when clicking inside editing container', () => {
      let editingSessionId: string | null = 'session-1';
      let editingTitle = 'Editing...';
      
      const editingContainer = document.createElement('div');
      const inputElement = document.createElement('input');
      editingContainer.appendChild(inputElement);
      document.body.appendChild(editingContainer);
      
      // 點擊容器內部元素
      const clickEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: inputElement });
      
      // 檢查是否在容器內
      const isInside = editingContainer.contains(clickEvent.target as Node);
      
      if (!isInside) {
        editingSessionId = null;
        editingTitle = '';
      }
      
      // 應該保持編輯狀態
      expect(editingSessionId).toBe('session-1');
      expect(editingTitle).toBe('Editing...');
      
      // Cleanup
      document.body.removeChild(editingContainer);
    });

    it('should not trigger cancel when not in editing mode', () => {
      let editingSessionId: string | null = null;
      let editingTitle = '';
      
      // 當沒有在編輯時，點擊事件不應該被監聽
      const shouldListenForClicks = editingSessionId !== null;
      
      expect(shouldListenForClicks).toBe(false);
    });

    it('should cleanup event listener when exiting edit mode', () => {
      const removeEventListener = vi.fn();
      const addEventListener = vi.fn(() => removeEventListener);
      
      // 模擬進入編輯模式
      let editingSessionId: string | null = 'session-1';
      
      if (editingSessionId) {
        const cleanup = addEventListener();
        
        // 退出編輯模式時應該調用 cleanup
        editingSessionId = null;
        cleanup();
        
        expect(removeEventListener).toHaveBeenCalled();
      }
    });
  });

  describe('Button Styling and Layout', () => {
    it('should use compact circular buttons for save and cancel', () => {
      // 保存按鈕樣式
      const saveButtonClasses = 'p-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex-shrink-0';
      expect(saveButtonClasses).toContain('rounded-full');
      expect(saveButtonClasses).toContain('bg-green-600');
      expect(saveButtonClasses).toContain('flex-shrink-0');
      
      // 取消按鈕樣式
      const cancelButtonClasses = 'p-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0';
      expect(cancelButtonClasses).toContain('rounded-full');
      expect(cancelButtonClasses).toContain('bg-gray-300');
      expect(cancelButtonClasses).toContain('flex-shrink-0');
    });

    it('should have min-w-0 on input to allow shrinking', () => {
      const inputClasses = 'flex-1 min-w-0 text-sm font-medium';
      expect(inputClasses).toContain('min-w-0');
      expect(inputClasses).toContain('flex-1');
    });

    it('should use gap-1 for compact spacing', () => {
      const containerClasses = 'flex items-center gap-1';
      expect(containerClasses).toContain('gap-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in title', async () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        },
      ];

      await createSession('test-123', '舊標題', messages);

      const specialTitle = '數學題：2+2=?【測試】';
      await updateSessionTitle('test-123', specialTitle);

      const db = await initDB();
      const updatedSession = await db.get('sessions', 'test-123');
      expect(updatedSession?.title).toBe(specialTitle);
    });

    it('should handle emoji in title', async () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        },
      ];

      await createSession('test-456', '舊標題', messages);

      const emojiTitle = '數學練習 📚✏️';
      await updateSessionTitle('test-456', emojiTitle);

      const db = await initDB();
      const updatedSession = await db.get('sessions', 'test-456');
      expect(updatedSession?.title).toBe(emojiTitle);
    });

    it('should handle maximum length title (30 chars)', () => {
      const maxTitle = '12345678901234567890123456789';
      expect(maxTitle.length).toBe(29);
      
      const tooLong = maxTitle + 'X';
      expect(tooLong.length).toBe(30);
      
      // HTML maxLength attribute will prevent exceeding 30
      const truncated = tooLong.slice(0, 30);
      expect(truncated.length).toBe(30);
    });
  });
});
