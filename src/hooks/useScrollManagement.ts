// Custom hook for scroll management
import { useEffect, useCallback, RefObject, useRef } from 'react';

type ScrollManagementProps = {
  chatContainerRef: RefObject<HTMLDivElement | null>;
  lastUserMessageRef: RefObject<HTMLDivElement | null>;
  currentSessionId: string | null;
  displayConversation: any[];
  isLoading: boolean;
  shouldScrollToQuestion: RefObject<boolean>;
  setShowScrollToTop: (show: boolean) => void;
  setShowScrollToBottom: (show: boolean) => void;
};

export const useScrollManagement = ({
  chatContainerRef,
  lastUserMessageRef,
  currentSessionId,
  displayConversation,
  isLoading,
  shouldScrollToQuestion,
  setShowScrollToTop,
  setShowScrollToBottom,
}: ScrollManagementProps) => {

  // Track whether auto-scroll should be enabled (disable when user manually scrolls)
  const shouldAutoScroll = useRef<boolean>(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSessionIdRef = useRef<string | null>(null);
  const prevHasAIMessageRef = useRef<boolean>(false);
  const isAutoScrollingRef = useRef<boolean>(false); // ✅ Track if we're currently auto-scrolling
  const hasRestoredScrollRef = useRef<boolean>(false); // ✅ Track if scroll has been restored for current session

  // Auto-scroll to new question
  useEffect(() => {
    if (shouldScrollToQuestion.current && lastUserMessageRef.current && chatContainerRef.current) {
      shouldScrollToQuestion.current = false;
      
      // Use requestAnimationFrame to ensure DOM is fully updated
      const rafId = requestAnimationFrame(() => {
        const userMessage = lastUserMessageRef.current;
        const container = chatContainerRef.current;
        
        if (!userMessage || !container) return;
        
        // ✅ Use getBoundingClientRect for accurate position calculation
        const messageRect = userMessage.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const relativeTop = messageRect.top - containerRect.top;
        const scrollTop = container.scrollTop;
        
        // Scroll to message position (leave 16px top spacing)
        container.scrollTo({
          top: scrollTop + relativeTop - 16,
          behavior: 'smooth'
        });
      });
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [displayConversation, lastUserMessageRef, chatContainerRef]);

  // Gemini App-like scroll effect during AI response
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (isLoading && shouldAutoScroll.current) {
      isAutoScrollingRef.current = true; // ✅ Mark that we're auto-scrolling
      
      const rafId = requestAnimationFrame(() => {
        if (lastUserMessageRef.current && shouldAutoScroll.current) {
          const userMessage = lastUserMessageRef.current;
          const containerRect = container.getBoundingClientRect();
          const messageRect = userMessage.getBoundingClientRect();
          const relativeTop = messageRect.top - containerRect.top;
          
          container.scrollTo({
            top: container.scrollTop + relativeTop - 16,
            behavior: 'smooth'
          });
          
          // ✅ After scroll completes, allow manual scroll detection again
          const scrollHandler = () => {
            isAutoScrollingRef.current = false;
            container.removeEventListener('scroll', scrollHandler);
          };
          container.addEventListener('scroll', scrollHandler, { once: true });
        }
      });
      
      return () => {
        cancelAnimationFrame(rafId);
        isAutoScrollingRef.current = false;
      };
    }
  }, [isLoading, chatContainerRef, lastUserMessageRef]);

  // Monitor scroll position to show/hide scroll buttons
  const prevShowStateRef = useRef({ top: false, bottom: false });
  
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100; // 100px threshold
      
      const newShowTop = scrollTop > threshold;
      const newShowBottom = scrollTop < scrollHeight - clientHeight - threshold;
      
      // ✅ Only update if values changed (prevent unnecessary re-renders)
      if (newShowTop !== prevShowStateRef.current.top) {
        setShowScrollToTop(newShowTop);
        prevShowStateRef.current.top = newShowTop;
      }
      
      if (newShowBottom !== prevShowStateRef.current.bottom) {
        setShowScrollToBottom(newShowBottom);
        prevShowStateRef.current.bottom = newShowBottom;
      }
    };

    // Initial check
    handleScroll();

    // Listen to scroll events
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [displayConversation, chatContainerRef, setShowScrollToTop, setShowScrollToBottom]);

  // Detect user manual scroll and stop auto-scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleUserScroll = () => {
      // ✅ Only disable auto-scroll if it's manual scroll (not triggered by auto-scroll)
      if (isLoading && !isAutoScrollingRef.current) {
        shouldAutoScroll.current = false;
        
        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current as ReturnType<typeof setTimeout>);
        }
      }
    };

    container.addEventListener('scroll', handleUserScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleUserScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current as ReturnType<typeof setTimeout>);
      }
    };
  }, [isLoading, chatContainerRef]);

  // Re-enable auto-scroll only when AI message appears (not on user message)
  useEffect(() => {
    // Check if there's an AI message in the conversation
    const hasAIMessage = displayConversation.some(msg => msg.role === 'model');
    
    // Only enable auto-scroll if AI message just appeared (transition from no AI to has AI)
    if (hasAIMessage && !prevHasAIMessageRef.current && isLoading) {
      shouldAutoScroll.current = true;
    }
    
    // Update prev state
    prevHasAIMessageRef.current = hasAIMessage;
  }, [displayConversation, isLoading]);

  // Restore scroll position ONLY when switching between sessions (detected via prevSessionIdRef)
  // NOT restored during same-session updates (e.g., AI streaming responses)
  useEffect(() => {
    if (!currentSessionId || !chatContainerRef.current) return;
    
    // Check if this is a new session (either initial load or session switch)
    const isSessionChange = prevSessionIdRef.current === null || prevSessionIdRef.current !== currentSessionId;
    
    if (isSessionChange) {
      // Wait for conversation data to load
      if (displayConversation.length === 0) {
        hasRestoredScrollRef.current = false; // Reset flag, wait for data
        return;
      }
      
      // Only restore once per session
      if (!hasRestoredScrollRef.current) {
        const storedScrollPos = localStorage.getItem(`scroll-pos-${currentSessionId}`);
        console.log('Session changed, stored position:', storedScrollPos, 'Session:', currentSessionId);
        
        if (storedScrollPos) {
          const scrollPos = parseInt(storedScrollPos, 10);
          const container = chatContainerRef.current;
          
          console.log('Before scroll - scrollTop:', container.scrollTop, 'scrollHeight:', container.scrollHeight);
          
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            // Try multiple methods for iOS compatibility
            container.scrollTop = scrollPos;
            container.scrollTo(0, scrollPos);
            container.scrollTo({ top: scrollPos, behavior: 'auto' });
            
            console.log('After scroll - scrollTop:', container.scrollTop, 'Target was:', scrollPos);
          });
        }
        
        hasRestoredScrollRef.current = true; // Mark as restored
      }
      
      // Update prev session ID
      prevSessionIdRef.current = currentSessionId;
    }
  }, [currentSessionId, chatContainerRef, displayConversation]);

  // Save scroll position on page unload
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
  }, [currentSessionId, chatContainerRef]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [chatContainerRef]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ 
        top: chatContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [chatContainerRef]);

  return {
    scrollToTop,
    scrollToBottom,
  };
};

