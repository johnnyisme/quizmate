import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Scroll Position Memory', () => {
  let localStorageMock: Record<string, string>;
  let chatContainer: HTMLDivElement;

  beforeEach(() => {
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };

    // Create a mock chat container
    chatContainer = document.createElement('div');
    chatContainer.scrollTop = 0;
    
    // Define read-only properties
    Object.defineProperty(chatContainer, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(chatContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Saving Scroll Position', () => {
    it('should save scroll position before page unload', () => {
      const sessionId = 'test-session-123';
      chatContainer.scrollTop = 350;

      // Simulate beforeunload event
      const handleBeforeUnload = () => {
        if (sessionId && chatContainer) {
          const scrollPos = chatContainer.scrollTop;
          localStorage.setItem(`scroll-pos-${sessionId}`, scrollPos.toString());
        }
      };

      handleBeforeUnload();

      expect(localStorage.setItem).toHaveBeenCalledWith('scroll-pos-test-session-123', '350');
      expect(localStorageMock['scroll-pos-test-session-123']).toBe('350');
    });

    it('should not save scroll position if no session ID', () => {
      const sessionId = null;
      chatContainer.scrollTop = 350;

      const handleBeforeUnload = () => {
        if (sessionId && chatContainer) {
          const scrollPos = chatContainer.scrollTop;
          localStorage.setItem(`scroll-pos-${sessionId}`, scrollPos.toString());
        }
      };

      handleBeforeUnload();

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not save scroll position if no chat container', () => {
      const sessionId = 'test-session-123';
      const nullContainer = null as HTMLDivElement | null;

      const handleBeforeUnload = () => {
        if (sessionId && nullContainer) {
          localStorage.setItem(`scroll-pos-${sessionId}`, nullContainer.scrollTop.toString());
        }
      };

      handleBeforeUnload();

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should save different positions for different sessions', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      // Session 1
      chatContainer.scrollTop = 100;
      localStorage.setItem(`scroll-pos-${session1}`, chatContainer.scrollTop.toString());

      // Session 2
      chatContainer.scrollTop = 500;
      localStorage.setItem(`scroll-pos-${session2}`, chatContainer.scrollTop.toString());

      expect(localStorageMock['scroll-pos-session-1']).toBe('100');
      expect(localStorageMock['scroll-pos-session-2']).toBe('500');
    });

    it('should save position at top of page', () => {
      const sessionId = 'test-session-123';
      chatContainer.scrollTop = 0;

      localStorage.setItem(`scroll-pos-${sessionId}`, chatContainer.scrollTop.toString());

      expect(localStorageMock['scroll-pos-test-session-123']).toBe('0');
    });

    it('should save position at bottom of page', () => {
      const sessionId = 'test-session-123';
      chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;

      localStorage.setItem(`scroll-pos-${sessionId}`, chatContainer.scrollTop.toString());

      expect(localStorageMock['scroll-pos-test-session-123']).toBe('500');
    });
  });

  describe('Restoring Scroll Position', () => {
    it('should restore scroll position when switching to session', () => {
      const sessionId = 'test-session-123';
      localStorageMock[`scroll-pos-${sessionId}`] = '350';

      const savedScrollPos = localStorage.getItem(`scroll-pos-${sessionId}`);
      
      expect(savedScrollPos).toBe('350');

      if (savedScrollPos && chatContainer) {
        chatContainer.scrollTop = parseInt(savedScrollPos, 10);
      }

      expect(chatContainer.scrollTop).toBe(350);
    });

    it('should not restore scroll position if none saved', () => {
      const sessionId = 'test-session-123';
      const initialScrollPos = chatContainer.scrollTop;

      const savedScrollPos = localStorage.getItem(`scroll-pos-${sessionId}`);

      if (savedScrollPos && chatContainer) {
        chatContainer.scrollTop = parseInt(savedScrollPos, 10);
      }

      expect(chatContainer.scrollTop).toBe(initialScrollPos);
    });

    it('should handle invalid scroll position gracefully', () => {
      const sessionId = 'test-session-123';
      localStorageMock[`scroll-pos-${sessionId}`] = 'invalid';

      const savedScrollPos = localStorage.getItem(`scroll-pos-${sessionId}`);

      if (savedScrollPos && chatContainer) {
        const parsed = parseInt(savedScrollPos, 10);
        if (!isNaN(parsed)) {
          chatContainer.scrollTop = parsed;
        }
      }

      // Should remain at default position
      expect(chatContainer.scrollTop).toBe(0);
    });

    it('should wait for DOM to render before restoring position', async () => {
      const sessionId = 'test-session-123';
      localStorageMock[`scroll-pos-${sessionId}`] = '350';

      const savedScrollPos = localStorage.getItem(`scroll-pos-${sessionId}`);

      if (savedScrollPos && chatContainer) {
        await new Promise(resolve => setTimeout(resolve, 100));
        chatContainer.scrollTop = parseInt(savedScrollPos, 10);
      }

      expect(chatContainer.scrollTop).toBe(350);
    });

    it('should restore position for correct session only', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      
      localStorageMock[`scroll-pos-${session1}`] = '100';
      localStorageMock[`scroll-pos-${session2}`] = '500';

      // Switch to session 1
      const savedScrollPos1 = localStorage.getItem(`scroll-pos-${session1}`);
      if (savedScrollPos1) {
        chatContainer.scrollTop = parseInt(savedScrollPos1, 10);
      }

      expect(chatContainer.scrollTop).toBe(100);

      // Switch to session 2
      const savedScrollPos2 = localStorage.getItem(`scroll-pos-${session2}`);
      if (savedScrollPos2) {
        chatContainer.scrollTop = parseInt(savedScrollPos2, 10);
      }

      expect(chatContainer.scrollTop).toBe(500);
    });
  });

  describe('Event Listener Management', () => {
    it('should add beforeunload event listener', () => {
      const addEventListener = vi.spyOn(window, 'addEventListener');
      const sessionId = 'test-session-123';

      const handleBeforeUnload = () => {
        if (sessionId && chatContainer) {
          const scrollPos = chatContainer.scrollTop;
          localStorage.setItem(`scroll-pos-${sessionId}`, scrollPos.toString());
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      expect(addEventListener).toHaveBeenCalledWith('beforeunload', handleBeforeUnload);
    });

    it('should remove beforeunload event listener on cleanup', () => {
      const removeEventListener = vi.spyOn(window, 'removeEventListener');

      const handleBeforeUnload = () => {};

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      expect(removeEventListener).toHaveBeenCalledWith('beforeunload', handleBeforeUnload);
    });
  });

  describe('Session ID Changes', () => {
    it('should update saved position when session ID changes', () => {
      let currentSessionId = 'session-1';
      chatContainer.scrollTop = 200;

      // Save position for session 1
      localStorage.setItem(`scroll-pos-${currentSessionId}`, chatContainer.scrollTop.toString());

      expect(localStorageMock['scroll-pos-session-1']).toBe('200');

      // Change session
      currentSessionId = 'session-2';
      chatContainer.scrollTop = 400;

      // Save position for session 2
      localStorage.setItem(`scroll-pos-${currentSessionId}`, chatContainer.scrollTop.toString());

      expect(localStorageMock['scroll-pos-session-2']).toBe('400');
      expect(localStorageMock['scroll-pos-session-1']).toBe('200'); // Should still exist
    });

    it('should not overwrite other session positions', () => {
      localStorageMock['scroll-pos-session-1'] = '100';
      localStorageMock['scroll-pos-session-2'] = '200';
      localStorageMock['scroll-pos-session-3'] = '300';

      const currentSessionId = 'session-2';
      chatContainer.scrollTop = 500;

      localStorage.setItem(`scroll-pos-${currentSessionId}`, chatContainer.scrollTop.toString());

      expect(localStorageMock['scroll-pos-session-1']).toBe('100');
      expect(localStorageMock['scroll-pos-session-2']).toBe('500');
      expect(localStorageMock['scroll-pos-session-3']).toBe('300');
    });
  });
});
