import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionStorage, useSessionHistory } from '@/lib/useSessionStorage';
import * as db from '@/lib/db';

// Mock IndexedDB operations
vi.mock('@/lib/db', () => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
  appendMessages: vi.fn(),
  updateSessionTitle: vi.fn(),
  listSessions: vi.fn(),
  deleteSession: vi.fn(),
  pruneOldSessions: vi.fn(),
}));

describe('useSessionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with no session ID', () => {
    it('should return null session initially', () => {
      const { result } = renderHook(() => useSessionStorage(null));
      
      expect(result.current.session).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should not fetch session when ID is null', () => {
      renderHook(() => useSessionStorage(null));
      
      expect(db.getSession).not.toHaveBeenCalled();
    });
  });

  describe('with session ID', () => {
    const mockSession = {
      id: 'session-123',
      title: '測試會話',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    beforeEach(() => {
      vi.mocked(db.getSession).mockResolvedValue(mockSession);
    });

    it('should fetch session on mount', async () => {
      const { result } = renderHook(() => useSessionStorage('session-123'));
      
      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(db.getSession).toHaveBeenCalledWith('session-123');
      expect(result.current.session).toEqual(mockSession);
    });

    it('should refetch when session ID changes', async () => {
      const { result, rerender } = renderHook(
        ({ id }) => useSessionStorage(id),
        { initialProps: { id: 'session-123' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newSession = { ...mockSession, id: 'session-456' };
      vi.mocked(db.getSession).mockResolvedValue(newSession);

      rerender({ id: 'session-456' });

      await waitFor(() => {
        expect(db.getSession).toHaveBeenCalledWith('session-456');
        expect(result.current.session?.id).toBe('session-456');
      });
    });

    it('should handle fetch errors', async () => {
      vi.mocked(db.getSession).mockRejectedValue(new Error('DB error'));
      
      const { result } = renderHook(() => useSessionStorage('session-123'));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.session).toBeNull();
    });
  });

  describe('createNewSession', () => {
    it('should create session with auto-generated ID', async () => {
      const mockNewSession = {
        id: 'new-session',
        title: '新會話',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      
      vi.mocked(db.createSession).mockResolvedValue(mockNewSession);
      
      const { result } = renderHook(() => useSessionStorage(null));
      
      let createdSession;
      await act(async () => {
        createdSession = await result.current.createNewSession('新會話', []);
      });
      
      expect(db.createSession).toHaveBeenCalled();
      // First arg is auto-generated timestamp ID
      const call = vi.mocked(db.createSession).mock.calls[0];
      expect(typeof call[0]).toBe('string'); // ID
      expect(call[1]).toBe('新會話'); // title
      expect(call[2]).toEqual([]); // messages
      expect(createdSession).toEqual(mockNewSession);
    });

    it('should create session with messages and image', async () => {
      const messages = [
        { role: 'user' as const, content: '問題', timestamp: Date.now() },
      ];
      const imageBase64 = 'data:image/png;base64,abc123';
      
      vi.mocked(db.createSession).mockResolvedValue({
        id: 'session-with-image',
        title: '圖片會話',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages,
        imageBase64,
      });
      
      const { result } = renderHook(() => useSessionStorage(null));
      
      await act(async () => {
        await result.current.createNewSession('圖片會話', messages, imageBase64);
      });
      
      expect(db.createSession).toHaveBeenCalled();
      const call = vi.mocked(db.createSession).mock.calls[0];
      expect(call[1]).toBe('圖片會話');
      expect(call[2]).toEqual(messages);
      expect(call[3]).toBe(imageBase64);
    });
  });

  describe('addMessages', () => {
    it('should append messages to session', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        title: '會話',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      
      vi.mocked(db.getSession).mockResolvedValue(mockSession);
      
      const { result } = renderHook(() => useSessionStorage(sessionId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const newMessages = [
        { role: 'user' as const, content: '問題', timestamp: Date.now() },
      ];
      
      await act(async () => {
        await result.current.addMessages(newMessages);
      });
      
      expect(db.appendMessages).toHaveBeenCalledWith(sessionId, newMessages);
    });

    it('should throw error when no active session', async () => {
      const { result } = renderHook(() => useSessionStorage(null));
      
      const newMessages = [
        { role: 'user' as const, content: '問題', timestamp: Date.now() },
      ];
      
      await expect(async () => {
        await act(async () => {
          await result.current.addMessages(newMessages);
        });
      }).rejects.toThrow('No active session');
      
      expect(db.appendMessages).not.toHaveBeenCalled();
    });
  });

  describe('updateTitle', () => {
    it('should update session title', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        title: '舊標題',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      
      vi.mocked(db.getSession).mockResolvedValue(mockSession);
      
      const { result } = renderHook(() => useSessionStorage(sessionId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.updateTitle('新標題');
      });
      
      expect(db.updateSessionTitle).toHaveBeenCalledWith(sessionId, '新標題');
    });

    it('should throw error when no active session', async () => {
      const { result } = renderHook(() => useSessionStorage(null));
      
      await expect(async () => {
        await act(async () => {
          await result.current.updateTitle('新標題');
        });
      }).rejects.toThrow('No active session');
      
      expect(db.updateSessionTitle).not.toHaveBeenCalled();
    });
  });
});

describe('useSessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch sessions on mount', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        title: '會話 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
      {
        id: 'session-2',
        title: '會話 2',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
    ];
    
    vi.mocked(db.listSessions).mockResolvedValue(mockSessions);
    
    const { result } = renderHook(() => useSessionHistory());
    
    await waitFor(() => {
      expect(result.current.sessions).toEqual(mockSessions);
    });
    
    expect(db.listSessions).toHaveBeenCalled();
  });

  it('should handle empty session list', async () => {
    vi.mocked(db.listSessions).mockResolvedValue([]);
    
    const { result } = renderHook(() => useSessionHistory());
    
    await waitFor(() => {
      expect(result.current.sessions).toEqual([]);
    });
  });

  it('should load sessions on demand', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        title: '會話 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
    ];
    
    vi.mocked(db.listSessions).mockResolvedValue(mockSessions);
    
    const { result } = renderHook(() => useSessionHistory());
    
    await act(async () => {
      await result.current.loadSessions();
    });
    
    expect(result.current.sessions).toEqual(mockSessions);
  });

  it('should remove session', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        title: '會話 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
      {
        id: 'session-2',
        title: '會話 2',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
    ];
    
    vi.mocked(db.listSessions).mockResolvedValue(mockSessions);
    vi.mocked(db.deleteSession).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useSessionHistory());
    
    await waitFor(() => {
      expect(result.current.sessions.length).toBe(2);
    });
    
    await act(async () => {
      await result.current.removeSession('session-1');
    });
    
    expect(db.deleteSession).toHaveBeenCalledWith('session-1');
  });

  it('should perform cleanup', async () => {
    vi.mocked(db.pruneOldSessions).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useSessionHistory());
    
    await act(async () => {
      await result.current.performCleanup();
    });
    
    expect(db.pruneOldSessions).toHaveBeenCalled();
  });

  it('should handle listSessions errors gracefully', async () => {
    vi.mocked(db.listSessions).mockRejectedValue(new Error('DB error'));
    
    const { result } = renderHook(() => useSessionHistory());
    
    await waitFor(() => {
      expect(result.current.sessions).toEqual([]);
    });
  });
});
