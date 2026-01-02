import { IDBPDatabase, openDB } from 'idb';

// ============================================
// Types
// ============================================

export interface Message {
  role: 'user' | 'model';
  content: string;
  imageBase64?: string; // Only on first user message
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  imageBase64?: string; // Persisted image for quick restore
}

// ============================================
// Database Initialization
// ============================================

let dbInstance: IDBPDatabase | null = null;

const DB_NAME = 'quizmate-db';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';

export async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create sessions store with id as primary key
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        // Index for sorting by updatedAt (for LRU)
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    },
  });

  return dbInstance;
}

// ============================================
// Session Operations
// ============================================

/**
 * Create a new session with initial message(s)
 */
export async function createSession(
  id: string,
  title: string,
  initialMessages: Message[],
  imageBase64?: string
): Promise<Session> {
  const db = await initDB();
  const now = Date.now();

  const session: Session = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    messages: initialMessages,
    imageBase64,
  };

  await db.put(STORE_SESSIONS, session);
  return session;
}

/**
 * Get a session by ID
 */
export async function getSession(id: string): Promise<Session | undefined> {
  const db = await initDB();
  return db.get(STORE_SESSIONS, id);
}

/**
 * Append messages to a session and update timestamp
 */
export async function appendMessages(id: string, messages: Message[]): Promise<void> {
  const db = await initDB();
  const session = await db.get(STORE_SESSIONS, id);

  if (!session) {
    throw new Error(`Session ${id} not found`);
  }

  session.messages.push(...messages);
  session.updatedAt = Date.now();

  await db.put(STORE_SESSIONS, session);
}

/**
 * Update session title
 */
export async function updateSessionTitle(id: string, title: string): Promise<void> {
  const db = await initDB();
  const session = await db.get(STORE_SESSIONS, id);

  if (!session) {
    throw new Error(`Session ${id} not found`);
  }

  session.title = title;
  session.updatedAt = Date.now();

  await db.put(STORE_SESSIONS, session);
}

/**
 * List all sessions, sorted by updatedAt (newest first)
 */
export async function listSessions(): Promise<Session[]> {
  const db = await initDB();
  const allSessions = await db.getAllFromIndex(STORE_SESSIONS, 'updatedAt');
  // Reverse to get newest first
  return allSessions.reverse();
}

/**
 * Delete a session
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_SESSIONS, id);
}

/**
 * Get total session count
 */
export async function getSessionCount(): Promise<number> {
  const db = await initDB();
  return db.count(STORE_SESSIONS);
}

// ============================================
// LRU Cleanup (Keep max 30 sessions)
// ============================================

export const MAX_SESSIONS = 30;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Prune old sessions if count exceeds MAX_SESSIONS
 * Deletes oldest (by updatedAt) sessions
 */
export async function pruneOldSessions(): Promise<void> {
  const db = await initDB();
  const count = await db.count(STORE_SESSIONS);

  if (count <= MAX_SESSIONS) {
    return; // No cleanup needed
  }

  const allSessions = await db.getAllFromIndex(STORE_SESSIONS, 'updatedAt');
  const toDelete = allSessions.slice(0, count - MAX_SESSIONS); // Oldest first

  for (const session of toDelete) {
    await db.delete(STORE_SESSIONS, session.id);
  }
}

// ============================================
// Clear All Data (Development/Testing)
// ============================================

export async function clearAllSessions(): Promise<void> {
  const db = await initDB();
  await db.clear(STORE_SESSIONS);
}

/**
 * Close the database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
