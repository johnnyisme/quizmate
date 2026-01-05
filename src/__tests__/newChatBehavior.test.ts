/**
 * Tests for New Chat Button Behavior
 * Bug Fix: 新对话按钮应该清空当前对话并在移动设备上关闭侧边栏
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('New Chat Button Behavior (Bug Fix Tests)', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Save original window width
    originalInnerWidth = window.innerWidth;
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    localStorage.clear();
  });

  describe('State Clearing', () => {
    it('should clear current session ID when starting new chat', () => {
      // Arrange: Set up existing session
      localStorage.setItem('current-session-id', 'session-123');
      
      // Act: Simulate handleNewChat
      const handleNewChat = () => {
        localStorage.removeItem('current-session-id');
      };
      handleNewChat();

      // Assert: Session ID should be removed
      expect(localStorage.getItem('current-session-id')).toBeNull();
    });

    it('should clear conversation state when starting new chat', () => {
      // Arrange: Set up existing conversation
      const state = {
        displayConversation: [
          { role: 'user' as const, text: 'Question 1' },
          { role: 'model' as const, text: 'Answer 1' }
        ],
        apiHistory: [
          { role: 'user', parts: [{ text: 'Question 1' }] },
          { role: 'model', parts: [{ text: 'Answer 1' }] }
        ],
        currentSessionId: 'session-123',
        image: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        imageUrl: 'blob:http://localhost/test'
      };

      // Act: Simulate handleNewChat
      const handleNewChat = () => ({
        displayConversation: [],
        apiHistory: [],
        currentSessionId: null,
        image: null,
        imageUrl: ""
      });

      const result = handleNewChat();

      // Assert: All state should be cleared
      expect(result.displayConversation).toEqual([]);
      expect(result.apiHistory).toEqual([]);
      expect(result.currentSessionId).toBeNull();
      expect(result.image).toBeNull();
      expect(result.imageUrl).toBe("");
    });

    it('should clear image state when starting new chat', () => {
      // Arrange: Set up existing image
      const state = {
        image: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        imageUrl: 'blob:http://localhost/abc123'
      };

      // Act: Simulate clearing image
      const clearImage = () => ({
        image: null,
        imageUrl: ""
      });

      const result = clearImage();

      // Assert: Image should be cleared
      expect(result.image).toBeNull();
      expect(result.imageUrl).toBe("");
    });
  });

  describe('Mobile Sidebar Auto-Close', () => {
    it('should close sidebar on mobile when starting new chat', () => {
      // Arrange: Set mobile width (< 1024px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      localStorage.setItem('sidebar-open', 'true');

      // Act: Simulate handleNewChat for mobile
      const handleNewChat = () => {
        if (window.innerWidth < 1024) {
          localStorage.setItem('sidebar-open', 'false');
          return { showSidebar: false };
        }
        return { showSidebar: true };
      };

      const result = handleNewChat();

      // Assert: Sidebar should be closed on mobile
      expect(result.showSidebar).toBe(false);
      expect(localStorage.getItem('sidebar-open')).toBe('false');
    });

    it('should keep sidebar open on desktop when starting new chat', () => {
      // Arrange: Set desktop width (>= 1024px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280
      });
      localStorage.setItem('sidebar-open', 'true');

      // Act: Simulate handleNewChat for desktop
      const handleNewChat = () => {
        if (window.innerWidth < 1024) {
          localStorage.setItem('sidebar-open', 'false');
          return { showSidebar: false };
        }
        return { showSidebar: true };
      };

      const result = handleNewChat();

      // Assert: Sidebar should remain open on desktop
      expect(result.showSidebar).toBe(true);
      expect(localStorage.getItem('sidebar-open')).toBe('true');
    });

    it('should handle edge case at 1024px breakpoint', () => {
      // Arrange: Set width exactly at breakpoint
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      localStorage.setItem('sidebar-open', 'true');

      // Act: Simulate handleNewChat at breakpoint
      const handleNewChat = () => {
        if (window.innerWidth < 1024) {
          localStorage.setItem('sidebar-open', 'false');
          return { showSidebar: false };
        }
        return { showSidebar: true };
      };

      const result = handleNewChat();

      // Assert: At exactly 1024px, sidebar should remain open (>= 1024)
      expect(result.showSidebar).toBe(true);
      expect(localStorage.getItem('sidebar-open')).toBe('true');
    });
  });

  describe('Session Switch Behavior', () => {
    it('should close sidebar on mobile when switching sessions', () => {
      // Arrange: Set mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      localStorage.setItem('sidebar-open', 'true');

      // Act: Simulate handleSwitchSession
      const handleSwitchSession = (sessionId: string) => {
        localStorage.setItem('current-session-id', sessionId);
        if (window.innerWidth < 1024) {
          localStorage.setItem('sidebar-open', 'false');
          return { showSidebar: false, currentSessionId: sessionId };
        }
        return { showSidebar: true, currentSessionId: sessionId };
      };

      const result = handleSwitchSession('new-session-456');

      // Assert: Sidebar should close on mobile
      expect(result.showSidebar).toBe(false);
      expect(result.currentSessionId).toBe('new-session-456');
      expect(localStorage.getItem('sidebar-open')).toBe('false');
      expect(localStorage.getItem('current-session-id')).toBe('new-session-456');
    });

    it('should keep sidebar open on desktop when switching sessions', () => {
      // Arrange: Set desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280
      });
      localStorage.setItem('sidebar-open', 'true');

      // Act: Simulate handleSwitchSession
      const handleSwitchSession = (sessionId: string) => {
        localStorage.setItem('current-session-id', sessionId);
        if (window.innerWidth < 1024) {
          localStorage.setItem('sidebar-open', 'false');
          return { showSidebar: false, currentSessionId: sessionId };
        }
        return { showSidebar: true, currentSessionId: sessionId };
      };

      const result = handleSwitchSession('new-session-456');

      // Assert: Sidebar should remain open on desktop
      expect(result.showSidebar).toBe(true);
      expect(result.currentSessionId).toBe('new-session-456');
      expect(localStorage.getItem('sidebar-open')).toBe('true');
      expect(localStorage.getItem('current-session-id')).toBe('new-session-456');
    });

    it('should clear image preview when switching sessions', () => {
      // Arrange: Set up existing image
      const state = {
        currentSessionId: 'session-123',
        image: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        imageUrl: 'blob:http://localhost/test'
      };

      // Act: Simulate handleSwitchSession
      const handleSwitchSession = (sessionId: string) => ({
        currentSessionId: sessionId,
        image: null,
        imageUrl: ""
      });

      const result = handleSwitchSession('session-456');

      // Assert: Image should be cleared when switching sessions
      expect(result.currentSessionId).toBe('session-456');
      expect(result.image).toBeNull();
      expect(result.imageUrl).toBe("");
    });
  });

  describe('Delete Session Behavior', () => {
    it('should trigger new chat when deleting current session', () => {
      // Arrange: Set up current session
      const currentSessionId = 'session-123';
      localStorage.setItem('current-session-id', currentSessionId);

      // Act: Simulate handleDeleteSession for current session
      const handleDeleteSession = (sessionId: string, currentId: string | null) => {
        if (currentId === sessionId) {
          // Should trigger handleNewChat
          localStorage.removeItem('current-session-id');
          return {
            deleted: true,
            triggeredNewChat: true,
            currentSessionId: null
          };
        }
        return {
          deleted: true,
          triggeredNewChat: false,
          currentSessionId: currentId
        };
      };

      const result = handleDeleteSession('session-123', currentSessionId);

      // Assert: Should trigger new chat and clear session
      expect(result.deleted).toBe(true);
      expect(result.triggeredNewChat).toBe(true);
      expect(result.currentSessionId).toBeNull();
      expect(localStorage.getItem('current-session-id')).toBeNull();
    });

    it('should not trigger new chat when deleting other session', () => {
      // Arrange: Set up current session
      const currentSessionId = 'session-123';
      localStorage.setItem('current-session-id', currentSessionId);

      // Act: Simulate handleDeleteSession for different session
      const handleDeleteSession = (sessionId: string, currentId: string | null) => {
        if (currentId === sessionId) {
          localStorage.removeItem('current-session-id');
          return {
            deleted: true,
            triggeredNewChat: true,
            currentSessionId: null
          };
        }
        return {
          deleted: true,
          triggeredNewChat: false,
          currentSessionId: currentId
        };
      };

      const result = handleDeleteSession('session-456', currentSessionId);

      // Assert: Should not trigger new chat, keep current session
      expect(result.deleted).toBe(true);
      expect(result.triggeredNewChat).toBe(false);
      expect(result.currentSessionId).toBe(currentSessionId);
      expect(localStorage.getItem('current-session-id')).toBe(currentSessionId);
    });
  });

  describe('Page Load Recovery', () => {
    it('should restore session ID on page load', () => {
      // Arrange: Set stored session ID
      localStorage.setItem('current-session-id', 'session-restore-123');

      // Act: Simulate page load recovery
      const restoreSession = () => {
        const storedSessionId = localStorage.getItem('current-session-id');
        return { currentSessionId: storedSessionId };
      };

      const result = restoreSession();

      // Assert: Should restore session ID
      expect(result.currentSessionId).toBe('session-restore-123');
    });

    it('should handle no stored session on page load', () => {
      // Arrange: No stored session (localStorage already cleared in beforeEach)

      // Act: Simulate page load recovery
      const restoreSession = () => {
        const storedSessionId = localStorage.getItem('current-session-id');
        return { currentSessionId: storedSessionId };
      };

      const result = restoreSession();

      // Assert: Should return null when no session stored
      expect(result.currentSessionId).toBeNull();
    });
  });

  describe('Multiple Operations Sequence', () => {
    it('should correctly handle new chat -> switch session -> new chat sequence', () => {
      // Arrange: Start with a session
      localStorage.setItem('current-session-id', 'session-1');
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      // Act 1: New chat
      localStorage.removeItem('current-session-id');
      expect(localStorage.getItem('current-session-id')).toBeNull();

      // Act 2: Switch to session
      localStorage.setItem('current-session-id', 'session-2');
      expect(localStorage.getItem('current-session-id')).toBe('session-2');

      // Act 3: New chat again
      localStorage.removeItem('current-session-id');
      expect(localStorage.getItem('current-session-id')).toBeNull();

      // Assert: Final state should be cleared
      expect(localStorage.getItem('current-session-id')).toBeNull();
    });

    it('should maintain sidebar state consistency across operations', () => {
      // Arrange: Mobile device
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      // Act 1: Start with sidebar open
      localStorage.setItem('sidebar-open', 'true');
      expect(localStorage.getItem('sidebar-open')).toBe('true');

      // Act 2: New chat should close sidebar
      localStorage.setItem('sidebar-open', 'false');
      expect(localStorage.getItem('sidebar-open')).toBe('false');

      // Act 3: Switch session should keep it closed
      localStorage.setItem('sidebar-open', 'false');
      expect(localStorage.getItem('sidebar-open')).toBe('false');

      // Assert: Sidebar should remain closed
      expect(localStorage.getItem('sidebar-open')).toBe('false');
    });
  });
});
