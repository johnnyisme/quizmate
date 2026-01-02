import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initDB,
  createSession,
  getSession,
  appendMessages,
  updateSessionTitle,
  listSessions,
  deleteSession,
  getSessionCount,
  pruneOldSessions,
  clearAllSessions,
  closeDB,
  MAX_SESSIONS,
  type Message,
  type Session,
} from '../lib/db';

// Mock idb module
vi.mock('idb', () => {
  let store: Record<string, Session> = {};
  const indices: Record<string, Session[]> = { updatedAt: [] };

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
          store[session.id] = { ...session }; // Clone to avoid reference issues
          // Update index - sort by updatedAt ascending (oldest first)
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

describe('Database Operations (db.ts)', () => {
  beforeEach(async () => {
    await clearAllSessions();
  });

  afterEach(async () => {
    await closeDB();
  });

  // ============================================
  // Test initDB
  // ============================================

  it('should initialize database successfully', async () => {
    const db = await initDB();
    expect(db).toBeDefined();
  });

  // ============================================
  // Test createSession
  // ============================================

  it('should create a new session', async () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'What is 2+2?',
        timestamp: Date.now(),
      },
    ];

    const session = await createSession(
      'session-1',
      'Math Problem',
      messages,
      'data:image/png;base64,ABC'
    );

    expect(session.id).toBe('session-1');
    expect(session.title).toBe('Math Problem');
    expect(session.messages).toHaveLength(1);
    expect(session.imageBase64).toBe('data:image/png;base64,ABC');
    expect(session.createdAt).toBeDefined();
    expect(session.updatedAt).toBeDefined();
  });

  it('should create session without image', async () => {
    const messages: Message[] = [];
    const session = await createSession('session-2', 'No Image', messages);

    expect(session.imageBase64).toBeUndefined();
  });

  // ============================================
  // Test getSession
  // ============================================

  it('should retrieve session by id', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello', timestamp: Date.now() },
    ];
    await createSession('session-1', 'Test', messages);

    const retrieved = await getSession('session-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Test');
    expect(retrieved?.messages).toHaveLength(1);
  });

  it('should return undefined for non-existent session', async () => {
    const retrieved = await getSession('non-existent');
    expect(retrieved).toBeUndefined();
  });

  // ============================================
  // Test appendMessages
  // ============================================

  it('should append messages to session', async () => {
    const initialMsg: Message[] = [
      { role: 'user', content: 'Q1', timestamp: Date.now() },
    ];
    await createSession('session-1', 'Test', initialMsg);

    const newMsg: Message[] = [
      { role: 'model', content: 'A1', timestamp: Date.now() },
      { role: 'user', content: 'Q2', timestamp: Date.now() },
    ];
    await appendMessages('session-1', newMsg);

    const updated = await getSession('session-1');
    expect(updated?.messages).toHaveLength(3);
    expect(updated?.messages[0].content).toBe('Q1');
    expect(updated?.messages[1].content).toBe('A1');
    expect(updated?.messages[2].content).toBe('Q2');
  });

  it('should update timestamp when appending messages', async () => {
    const msg: Message[] = [
      { role: 'user', content: 'Hello', timestamp: Date.now() },
    ];
    const session1 = await createSession('session-1', 'Test', msg);
    const originalUpdatedAt = session1.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 10));

    await appendMessages('session-1', [
      { role: 'model', content: 'Hi', timestamp: Date.now() },
    ]);

    const updated = await getSession('session-1');
    expect(updated!.updatedAt).toBeGreaterThan(originalUpdatedAt);
  });

  it('should throw error when appending to non-existent session', async () => {
    const msg: Message[] = [
      { role: 'user', content: 'Hello', timestamp: Date.now() },
    ];
    await expect(appendMessages('non-existent', msg)).rejects.toThrow(
      'Session non-existent not found'
    );
  });

  // ============================================
  // Test updateSessionTitle
  // ============================================

  it('should update session title', async () => {
    await createSession('session-1', 'Old Title', []);
    await updateSessionTitle('session-1', 'New Title');

    const updated = await getSession('session-1');
    expect(updated?.title).toBe('New Title');
  });

  it('should update timestamp when changing title', async () => {
    const session1 = await createSession('session-1', 'Original', []);
    const originalUpdatedAt = session1.updatedAt;

    await new Promise((r) => setTimeout(r, 10));
    await updateSessionTitle('session-1', 'Modified');

    const updated = await getSession('session-1');
    expect(updated!.updatedAt).toBeGreaterThan(originalUpdatedAt);
  });

  it('should throw error when updating non-existent session title', async () => {
    await expect(updateSessionTitle('non-existent', 'Title')).rejects.toThrow(
      'Session non-existent not found'
    );
  });

  // ============================================
  // Test listSessions
  // ============================================

  it('should list all sessions sorted by updatedAt (newest first)', async () => {
    const now = Date.now();
    await createSession('s1', 'Session 1', [], undefined);
    await new Promise((r) => setTimeout(r, 5));
    await createSession('s2', 'Session 2', [], undefined);
    await new Promise((r) => setTimeout(r, 5));
    await createSession('s3', 'Session 3', [], undefined);

    const sessions = await listSessions();
    expect(sessions).toHaveLength(3);
    expect(sessions[0].id).toBe('s3'); // Newest first
    expect(sessions[1].id).toBe('s2');
    expect(sessions[2].id).toBe('s1'); // Oldest last
  });

  it('should return empty array when no sessions exist', async () => {
    const sessions = await listSessions();
    expect(sessions).toHaveLength(0);
  });

  // ============================================
  // Test deleteSession
  // ============================================

  it('should delete a session', async () => {
    await createSession('session-1', 'Test', []);
    await deleteSession('session-1');

    const deleted = await getSession('session-1');
    expect(deleted).toBeUndefined();
  });

  it('should not throw error deleting non-existent session', async () => {
    await expect(deleteSession('non-existent')).resolves.not.toThrow();
  });

  // ============================================
  // Test getSessionCount
  // ============================================

  it('should return correct session count', async () => {
    expect(await getSessionCount()).toBe(0);

    await createSession('s1', 'Test 1', []);
    expect(await getSessionCount()).toBe(1);

    await createSession('s2', 'Test 2', []);
    expect(await getSessionCount()).toBe(2);

    await deleteSession('s1');
    expect(await getSessionCount()).toBe(1);
  });

  // ============================================
  // Test pruneOldSessions (LRU)
  // ============================================

  it('should not prune when count <= MAX_SESSIONS', async () => {
    for (let i = 0; i < MAX_SESSIONS; i++) {
      await createSession(`s${i}`, `Session ${i}`, []);
    }

    await pruneOldSessions();
    const count = await getSessionCount();
    expect(count).toBe(MAX_SESSIONS);
  });

  it('should verify MAX_SESSIONS equals 10 (not old value 5)', async () => {
    // 明確驗證 MAX_SESSIONS 是當前正確的值
    expect(MAX_SESSIONS).toBe(10);
    
    // 驗證可以創建 10 個 session 而不觸發清理
    for (let i = 0; i < 10; i++) {
      await createSession(`verify-${i}`, `Session ${i}`, []);
    }
    
    const count = await getSessionCount();
    expect(count).toBe(10);
    
    // 第 11 個 session 應觸發 LRU 清理
    await createSession('verify-10', 'Session 10', []);
    await pruneOldSessions();
    
    const afterPrune = await getSessionCount();
    expect(afterPrune).toBe(10); // 應保持在 10 個
  });

  it('should prune oldest sessions when exceeding MAX_SESSIONS', async () => {
    // Create MAX_SESSIONS + 2 sessions
    for (let i = 0; i < MAX_SESSIONS + 2; i++) {
      await createSession(`s${i}`, `Session ${i}`, []);
      await new Promise((r) => setTimeout(r, 2)); // Ensure different timestamps
    }

    const before = await getSessionCount();
    expect(before).toBe(MAX_SESSIONS + 2);

    await pruneOldSessions();

    const after = await getSessionCount();
    expect(after).toBe(MAX_SESSIONS);

    // Verify oldest sessions were deleted
    const sessions = await listSessions();
    // Sessions should be s2, s3, s4, s5, s6 (oldest 2 deleted: s0, s1)
    expect(sessions.map((s) => s.id)).not.toContain('s0');
    expect(sessions.map((s) => s.id)).not.toContain('s1');
  });

  it('should correctly sort by updatedAt for LRU pruning', async () => {
    // 創建 3 個 session，確保時間戳不同
    await createSession('old', 'Old', []);
    await new Promise((r) => setTimeout(r, 10));
    
    await createSession('middle', 'Middle', []);
    await new Promise((r) => setTimeout(r, 10));
    
    await createSession('new', 'New', []);
    await new Promise((r) => setTimeout(r, 10));
    
    // 更新 'old' session，使其成為最新的
    await appendMessages('old', [
      { role: 'user', content: 'update', timestamp: Date.now() },
    ]);
    
    // listSessions 應按 updatedAt 降序排列（newest first）
    const sessions = await listSessions();
    expect(sessions[0].id).toBe('old'); // 剛更新，最新
    expect(sessions[1].id).toBe('new');
    expect(sessions[2].id).toBe('middle'); // 最舊
  });

  // ============================================
  // Test clearAllSessions
  // ============================================

  it('should clear all sessions', async () => {
    await createSession('s1', 'Test 1', []);
    await createSession('s2', 'Test 2', []);
    expect(await getSessionCount()).toBe(2);

    await clearAllSessions();
    expect(await getSessionCount()).toBe(0);
  });

  // ============================================
  // Test closeDB
  // ============================================

  it('should close database connection', async () => {
    const db1 = await initDB();
    expect(db1).toBeDefined();

    await closeDB();
    // After closing, next init should return new instance
    const db2 = await initDB();
    expect(db2).toBeDefined();
  });

  // ============================================
  // Integration Tests
  // ============================================

  it('should handle complete conversation flow', async () => {
    const imageB64 = 'data:image/png;base64,XYZ';
    const session = await createSession(
      'math-1',
      'Math Problem',
      [{ role: 'user', content: '2+2=?', timestamp: Date.now() }],
      imageB64
    );

    await appendMessages('math-1', [
      { role: 'model', content: '4', timestamp: Date.now() },
    ]);

    await appendMessages('math-1', [
      { role: 'user', content: 'What about 3+3?', timestamp: Date.now() },
    ]);

    const final = await getSession('math-1');
    expect(final?.messages).toHaveLength(3);
    expect(final?.imageBase64).toBe(imageB64);
  });

  it('should maintain session order after updates', async () => {
    await createSession('s1', 'First', []);
    await new Promise((r) => setTimeout(r, 5));
    await createSession('s2', 'Second', []);
    await new Promise((r) => setTimeout(r, 5));
    await createSession('s3', 'Third', []);

    // Update s1 to make it newest
    await new Promise((r) => setTimeout(r, 10)); // Wait before update
    await updateSessionTitle('s1', 'Updated First');

    const list = await listSessions();
    expect(list[0].id).toBe('s1'); // s1 is now newest
    expect(list[1].id).toBe('s3');
    expect(list[2].id).toBe('s2');
  });
});
