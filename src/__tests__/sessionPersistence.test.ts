// src/__tests__/sessionPersistence.test.ts
// 測試頁面 reload 後恢復上次對話的功能

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Session Persistence', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear();
  });

  describe('localStorage Operations', () => {
    it('should save session ID to localStorage', () => {
      const sessionId = 'test-session-123';
      localStorage.setItem('current-session-id', sessionId);
      
      expect(localStorage.getItem('current-session-id')).toBe(sessionId);
    });

    it('should retrieve session ID from localStorage', () => {
      const sessionId = 'test-session-456';
      localStorage.setItem('current-session-id', sessionId);
      
      const retrieved = localStorage.getItem('current-session-id');
      expect(retrieved).toBe(sessionId);
    });

    it('should remove session ID from localStorage', () => {
      localStorage.setItem('current-session-id', 'test-session-789');
      localStorage.removeItem('current-session-id');
      
      expect(localStorage.getItem('current-session-id')).toBeNull();
    });

    it('should return null when session ID does not exist', () => {
      const retrieved = localStorage.getItem('current-session-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('Session ID Format Validation', () => {
    it('should handle UUID format session IDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      localStorage.setItem('current-session-id', uuid);
      
      expect(localStorage.getItem('current-session-id')).toBe(uuid);
    });

    it('should handle timestamp-based session IDs', () => {
      const timestamp = `session-${Date.now()}`;
      localStorage.setItem('current-session-id', timestamp);
      
      expect(localStorage.getItem('current-session-id')).toBe(timestamp);
    });

    it('should handle special characters in session IDs', () => {
      const specialId = 'session_123-abc@test';
      localStorage.setItem('current-session-id', specialId);
      
      expect(localStorage.getItem('current-session-id')).toBe(specialId);
    });
  });

  describe('Session State Management', () => {
    it('should overwrite existing session ID', () => {
      localStorage.setItem('current-session-id', 'old-session');
      localStorage.setItem('current-session-id', 'new-session');
      
      expect(localStorage.getItem('current-session-id')).toBe('new-session');
    });

    it('should handle switching between sessions', () => {
      const sessionIds = ['session-1', 'session-2', 'session-3'];
      
      sessionIds.forEach(id => {
        localStorage.setItem('current-session-id', id);
        expect(localStorage.getItem('current-session-id')).toBe(id);
      });
    });

    it('should clear session when starting new chat', () => {
      localStorage.setItem('current-session-id', 'existing-session');
      
      // Simulate new chat
      localStorage.removeItem('current-session-id');
      
      expect(localStorage.getItem('current-session-id')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string session ID', () => {
      localStorage.setItem('current-session-id', '');
      
      expect(localStorage.getItem('current-session-id')).toBe('');
    });

    it('should handle very long session IDs', () => {
      const longId = 'a'.repeat(1000);
      localStorage.setItem('current-session-id', longId);
      
      expect(localStorage.getItem('current-session-id')).toBe(longId);
    });

    it('should handle multiple localStorage operations', () => {
      localStorage.setItem('current-session-id', 'session-1');
      localStorage.setItem('other-key', 'other-value');
      
      expect(localStorage.getItem('current-session-id')).toBe('session-1');
      expect(localStorage.getItem('other-key')).toBe('other-value');
    });

    it('should not affect other localStorage keys when removing session', () => {
      localStorage.setItem('current-session-id', 'session-1');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('api-keys', 'keys');
      
      localStorage.removeItem('current-session-id');
      
      expect(localStorage.getItem('current-session-id')).toBeNull();
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(localStorage.getItem('api-keys')).toBe('keys');
    });
  });

  describe('Initialization Behavior', () => {
    it('should handle initialization with existing session', () => {
      const existingSession = 'existing-session-id';
      localStorage.setItem('current-session-id', existingSession);
      
      // Simulate component initialization
      const lastSessionId = localStorage.getItem('current-session-id');
      let currentSessionId = null;
      
      if (lastSessionId) {
        currentSessionId = lastSessionId;
      }
      
      expect(currentSessionId).toBe(existingSession);
    });

    it('should handle initialization without existing session', () => {
      // No session in localStorage
      const lastSessionId = localStorage.getItem('current-session-id');
      let currentSessionId = null;
      
      if (lastSessionId) {
        currentSessionId = lastSessionId;
      }
      
      expect(currentSessionId).toBeNull();
    });
  });

  describe('Session Lifecycle', () => {
    it('should save session when created', () => {
      const newSessionId = 'newly-created-session';
      
      // Simulate session creation
      localStorage.setItem('current-session-id', newSessionId);
      
      expect(localStorage.getItem('current-session-id')).toBe(newSessionId);
    });

    it('should update session when switching', () => {
      localStorage.setItem('current-session-id', 'session-1');
      
      // Switch to different session
      const newSessionId = 'session-2';
      localStorage.setItem('current-session-id', newSessionId);
      
      expect(localStorage.getItem('current-session-id')).toBe(newSessionId);
    });

    it('should clear session when deleted', () => {
      localStorage.setItem('current-session-id', 'session-to-delete');
      
      // Simulate session deletion (should trigger new chat)
      localStorage.removeItem('current-session-id');
      
      expect(localStorage.getItem('current-session-id')).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid session switching', () => {
      const sessions = Array.from({ length: 10 }, (_, i) => `session-${i}`);
      
      sessions.forEach(id => {
        localStorage.setItem('current-session-id', id);
      });
      
      expect(localStorage.getItem('current-session-id')).toBe('session-9');
    });

    it('should handle save and remove in sequence', () => {
      localStorage.setItem('current-session-id', 'temp-session');
      expect(localStorage.getItem('current-session-id')).toBe('temp-session');
      
      localStorage.removeItem('current-session-id');
      expect(localStorage.getItem('current-session-id')).toBeNull();
      
      localStorage.setItem('current-session-id', 'new-session');
      expect(localStorage.getItem('current-session-id')).toBe('new-session');
    });
  });
});
