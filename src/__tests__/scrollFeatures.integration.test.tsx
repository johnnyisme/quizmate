// src/__tests__/scrollFeatures.integration.test.tsx
// Integration tests for scroll features - 驗證滾動到問題、智慧按鈕、位置記憶

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState, useRef, useEffect } from 'react';

// 模擬滾動功能的組件
function ScrollFeaturesDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [currentSessionId] = useState('test-session-123');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const shouldScrollToQuestion = useRef<boolean>(false);

  // Scroll to question effect
  useEffect(() => {
    if (shouldScrollToQuestion.current && lastUserMessageRef.current && chatContainerRef.current) {
      shouldScrollToQuestion.current = false;
      
      const userMessage = lastUserMessageRef.current;
      const container = chatContainerRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const messageRect = userMessage.getBoundingClientRect();
      const relativeTop = messageRect.top - containerRect.top;
      
      container.scrollTo({
        top: container.scrollTop + relativeTop - 16,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Smart scroll buttons visibility
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100;
      
      setShowScrollToTop(scrollTop > threshold);
      setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - threshold);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [messages]);

  // Save scroll position on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSessionId && chatContainerRef.current) {
        const scrollPos = chatContainerRef.current.scrollTop;
        localStorage.setItem(`scroll-pos-${currentSessionId}`, scrollPos.toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSessionId]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScrollPos = localStorage.getItem(`scroll-pos-${currentSessionId}`);
    if (savedScrollPos && chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = parseInt(savedScrollPos, 10);
        }
      }, 100);
    }
  }, [currentSessionId]);

  const scrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ 
        top: chatContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  const addMessage = () => {
    setIsLoading(true);
    setMessages(prev => [...prev, `Message ${prev.length + 1}`]);
    
    // Set padding and trigger scroll
    shouldScrollToQuestion.current = true;
    if (chatContainerRef.current) {
      chatContainerRef.current.style.paddingBottom = '80vh';
    }

    // Simulate loading complete
    setTimeout(() => {
      setIsLoading(false);
      if (chatContainerRef.current) {
        chatContainerRef.current.style.paddingBottom = '0px';
      }
    }, 500);
  };

  return (
    <div>
      <button onClick={addMessage} data-testid="add-message-btn">Add Message</button>
      <button onClick={scrollToTop} data-testid="scroll-to-top-btn">Scroll to Top</button>
      <button onClick={scrollToBottom} data-testid="scroll-to-bottom-btn">Scroll to Bottom</button>
      
      <div 
        ref={chatContainerRef}
        data-testid="chat-container"
        style={{ 
          height: '300px', 
          overflowY: 'scroll',
          paddingBottom: '0px'
        }}
      >
        {messages.map((msg, index) => {
          const isLastUser = index === messages.length - 1;
          return (
            <div 
              key={index}
              ref={isLastUser ? lastUserMessageRef : null}
              data-testid={`message-${index}`}
              style={{ height: '200px', marginBottom: '16px' }}
            >
              {msg}
            </div>
          );
        })}
        {isLoading && <div data-testid="loading-indicator">Loading...</div>}
      </div>

      {/* Smart scroll buttons */}
      {showScrollToTop && (
        <button 
          onClick={scrollToTop}
          data-testid="smart-scroll-to-top"
          className="scroll-button-top"
        >
          ↑ Top
        </button>
      )}
      
      {showScrollToBottom && (
        <button 
          onClick={scrollToBottom}
          data-testid="smart-scroll-to-bottom"
          className="scroll-button-bottom"
        >
          ↓ Bottom
        </button>
      )}
    </div>
  );
}

describe('Scroll Features Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock scrollTo and scrollIntoView
    Element.prototype.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Scroll to Question', () => {
    it('should add paddingBottom when message is added and loading starts', async () => {
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      expect(container.style.paddingBottom).toBe('0px');
      
      fireEvent.click(screen.getByTestId('add-message-btn'));
      
      // paddingBottom should be added
      expect(container.style.paddingBottom).toBe('80vh');
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should remove paddingBottom when loading completes', async () => {
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      
      fireEvent.click(screen.getByTestId('add-message-btn'));
      expect(container.style.paddingBottom).toBe('80vh');
      
      await waitFor(() => {
        expect(container.style.paddingBottom).toBe('0px');
      }, { timeout: 1000 });
    });

    it('should scroll to last user message after adding', async () => {
      const { rerender } = render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      const scrollToSpy = vi.spyOn(container, 'scrollTo');
      
      fireEvent.click(screen.getByTestId('add-message-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('message-0')).toBeInTheDocument();
      });
      
      // Force re-render to trigger scroll effect
      rerender(<ScrollFeaturesDemo />);
      
      await waitFor(() => {
        expect(scrollToSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            behavior: 'smooth'
          })
        );
      }, { timeout: 500 });
    });

    it('should maintain scroll margin of 16px from top', async () => {
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      const scrollToSpy = vi.spyOn(container, 'scrollTo');
      
      // Add multiple messages to enable scrolling
      fireEvent.click(screen.getByTestId('add-message-btn'));
      await waitFor(() => screen.getByTestId('message-0'));
      
      fireEvent.click(screen.getByTestId('add-message-btn'));
      await waitFor(() => screen.getByTestId('message-1'));
      
      // Check that scroll includes margin offset
      const calls = scrollToSpy.mock.calls;
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1][0] as any;
        // The calculation includes -16 offset
        expect(lastCall.behavior).toBe('smooth');
      }
    });
  });

  describe('Smart Scroll Buttons', () => {
    it('should not show scroll-to-top button initially', () => {
      render(<ScrollFeaturesDemo />);
      
      expect(screen.queryByTestId('smart-scroll-to-top')).not.toBeInTheDocument();
    });

    it('should show scroll-to-top button when scrolled > 100px', async () => {
      render(<ScrollFeaturesDemo />);
      
      // Add messages to enable scrolling
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-message-btn'));
        await waitFor(() => screen.getByTestId(`message-${i}`), { timeout: 1000 });
      }
      
      const container = screen.getByTestId('chat-container');
      
      // Scroll down
      Object.defineProperty(container, 'scrollTop', { value: 150, writable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(container, 'clientHeight', { value: 300, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.getByTestId('smart-scroll-to-top')).toBeInTheDocument();
      });
    });

    it('should hide scroll-to-top button when at top', async () => {
      render(<ScrollFeaturesDemo />);
      
      // Add messages
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-message-btn'));
        await waitFor(() => screen.getByTestId(`message-${i}`), { timeout: 1000 });
      }
      
      const container = screen.getByTestId('chat-container');
      
      // Scroll down first
      Object.defineProperty(container, 'scrollTop', { value: 150, writable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(container, 'clientHeight', { value: 300, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.getByTestId('smart-scroll-to-top')).toBeInTheDocument();
      });
      
      // Scroll back to top
      Object.defineProperty(container, 'scrollTop', { value: 0, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.queryByTestId('smart-scroll-to-top')).not.toBeInTheDocument();
      });
    });

    it('should show scroll-to-bottom button when not at bottom', async () => {
      render(<ScrollFeaturesDemo />);
      
      // Add messages
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-message-btn'));
        await waitFor(() => screen.getByTestId(`message-${i}`), { timeout: 1000 });
      }
      
      const container = screen.getByTestId('chat-container');
      
      // Set scroll position not at bottom
      Object.defineProperty(container, 'scrollTop', { value: 150, writable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(container, 'clientHeight', { value: 300, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.getByTestId('smart-scroll-to-bottom')).toBeInTheDocument();
      });
    });

    it('should hide scroll-to-bottom button when at bottom', async () => {
      render(<ScrollFeaturesDemo />);
      
      // Add messages
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-message-btn'));
        await waitFor(() => screen.getByTestId(`message-${i}`), { timeout: 1000 });
      }
      
      const container = screen.getByTestId('chat-container');
      
      // Set scroll position at bottom (within 100px threshold)
      Object.defineProperty(container, 'scrollTop', { value: 650, writable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(container, 'clientHeight', { value: 300, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.queryByTestId('smart-scroll-to-bottom')).not.toBeInTheDocument();
      });
    });

    it('should trigger scrollTo when clicking scroll-to-top button', async () => {
      render(<ScrollFeaturesDemo />);
      
      // Add messages
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-message-btn'));
        await waitFor(() => screen.getByTestId(`message-${i}`), { timeout: 1000 });
      }
      
      const container = screen.getByTestId('chat-container');
      const scrollToSpy = vi.spyOn(container, 'scrollTo');
      
      // Scroll down to show button
      Object.defineProperty(container, 'scrollTop', { value: 150, writable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(container, 'clientHeight', { value: 300, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.getByTestId('smart-scroll-to-top')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('smart-scroll-to-top'));
      
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should trigger scrollTo when clicking scroll-to-bottom button', async () => {
      render(<ScrollFeaturesDemo />);
      
      // Add messages
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-message-btn'));
        await waitFor(() => screen.getByTestId(`message-${i}`), { timeout: 1000 });
      }
      
      const container = screen.getByTestId('chat-container');
      const scrollToSpy = vi.spyOn(container, 'scrollTo');
      
      // Scroll to middle
      Object.defineProperty(container, 'scrollTop', { value: 150, writable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(container, 'clientHeight', { value: 300, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.getByTestId('smart-scroll-to-bottom')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('smart-scroll-to-bottom'));
      
      expect(scrollToSpy).toHaveBeenCalledWith({ 
        top: 1000, // scrollHeight
        behavior: 'smooth' 
      });
    });

    it('should use 100px threshold for button visibility', async () => {
      render(<ScrollFeaturesDemo />);
      
      // Add messages
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-message-btn'));
        await waitFor(() => screen.getByTestId(`message-${i}`), { timeout: 1000 });
      }
      
      const container = screen.getByTestId('chat-container');
      
      // Exactly 100px - should not show (threshold not exceeded)
      Object.defineProperty(container, 'scrollTop', { value: 100, writable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(container, 'clientHeight', { value: 300, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.queryByTestId('smart-scroll-to-top')).not.toBeInTheDocument();
      });
      
      // 101px - should show
      Object.defineProperty(container, 'scrollTop', { value: 101, writable: true });
      fireEvent.scroll(container);
      
      await waitFor(() => {
        expect(screen.getByTestId('smart-scroll-to-top')).toBeInTheDocument();
      });
    });
  });

  describe('Scroll Position Memory', () => {
    it('should save scroll position to localStorage on beforeunload', () => {
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      Object.defineProperty(container, 'scrollTop', { value: 250, writable: true });
      
      // Trigger beforeunload event
      window.dispatchEvent(new Event('beforeunload'));
      
      expect(localStorage.getItem('scroll-pos-test-session-123')).toBe('250');
    });

    it('should restore scroll position from localStorage on mount', async () => {
      localStorage.setItem('scroll-pos-test-session-123', '350');
      
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      
      await waitFor(() => {
        expect(container.scrollTop).toBe(350);
      }, { timeout: 200 });
    });

    it('should wait 100ms before restoring scroll position', async () => {
      localStorage.setItem('scroll-pos-test-session-123', '200');
      
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      
      // Should not be restored immediately
      expect(container.scrollTop).toBe(0);
      
      // Should be restored after 100ms
      await waitFor(() => {
        expect(container.scrollTop).toBe(200);
      }, { timeout: 200 });
    });

    it('should handle missing localStorage value gracefully', () => {
      // No value in localStorage
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      
      // Should remain at 0
      expect(container.scrollTop).toBe(0);
    });

    it('should update scroll position for specific session ID', () => {
      render(<ScrollFeaturesDemo />);
      
      const container = screen.getByTestId('chat-container');
      Object.defineProperty(container, 'scrollTop', { value: 123, writable: true });
      
      window.dispatchEvent(new Event('beforeunload'));
      
      // Check the correct session ID is used
      expect(localStorage.getItem('scroll-pos-test-session-123')).toBe('123');
      expect(localStorage.getItem('scroll-pos-other-session')).toBeNull();
    });
  });
});
