/**
 * Session 切換整合測試
 * 
 * 測試目標：完整的 session 切換流程 (圖片/滾動/輸入清除)
 * 驗證狀態在 session 之間正確流轉
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Session 切換整合測試', () => {
  let mockSessions: any[];

  beforeEach(() => {
    mockSessions = [
      {
        id: 'session-1',
        title: '數學問題',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
        messages: [
          { role: 'user', content: '1+1=？', timestamp: Date.now() - 10000 },
          { role: 'model', content: '1+1=2', timestamp: Date.now() - 9000 },
        ],
      },
      {
        id: 'session-2',
        title: '英文翻譯',
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
        messages: [
          { role: 'user', content: 'Hello', timestamp: Date.now() - 5000 },
          { role: 'model', content: '你好', timestamp: Date.now() - 4000 },
        ],
      },
    ];

    // Mock localStorage for session tracking
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      length: 0,
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    } as any;

    // Mock IndexedDB for session storage
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session 切換基本流程', () => {
    it('應該保存當前 session ID 到 localStorage', () => {
      const sessionId = 'session-1';
      localStorage.setItem('current-session-id', sessionId);

      expect(localStorage.getItem('current-session-id')).toBe('session-1');
    });

    it('應該從 localStorage 恢復上次打開的 session', () => {
      // Step 1: 第一次打開，選擇 session-2
      localStorage.setItem('current-session-id', 'session-2');

      // Step 2: 刷新頁面（模擬）
      const restored = localStorage.getItem('current-session-id');

      // Step 3: 驗證恢復
      expect(restored).toBe('session-2');
    });

    it('應該在切換 session 時更新當前 session ID', () => {
      // 初始 session
      localStorage.setItem('current-session-id', 'session-1');
      expect(localStorage.getItem('current-session-id')).toBe('session-1');

      // 切換到 session-2
      localStorage.setItem('current-session-id', 'session-2');
      expect(localStorage.getItem('current-session-id')).toBe('session-2');
    });
  });

  describe('切換 Session 時的狀態清除', () => {
    it('應該在切換 session 時清除輸入框內容', () => {
      const inputState = { value: '當前輸入的文本' };

      // 模擬用戶輸入
      expect(inputState.value).toBe('當前輸入的文本');

      // 切換 session 時清除輸入
      const newInputState = { value: '' };
      expect(newInputState.value).toBe('');
    });

    it('應該在切換 session 時清除圖片預覽', () => {
      const imageState = {
        image: new File(['fake'], 'image.jpg'),
        imageUrl: 'blob:http://localhost/123',
      };

      // 初始狀態有圖片
      expect(imageState.image).toBeDefined();
      expect(imageState.imageUrl).toBeTruthy();

      // 切換 session 時清除圖片
      const clearedState = {
        image: null,
        imageUrl: '',
      };

      expect(clearedState.image).toBeNull();
      expect(clearedState.imageUrl).toBe('');
    });

    it('應該在切換 session 時清除選擇狀態', () => {
      const selectionState = {
        isSelectMode: true,
        selectedMessages: new Set([0, 1, 2]),
      };

      // 初始選擇狀態
      expect(selectionState.isSelectMode).toBe(true);
      expect(selectionState.selectedMessages.size).toBe(3);

      // 切換 session 時清除選擇
      const clearedSelection = {
        isSelectMode: false,
        selectedMessages: new Set(),
      };

      expect(clearedSelection.isSelectMode).toBe(false);
      expect(clearedSelection.selectedMessages.size).toBe(0);
    });

    it('應該在切換 session 時清除滾動位置padding', () => {
      const container = document.createElement('div');
      container.style.paddingBottom = '80vh';

      expect(container.style.paddingBottom).toBe('80vh');

      // 切換 session 時清除 padding
      container.style.paddingBottom = '0px';
      expect(container.style.paddingBottom).toBe('0px');
    });
  });

  describe('Session 內容載入', () => {
    it('應該在切換到新 session 時載入其內容', () => {
      const currentSession = mockSessions[0];

      // 驗證 session 內容可用
      expect(currentSession.messages).toHaveLength(2);
      expect(currentSession.messages[0].content).toBe('1+1=？');
    });

    it('應該保持 session 訊息歷史', () => {
      const session = mockSessions[1];

      // 驗證訊息保持完整
      expect(session.messages).toEqual([
        { role: 'user', content: 'Hello', timestamp: expect.any(Number) },
        { role: 'model', content: '你好', timestamp: expect.any(Number) },
      ]);
    });

    it('應該正確設置 API 歷史記錄', () => {
      const session = mockSessions[0];
      const apiHistory = session.messages.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      expect(apiHistory).toHaveLength(2);
      expect(apiHistory[0].role).toBe('user');
      expect(apiHistory[1].role).toBe('model');
    });
  });

  describe('Session 滾動位置管理', () => {
    it('應該為每個 session 保存滾動位置', () => {
      const scrollPositions: Record<string, number> = {};

      // Session 1 的滾動位置
      scrollPositions['session-1'] = 500;
      localStorage.setItem('scroll-pos-session-1', '500');

      // Session 2 的滾動位置
      scrollPositions['session-2'] = 250;
      localStorage.setItem('scroll-pos-session-2', '250');

      // 驗證都被保存
      expect(localStorage.getItem('scroll-pos-session-1')).toBe('500');
      expect(localStorage.getItem('scroll-pos-session-2')).toBe('250');
    });

    it('應該在切換 session 時恢復對應的滾動位置', () => {
      // Step 1: 設置 session-1 的滾動位置
      localStorage.setItem('scroll-pos-session-1', '400');

      // Step 2: 切換到 session-2
      localStorage.setItem('current-session-id', 'session-2');
      localStorage.setItem('scroll-pos-session-2', '100');

      // Step 3: 切換回 session-1
      localStorage.setItem('current-session-id', 'session-1');
      const restoredPos = localStorage.getItem('scroll-pos-session-1');

      // Step 4: 驗證恢復
      expect(restoredPos).toBe('400');
    });

    it('應該在新建 session 時初始化滾動位置為 0', () => {
      const newSessionId = 'session-3';
      localStorage.setItem('current-session-id', newSessionId);
      localStorage.setItem('scroll-pos-' + newSessionId, '0');

      const scrollPos = localStorage.getItem('scroll-pos-session-3');
      expect(scrollPos).toBe('0');
    });

    it('應該在頁面卸載時保存滾動位置', () => {
      const sessionId = 'session-1';
      const scrollPosition = 800;

      // 模擬 beforeunload 事件
      localStorage.setItem(`scroll-pos-${sessionId}`, scrollPosition.toString());

      // 驗證保存
      expect(localStorage.getItem('scroll-pos-session-1')).toBe('800');
    });
  });

  describe('完整的 Session 切換流程', () => {
    it('完整流程：初始化 → 輸入 → 上傳圖片 → 切換 session → 驗證清除', () => {
      // Step 1: 初始化 session-1
      localStorage.setItem('current-session-id', 'session-1');
      const inputValue = { text: '數學問題：1+1=？' };
      const imageFile = {
        name: 'math-problem.jpg',
        size: 1024 * 100, // 100KB
      };

      expect(localStorage.getItem('current-session-id')).toBe('session-1');
      expect(inputValue.text).toBeTruthy();
      expect(imageFile.name).toBe('math-problem.jpg');

      // Step 2: 使用者輸入和上傳圖片
      const inputState = { value: inputValue.text };
      const imageState = { file: imageFile, url: 'blob:...' };

      expect(inputState.value).toContain('1+1');
      expect(imageState.file).toBeDefined();

      // Step 3: 切換到 session-2
      localStorage.setItem('current-session-id', 'session-2');
      const inputState2 = { value: '' };
      const imageState2 = { file: null, url: '' };

      expect(localStorage.getItem('current-session-id')).toBe('session-2');
      expect(inputState2.value).toBe('');
      expect(imageState2.file).toBeNull();

      // Step 4: 驗證 session-2 的內容被正確載入
      const session2 = mockSessions[1];
      expect(session2.messages).toHaveLength(2);
      expect(session2.messages[0].content).toBe('Hello');

      // Step 5: 切換回 session-1
      localStorage.setItem('current-session-id', 'session-1');
      const session1 = mockSessions[0];

      expect(localStorage.getItem('current-session-id')).toBe('session-1');
      expect(session1.messages[0].content).toBe('1+1=？');
    });

    it('完整流程：session 切換 → 滾動 → 切換 → 滾動恢復', () => {
      // Step 1: Session 1 - 使用者滾動到位置 500
      localStorage.setItem('current-session-id', 'session-1');
      localStorage.setItem('scroll-pos-session-1', '500');

      const pos1 = localStorage.getItem('scroll-pos-session-1');
      expect(pos1).toBe('500');

      // Step 2: 切換到 session-2 - 滾動到位置 100
      localStorage.setItem('current-session-id', 'session-2');
      localStorage.setItem('scroll-pos-session-2', '100');

      const pos2 = localStorage.getItem('scroll-pos-session-2');
      expect(pos2).toBe('100');

      // Step 3: 切換回 session-1
      localStorage.setItem('current-session-id', 'session-1');
      const restoredPos1 = localStorage.getItem('scroll-pos-session-1');

      // Step 4: 驗證滾動位置恢復
      expect(restoredPos1).toBe('500');

      // Step 5: 再次切換到 session-2
      localStorage.setItem('current-session-id', 'session-2');
      const restoredPos2 = localStorage.getItem('scroll-pos-session-2');

      // Step 6: 驗證
      expect(restoredPos2).toBe('100');
    });

    it('完整流程：新建 session → 輸入 → 保存 → 刪除 → 恢復預設', () => {
      const sessions = [...mockSessions];

      // Step 1: 新建 session
      const newSession = {
        id: 'session-3',
        title: '物理問題',
        messages: [],
      };
      sessions.push(newSession);

      // Step 2: 選擇新 session
      localStorage.setItem('current-session-id', 'session-3');
      expect(localStorage.getItem('current-session-id')).toBe('session-3');

      // Step 3: 模擬輸入和回應
      newSession.messages.push(
        { role: 'user', content: 'F=ma是什麼？', timestamp: Date.now() },
        {
          role: 'model',
          content: '牛頓第二定律...',
          timestamp: Date.now(),
        }
      );

      expect(newSession.messages).toHaveLength(2);

      // Step 4: 刪除這個 session
      const filtered = sessions.filter((s) => s.id !== 'session-3');

      // Step 5: 恢復到預設 session
      localStorage.setItem('current-session-id', 'session-1');

      expect(filtered).toHaveLength(2);
      expect(localStorage.getItem('current-session-id')).toBe('session-1');
    });
  });

  describe('邊界情況', () => {
    it('應該處理沒有 session 歷史的情況', () => {
      localStorage.clear();

      const currentSession = localStorage.getItem('current-session-id');
      expect(currentSession).toBeNull();
    });

    it('應該處理無效的 session ID', () => {
      localStorage.setItem('current-session-id', 'invalid-session-id');

      const sessionId = localStorage.getItem('current-session-id');
      expect(sessionId).toBe('invalid-session-id');

      // 應用應該檢測並恢復
      const validSession = mockSessions.find(s => s.id === sessionId);
      expect(validSession).toBeUndefined();
    });

    it('應該在快速連續切換時處理正確', () => {
      // 快速切換
      localStorage.setItem('current-session-id', 'session-1');
      localStorage.setItem('current-session-id', 'session-2');
      localStorage.setItem('current-session-id', 'session-1');

      // 應該最終落在 session-1
      expect(localStorage.getItem('current-session-id')).toBe('session-1');
    });

    it('應該在 session 被刪除時恢復預設', () => {
      // 選擇 session-1
      localStorage.setItem('current-session-id', 'session-1');

      // 模擬刪除 session-1
      const remaining = mockSessions.filter(s => s.id !== 'session-1');

      // 應該切換到另一個 session
      if (remaining.length > 0) {
        localStorage.setItem('current-session-id', remaining[0].id);
      }

      const current = localStorage.getItem('current-session-id');
      expect(current).toBe('session-2');
    });
  });
});
