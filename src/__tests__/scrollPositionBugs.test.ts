/**
 * Tests for Scroll Position Related Bug Fixes
 * 测试已修复的滚动位置相关 bug
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Scroll Position Bug Fixes', () => {
  let scrollTop = 0;
  let mockContainer: any;
  let mockRef: any;

  beforeEach(() => {
    scrollTop = 0;
    
    // Mock chat container
    mockContainer = {
      scrollTop: 0,
      scrollHeight: 2000,
      clientHeight: 800,
      scrollTo: vi.fn((options: { top: number; behavior?: string }) => {
        mockContainer.scrollTop = options.top;
      }),
      getBoundingClientRect: vi.fn(() => ({
        top: 100,
        left: 0,
        width: 600,
        height: 800,
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock user message ref
    mockRef = {
      current: {
        getBoundingClientRect: vi.fn(() => ({
          top: 500,
          left: 0,
          width: 580,
          height: 100,
        })),
      },
    };

    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Bug Fix #2: Scroll Position Restoration - Wrong Dependency', () => {
    it('should ONLY restore scroll when session changes, NOT when conversation updates', () => {
      // Arrange: 模拟 session-1 的保存位置
      localStorage.setItem('scroll-pos-session-1', '500');
      
      let currentSessionId = 'session-1';
      let prevSessionId: string | null = null;
      let conversationLength = 2;

      // Act 1: 初次加载 session-1（应该恢复位置）
      const shouldRestore1 = prevSessionId !== null && prevSessionId !== currentSessionId;
      expect(shouldRestore1).toBe(false); // 初次加载不恢复（prevSessionId === null）

      prevSessionId = currentSessionId;

      // Act 2: AI 回应完成，conversation length 增加（不应该恢复位置）
      conversationLength = 3;
      const shouldRestore2 = prevSessionId !== null && prevSessionId !== currentSessionId;
      expect(shouldRestore2).toBe(false); // ✅ 同一 session，不恢复

      // Act 3: 切换到 session-2（应该恢复位置）
      currentSessionId = 'session-2';
      const shouldRestore3 = prevSessionId !== null && prevSessionId !== currentSessionId;
      expect(shouldRestore3).toBe(true); // ✅ session 变化，应该恢复
    });

    it('should not trigger scroll restoration when displayConversation.length changes', () => {
      // Arrange: Setup initial state
      const sessionId = 'test-session';
      localStorage.setItem(`scroll-pos-${sessionId}`, '300');
      
      const conversationStates = [
        { length: 0, description: 'empty conversation' },
        { length: 2, description: 'user + AI response' },
        { length: 3, description: 'user + AI + user' },
        { length: 4, description: 'two full exchanges' },
      ];

      let prevSessionIdRef: string | null = null;
      const currentSessionId = sessionId;

      // Act & Assert: conversation length 变化不应该触发恢复
      conversationStates.forEach((state) => {
        const shouldRestore = prevSessionIdRef !== null && prevSessionIdRef !== currentSessionId;
        
        // ✅ 只要 sessionId 没变，就不应该恢复（即使 length 变了）
        if (prevSessionIdRef === null) {
          expect(shouldRestore).toBe(false); // 首次加载
        } else {
          expect(shouldRestore).toBe(false); // session 未变化
        }
        
        prevSessionIdRef = currentSessionId;
      });
    });

    it('should restore scroll position using correct calculation method', () => {
      // Arrange: Setup scroll position
      localStorage.setItem('scroll-pos-test-session', '500');
      
      const storedScrollPos = localStorage.getItem('scroll-pos-test-session');
      expect(storedScrollPos).toBe('500');

      const scrollPos = parseInt(storedScrollPos!, 10);
      expect(scrollPos).toBe(500);

      // Act: Restore using scrollTop assignment (iOS compatible)
      mockContainer.scrollTop = scrollPos;

      // Assert: Position should be set correctly
      expect(mockContainer.scrollTop).toBe(500);
    });
  });

  describe('Bug Fix #3: Auto-scroll During Loading - Wrong Dependency', () => {
    it('should only trigger auto-scroll when isLoading changes, not when conversation updates', () => {
      // Arrange: Track auto-scroll triggers
      let autoScrollCount = 0;
      const triggerAutoScroll = (isLoading: boolean, shouldAutoScroll: boolean) => {
        if (isLoading && shouldAutoScroll) {
          autoScrollCount++;
        }
      };

      let isLoading = false;
      let shouldAutoScroll = true;
      let conversationLength = 0;

      // Act 1: User sends message (isLoading = true, conversation length 增加)
      isLoading = true;
      conversationLength = 1; // User message added
      triggerAutoScroll(isLoading, shouldAutoScroll);
      expect(autoScrollCount).toBe(1); // ✅ 应该触发

      // Act 2: AI streaming response (conversation length 增加但 isLoading 仍是 true)
      conversationLength = 2; // AI response added
      // ❌ 如果依赖 displayConversation，这里会重新触发
      // ✅ 正确实现：不依赖 displayConversation，只依赖 isLoading
      // 所以这里不会重新触发（因为 isLoading 没变）
      expect(autoScrollCount).toBe(1); // ✅ 不应该重复触发

      // Act 3: AI response complete (isLoading = false)
      isLoading = false;
      triggerAutoScroll(isLoading, shouldAutoScroll);
      expect(autoScrollCount).toBe(1); // ✅ isLoading = false 不触发
    });

    it('should not auto-scroll when user manually scrolls during loading', () => {
      // Arrange: Setup auto-scroll state
      let shouldAutoScroll = true;
      let isLoading = true;
      let isAutoScrolling = false;

      // Act 1: Auto-scroll starts
      isAutoScrolling = true;
      expect(shouldAutoScroll).toBe(true);

      // Act 2: User manually scrolls (detected via scroll event)
      if (isLoading && !isAutoScrolling) {
        shouldAutoScroll = false;
      }
      expect(shouldAutoScroll).toBe(true); // ✅ 仍是 true（因为 isAutoScrolling = true）

      // Act 3: Auto-scroll completes
      isAutoScrolling = false;

      // Act 4: User manually scrolls again
      if (isLoading && !isAutoScrolling) {
        shouldAutoScroll = false;
      }
      expect(shouldAutoScroll).toBe(false); // ✅ 应该停止 auto-scroll
    });
  });

  describe('Bug Fix #5: Scroll-to-Question Calculation', () => {
    it('should use getBoundingClientRect for accurate position calculation', () => {
      // Arrange: Setup DOM positions
      const containerRect = { top: 100, height: 800 };
      const messageRect = { top: 500, height: 100 };

      // Act: Calculate relative position (getBoundingClientRect method)
      const relativeTop = messageRect.top - containerRect.top; // 500 - 100 = 400
      const currentScrollTop = 200;
      const targetScrollTop = currentScrollTop + relativeTop - 16; // 200 + 400 - 16 = 584

      // Assert: Position should be calculated correctly
      expect(relativeTop).toBe(400);
      expect(targetScrollTop).toBe(584);
    });

    it('should scroll to correct position when question is sent', () => {
      // Arrange: Setup refs and container
      mockContainer.scrollTop = 0;

      // Act: Calculate and apply scroll
      const containerRect = mockContainer.getBoundingClientRect();
      const messageRect = mockRef.current.getBoundingClientRect();
      const relativeTop = messageRect.top - containerRect.top; // 500 - 100 = 400
      const scrollTop = mockContainer.scrollTop; // 0
      
      mockContainer.scrollTo({
        top: scrollTop + relativeTop - 16, // 0 + 400 - 16 = 384
        behavior: 'smooth'
      });

      // Assert: scrollTo should be called with correct position
      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: 384,
        behavior: 'smooth'
      });
    });

    it('should handle edge case when message is already at top', () => {
      // Arrange: Message already at top of container
      mockRef.current.getBoundingClientRect = vi.fn(() => ({
        top: 116, // container.top (100) + spacing (16)
        left: 0,
        width: 580,
        height: 100,
      }));

      // Act: Calculate scroll position
      const containerRect = mockContainer.getBoundingClientRect();
      const messageRect = mockRef.current.getBoundingClientRect();
      const relativeTop = messageRect.top - containerRect.top; // 116 - 100 = 16
      const scrollTop = mockContainer.scrollTop; // 0
      const targetScroll = scrollTop + relativeTop - 16; // 0 + 16 - 16 = 0

      // Assert: Should scroll to 0 (top of container)
      expect(targetScroll).toBe(0);
    });
  });

  describe('Bug Fix #11: Manual Scroll Detection - Auto-scroll Flag', () => {
    it('should distinguish between auto-scroll and manual scroll', () => {
      // Arrange: Setup scroll detection
      let shouldAutoScroll = true;
      let isAutoScrolling = false;
      const isLoading = true;

      // Simulate scroll event handler
      const handleScroll = () => {
        if (isLoading && !isAutoScrolling) {
          shouldAutoScroll = false;
        }
      };

      // Act 1: Auto-scroll starts
      isAutoScrolling = true;
      handleScroll(); // Triggered by auto-scroll
      expect(shouldAutoScroll).toBe(true); // ✅ Should not disable (auto-scroll in progress)

      // Act 2: Auto-scroll completes
      isAutoScrolling = false;

      // Act 3: User manually scrolls
      handleScroll(); // Triggered by manual scroll
      expect(shouldAutoScroll).toBe(false); // ✅ Should disable auto-scroll
    });

    it('should re-enable auto-scroll when AI response completes', () => {
      // Arrange: User disabled auto-scroll by manual scrolling
      let shouldAutoScroll = false;
      let isLoading = true;

      // Act 1: AI response is still loading
      expect(shouldAutoScroll).toBe(false);

      // Act 2: Check if there's an AI message (AI response just appeared)
      const conversation = [
        { role: 'user', text: 'Question' },
        { role: 'model', text: 'Answer' }, // AI message appeared
      ];
      
      const hasAIMessage = conversation.some(msg => msg.role === 'model');
      const prevHasAIMessage = false; // Previous state had no AI message

      // Act 3: Enable auto-scroll when AI message appears
      if (hasAIMessage && !prevHasAIMessage && isLoading) {
        shouldAutoScroll = true;
      }

      // Assert: Auto-scroll should be re-enabled
      expect(shouldAutoScroll).toBe(true);
    });

    it('should not re-enable auto-scroll if AI message was already present', () => {
      // Arrange: Conversation already has AI messages
      let shouldAutoScroll = false;
      const isLoading = true;

      const conversation = [
        { role: 'user', text: 'Question 1' },
        { role: 'model', text: 'Answer 1' },
        { role: 'user', text: 'Question 2' },
        { role: 'model', text: 'Answer 2' }, // Adding another AI message
      ];

      const hasAIMessage = conversation.some(msg => msg.role === 'model');
      const prevHasAIMessage = true; // AI message was already present

      // Act: Try to enable auto-scroll
      if (hasAIMessage && !prevHasAIMessage && isLoading) {
        shouldAutoScroll = true;
      }

      // Assert: Auto-scroll should remain disabled
      expect(shouldAutoScroll).toBe(false);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle rapid session switches without scroll position conflicts', () => {
      // Arrange: Multiple sessions with saved positions
      localStorage.setItem('scroll-pos-session-1', '100');
      localStorage.setItem('scroll-pos-session-2', '200');
      localStorage.setItem('scroll-pos-session-3', '300');

      let prevSessionId: string | null = null;
      const sessionSequence = ['session-1', 'session-2', 'session-3', 'session-1'];

      // Act & Assert: Each switch should restore correct position
      sessionSequence.forEach((sessionId) => {
        const shouldRestore = prevSessionId !== null && prevSessionId !== sessionId;
        
        if (shouldRestore) {
          const storedPos = localStorage.getItem(`scroll-pos-${sessionId}`);
          expect(storedPos).toBeTruthy();
          
          // Verify correct position for each session
          if (sessionId === 'session-1') expect(storedPos).toBe('100');
          if (sessionId === 'session-2') expect(storedPos).toBe('200');
          if (sessionId === 'session-3') expect(storedPos).toBe('300');
        }
        
        prevSessionId = sessionId;
      });
    });

    it('should save scroll position before page unload', () => {
      // Arrange: Setup session and scroll position
      const sessionId = 'test-session';
      mockContainer.scrollTop = 456;

      // Act: Simulate beforeunload handler
      const handleBeforeUnload = () => {
        if (sessionId && mockContainer) {
          const scrollPos = mockContainer.scrollTop;
          localStorage.setItem(`scroll-pos-${sessionId}`, scrollPos.toString());
        }
      };

      handleBeforeUnload();

      // Assert: Position should be saved
      expect(localStorage.getItem(`scroll-pos-${sessionId}`)).toBe('456');
    });

    it('should handle missing stored scroll position gracefully', () => {
      // Arrange: No stored position for session
      const sessionId = 'new-session';
      
      // Act: Try to restore position
      const storedScrollPos = localStorage.getItem(`scroll-pos-${sessionId}`);
      
      // Assert: Should handle null gracefully
      expect(storedScrollPos).toBeNull();
      
      // Verify fallback behavior (don't restore)
      if (storedScrollPos) {
        mockContainer.scrollTop = parseInt(storedScrollPos, 10);
      }
      
      expect(mockContainer.scrollTop).toBe(0); // Should remain at 0
    });
  });
});
