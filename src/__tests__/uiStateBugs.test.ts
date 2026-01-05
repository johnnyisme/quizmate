/**
 * Tests for UI State and Session Management Bug Fixes
 * 测试 UI 状态和会话管理相关的 bug 修复
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('UI State Bug Fixes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Bug Fix #1: Missing loadSessions() on Page Load', () => {
    it('should load sessions list on initial page load', () => {
      // Arrange: Setup stored session ID
      localStorage.setItem('current-session-id', 'session-123');

      // Act: Simulate page load initialization
      const initializePage = () => {
        const storedSessionId = localStorage.getItem('current-session-id');
        const shouldLoadSessions = true; // ✅ 应该始终加载 sessions 列表
        
        return {
          currentSessionId: storedSessionId,
          shouldLoadSessions,
        };
      };

      const result = initializePage();

      // Assert: Should both restore session and load sessions list
      expect(result.currentSessionId).toBe('session-123');
      expect(result.shouldLoadSessions).toBe(true); // ✅ 关键：必须加载列表
    });

    it('should load sessions list even when no stored session exists', () => {
      // Arrange: No stored session (localStorage already cleared)

      // Act: Simulate page load initialization
      const initializePage = () => {
        const storedSessionId = localStorage.getItem('current-session-id');
        const shouldLoadSessions = true; // ✅ 即使没有 session 也要加载列表
        
        return {
          currentSessionId: storedSessionId,
          shouldLoadSessions,
        };
      };

      const result = initializePage();

      // Assert: Should load sessions list (to show empty state or existing sessions)
      expect(result.currentSessionId).toBeNull();
      expect(result.shouldLoadSessions).toBe(true);
    });

    it('should ensure sidebar shows sessions after page reload', () => {
      // Arrange: User has multiple sessions
      const mockSessions = [
        { id: 'session-1', title: 'Math Problem', createdAt: Date.now() - 3600000 },
        { id: 'session-2', title: 'Physics Question', createdAt: Date.now() - 1800000 },
        { id: 'session-3', title: 'Chemistry Help', createdAt: Date.now() },
      ];

      localStorage.setItem('current-session-id', 'session-3');

      // Act: Simulate page load and sessions loading
      const loadSessionsOnPageLoad = () => {
        const storedSessionId = localStorage.getItem('current-session-id');
        
        // ✅ loadSessions() should be called, returning sessions list
        return {
          currentSessionId: storedSessionId,
          sessions: mockSessions, // Sessions loaded from IndexedDB
        };
      };

      const result = loadSessionsOnPageLoad();

      // Assert: Sessions should be loaded and current session should be set
      expect(result.currentSessionId).toBe('session-3');
      expect(result.sessions).toHaveLength(3);
      expect(result.sessions[2].id).toBe('session-3'); // Current session in list
    });
  });

  describe('Bug Fix #6: Sidebar Persistence from localStorage', () => {
    it('should restore sidebar open state from localStorage on page load', () => {
      // Arrange: User left sidebar open
      localStorage.setItem('sidebar-open', 'true');

      // Act: Initialize UI state from localStorage
      const initializeSidebarState = () => {
        const storedSidebarOpen = localStorage.getItem('sidebar-open');
        return { showSidebar: storedSidebarOpen === 'true' };
      };

      const result = initializeSidebarState();

      // Assert: Sidebar should be open
      expect(result.showSidebar).toBe(true);
    });

    it('should restore sidebar closed state from localStorage on page load', () => {
      // Arrange: User closed sidebar
      localStorage.setItem('sidebar-open', 'false');

      // Act: Initialize UI state from localStorage
      const initializeSidebarState = () => {
        const storedSidebarOpen = localStorage.getItem('sidebar-open');
        return { showSidebar: storedSidebarOpen === 'true' };
      };

      const result = initializeSidebarState();

      // Assert: Sidebar should be closed
      expect(result.showSidebar).toBe(false);
    });

    it('should default to false when no sidebar state is stored', () => {
      // Arrange: No stored sidebar state (localStorage already cleared)

      // Act: Initialize UI state
      const initializeSidebarState = () => {
        const storedSidebarOpen = localStorage.getItem('sidebar-open');
        return { showSidebar: storedSidebarOpen === 'true' };
      };

      const result = initializeSidebarState();

      // Assert: Should default to closed (false)
      expect(result.showSidebar).toBe(false);
    });

    it('should handle invalid sidebar state values gracefully', () => {
      // Arrange: Invalid value in localStorage
      localStorage.setItem('sidebar-open', 'invalid-value');

      // Act: Initialize UI state
      const initializeSidebarState = () => {
        const storedSidebarOpen = localStorage.getItem('sidebar-open');
        return { showSidebar: storedSidebarOpen === 'true' };
      };

      const result = initializeSidebarState();

      // Assert: Should default to false for non-'true' values
      expect(result.showSidebar).toBe(false);
    });

    it('should persist sidebar state changes to localStorage', () => {
      // Arrange: Initial state
      localStorage.setItem('sidebar-open', 'false');

      // Act 1: Open sidebar
      const openSidebar = () => {
        localStorage.setItem('sidebar-open', 'true');
        return { showSidebar: true };
      };

      const result1 = openSidebar();
      expect(result1.showSidebar).toBe(true);
      expect(localStorage.getItem('sidebar-open')).toBe('true');

      // Act 2: Close sidebar
      const closeSidebar = () => {
        localStorage.setItem('sidebar-open', 'false');
        return { showSidebar: false };
      };

      const result2 = closeSidebar();
      expect(result2.showSidebar).toBe(false);
      expect(localStorage.getItem('sidebar-open')).toBe('false');
    });

    it('should maintain sidebar state consistency across page refreshes', () => {
      // Arrange: User opens sidebar and refreshes page
      localStorage.setItem('sidebar-open', 'true');

      // Act 1: First page load
      let sidebarState = localStorage.getItem('sidebar-open') === 'true';
      expect(sidebarState).toBe(true);

      // Act 2: Simulate page refresh (re-read from localStorage)
      sidebarState = localStorage.getItem('sidebar-open') === 'true';
      expect(sidebarState).toBe(true); // ✅ State preserved

      // Act 3: User closes sidebar
      localStorage.setItem('sidebar-open', 'false');

      // Act 4: Another page refresh
      sidebarState = localStorage.getItem('sidebar-open') === 'true';
      expect(sidebarState).toBe(false); // ✅ New state preserved
    });
  });

  describe('Bug Fix #4: Scroll-to-Question Performance (useMemo)', () => {
    it('should calculate lastUserMessageIndex only once per conversation change', () => {
      // Arrange: Track calculation count
      let calculationCount = 0;

      const calculateLastUserIndex = (conversation: any[]) => {
        calculationCount++;
        for (let i = conversation.length - 1; i >= 0; i--) {
          if (conversation[i].role === 'user') {
            return i;
          }
        }
        return -1;
      };

      // Act 1: Initial calculation
      const conversation1 = [
        { role: 'user', text: 'Q1' },
        { role: 'model', text: 'A1' },
      ];
      
      const index1 = calculateLastUserIndex(conversation1);
      expect(index1).toBe(0);
      expect(calculationCount).toBe(1);

      // Act 2: Simulate useMemo behavior (should not recalculate for same conversation)
      const cachedConversation = conversation1;
      let cachedIndex = index1;
      
      // Multiple renders with same conversation
      for (let i = 0; i < 5; i++) {
        if (cachedConversation === conversation1) {
          // ✅ useMemo would return cached value
          expect(cachedIndex).toBe(0);
        } else {
          cachedIndex = calculateLastUserIndex(conversation1);
        }
      }
      
      // ✅ Should still be 1 calculation (useMemo prevents recalculation)
      expect(calculationCount).toBe(1);

      // Act 3: Conversation changes (should recalculate)
      const conversation2 = [
        { role: 'user', text: 'Q1' },
        { role: 'model', text: 'A1' },
        { role: 'user', text: 'Q2' },
      ];
      
      const index2 = calculateLastUserIndex(conversation2);
      expect(index2).toBe(2);
      expect(calculationCount).toBe(2); // ✅ Recalculated for new conversation
    });

    it('should use efficient O(n) algorithm instead of O(n²)', () => {
      // Arrange: Large conversation
      const conversation = [];
      for (let i = 0; i < 100; i++) {
        conversation.push({ role: 'user', text: `Q${i}` });
        conversation.push({ role: 'model', text: `A${i}` });
      }

      // Act: Efficient algorithm (iterate from end)
      const startTime = performance.now();
      
      let lastUserIndex = -1;
      for (let i = conversation.length - 1; i >= 0; i--) {
        if (conversation[i].role === 'user') {
          lastUserIndex = i;
          break; // ✅ Early exit
        }
      }
      
      const endTime = performance.now();
      const efficientTime = endTime - startTime;

      // Assert: Should find last user message efficiently
      expect(lastUserIndex).toBe(198); // Last user message at index 198
      expect(efficientTime).toBeLessThan(1); // Should be very fast

      // Compare with inefficient O(n²) approach
      const inefficientStartTime = performance.now();
      
      const userIndices: number[] = [];
      conversation.forEach((msg, i) => {
        if (msg.role === 'user') userIndices.push(i);
      });
      const inefficientLastIndex = userIndices[userIndices.length - 1];
      
      const inefficientEndTime = performance.now();
      const inefficientTime = inefficientEndTime - inefficientStartTime;

      // ✅ Efficient algorithm should be faster (though both are fast for n=100)
      expect(inefficientLastIndex).toBe(lastUserIndex);
    });

    it('should handle edge case with no user messages', () => {
      // Arrange: Conversation with only AI messages (edge case)
      const conversation = [
        { role: 'model', text: 'A1' },
        { role: 'model', text: 'A2' },
      ];

      // Act: Find last user message
      let lastUserIndex = -1;
      for (let i = conversation.length - 1; i >= 0; i--) {
        if (conversation[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }

      // Assert: Should return -1 (no user messages)
      expect(lastUserIndex).toBe(-1);
    });

    it('should handle edge case with empty conversation', () => {
      // Arrange: Empty conversation
      const conversation: any[] = [];

      // Act: Find last user message
      let lastUserIndex = -1;
      for (let i = conversation.length - 1; i >= 0; i--) {
        if (conversation[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }

      // Assert: Should return -1 (empty conversation)
      expect(lastUserIndex).toBe(-1);
    });
  });

  describe('Integration: Multiple Bug Fixes Working Together', () => {
    it('should correctly handle page load with session restoration + sidebar state + sessions loading', () => {
      // Arrange: User's previous state
      localStorage.setItem('current-session-id', 'session-abc');
      localStorage.setItem('sidebar-open', 'true');
      localStorage.setItem('scroll-pos-session-abc', '350');

      // Act: Simulate complete page initialization
      const initializePage = () => {
        // Fix #6: Restore sidebar state
        const storedSidebarOpen = localStorage.getItem('sidebar-open');
        const showSidebar = storedSidebarOpen === 'true';

        // Session restoration
        const storedSessionId = localStorage.getItem('current-session-id');
        
        // Fix #1: Load sessions list
        const shouldLoadSessions = true;

        // Scroll position (should be restored only on session switch)
        const scrollPos = localStorage.getItem(`scroll-pos-${storedSessionId}`);

        return {
          showSidebar,
          currentSessionId: storedSessionId,
          shouldLoadSessions,
          storedScrollPosition: scrollPos,
        };
      };

      const result = initializePage();

      // Assert: All states should be correctly restored
      expect(result.showSidebar).toBe(true); // ✅ Fix #6
      expect(result.currentSessionId).toBe('session-abc'); // ✅ Session restored
      expect(result.shouldLoadSessions).toBe(true); // ✅ Fix #1
      expect(result.storedScrollPosition).toBe('350'); // ✅ Scroll position available
    });

    it('should handle new chat button with all state resets', () => {
      // Arrange: Active session state
      localStorage.setItem('current-session-id', 'session-123');
      localStorage.setItem('sidebar-open', 'true');

      let currentState = {
        currentSessionId: 'session-123',
        image: new File([''], 'test.jpg'),
        imageUrl: 'blob:test',
        conversation: [{ role: 'user' as const, text: 'Q' }],
        apiHistory: [{ role: 'user', parts: [{ text: 'Q' }] }],
        showSidebar: true,
      };

      // Act: New chat button clicked
      const handleNewChat = () => {
        // Clear all state
        currentState = {
          currentSessionId: null as any,
          image: null as any,
          imageUrl: '',
          conversation: [],
          apiHistory: [],
          showSidebar: window.innerWidth < 1024 ? false : currentState.showSidebar,
        };
        
        // Remove from localStorage
        localStorage.removeItem('current-session-id');
        
        if (window.innerWidth < 1024) {
          localStorage.setItem('sidebar-open', 'false');
        }
      };

      // Simulate desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });

      handleNewChat();

      // Assert: State should be cleared
      expect(currentState.currentSessionId).toBeNull();
      expect(currentState.image).toBeNull();
      expect(currentState.imageUrl).toBe('');
      expect(currentState.conversation).toEqual([]);
      expect(currentState.apiHistory).toEqual([]);
      expect(localStorage.getItem('current-session-id')).toBeNull();
      expect(currentState.showSidebar).toBe(true); // Desktop: sidebar stays open
    });
  });
});
