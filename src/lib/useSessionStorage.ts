import { useCallback, useEffect, useState } from 'react';
import {
  createSession,
  getSession,
  appendMessages,
  updateSessionTitle,
  deleteSession,
  pruneOldSessions,
  listSessions,
  type Message,
  type Session,
} from './db';

/**
 * Hook for managing current active session
 * Handles: loading session data, appending messages, updating title
 */
export function useSessionStorage(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session on mount or when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      return;
    }

    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSession(sessionId);
        setSession(data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Create new session
  const createNewSession = useCallback(
    async (title: string, initialMessages: Message[], imageBase64?: string) => {
      try {
        setError(null);
        const newSession = await createSession(
          Date.now().toString(),
          title,
          initialMessages,
          imageBase64
        );
        setSession(newSession);
        return newSession;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to create session';
        setError(errMsg);
        throw err;
      }
    },
    []
  );

  // Append messages to current session
  const addMessages = useCallback(
    async (messages: Message[]) => {
      if (!session) {
        throw new Error('No active session');
      }

      try {
        setError(null);
        await appendMessages(session.id, messages);

        // Update local state
        setSession((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, ...messages],
                updatedAt: Date.now(),
              }
            : null
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to append messages';
        setError(errMsg);
        throw err;
      }
    },
    [session]
  );

  // Update session title
  const updateTitle = useCallback(
    async (newTitle: string) => {
      if (!session) {
        throw new Error('No active session');
      }

      try {
        setError(null);
        await updateSessionTitle(session.id, newTitle);

        // Update local state
        setSession((prev) =>
          prev
            ? {
                ...prev,
                title: newTitle,
                updatedAt: Date.now(),
              }
            : null
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to update title';
        setError(errMsg);
        throw err;
      }
    },
    [session]
  );

  return {
    session,
    loading,
    error,
    createNewSession,
    addMessages,
    updateTitle,
  };
}

/**
 * Hook for managing session history list
 * Handles: listing sessions, deleting sessions, LRU cleanup
 */
export function useSessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errMsg);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Delete session and refresh list
  const removeSession = useCallback(
    async (sessionId: string) => {
      try {
        setError(null);
        await deleteSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to delete session';
        setError(errMsg);
        throw err;
      }
    },
    []
  );

  // Perform LRU cleanup and refresh
  const performCleanup = useCallback(async () => {
    try {
      setError(null);
      await pruneOldSessions();
      await loadSessions(); // Reload after cleanup
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to cleanup sessions';
      setError(errMsg);
      throw err;
    }
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    removeSession,
    performCleanup,
  };
}
