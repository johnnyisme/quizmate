// Custom hook for scroll management
import { useEffect, useCallback, RefObject } from 'react';

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

  // Auto-scroll to new question
  useEffect(() => {
    if (shouldScrollToQuestion.current && lastUserMessageRef.current && chatContainerRef.current) {
      shouldScrollToQuestion.current = false;
      
      const userMessage = lastUserMessageRef.current;
      const container = chatContainerRef.current;
      
      // Calculate question bubble position relative to container
      const containerRect = container.getBoundingClientRect();
      const messageRect = userMessage.getBoundingClientRect();
      const relativeTop = messageRect.top - containerRect.top;
      
      // Scroll to question position (leave 16px top spacing)
      container.scrollTo({
        top: container.scrollTop + relativeTop - 16,
        behavior: 'smooth'
      });
    }
  }, [displayConversation, shouldScrollToQuestion, lastUserMessageRef, chatContainerRef]);

  // Gemini App-like scroll effect: use requestAnimationFrame for smooth scrolling
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (isLoading && displayConversation.length > 0) {
      // Use requestAnimationFrame to ensure scroll executes in next paint cycle
      const rafId = requestAnimationFrame(() => {
        if (lastUserMessageRef.current) {
          const userMessage = lastUserMessageRef.current;
          const containerRect = container.getBoundingClientRect();
          const messageRect = userMessage.getBoundingClientRect();
          const relativeTop = messageRect.top - containerRect.top;
          
          container.scrollTo({
            top: container.scrollTop + relativeTop - 16,
            behavior: 'smooth'
          });
        }
      });
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [isLoading, chatContainerRef, lastUserMessageRef, displayConversation]);

  // Monitor scroll position to show/hide scroll buttons
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100; // 100px threshold
      
      // Show "scroll to top" button when scrolled more than 100px from top
      setShowScrollToTop(scrollTop > threshold);
      
      // Show "scroll to bottom" button when scrolled more than 100px from bottom
      setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - threshold);
    };

    // Initial check
    handleScroll();

    // Listen to scroll events
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [displayConversation, chatContainerRef, setShowScrollToTop, setShowScrollToBottom]);

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
