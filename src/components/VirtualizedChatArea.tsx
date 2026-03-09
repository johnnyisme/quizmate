'use client';
// Virtualized Chat Area component - Optimized message rendering with react-virtuoso
import React, { useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import MessageBubble from './MessageBubble';
import { DisplayMessage } from '@/hooks/useChatState';
import type { VirtuosoHandle } from 'react-virtuoso';

// Dynamic import for VirtualList wrapper (client-side only)
const VirtualList = dynamic(() => import('./VirtualList'), { ssr: false });

interface VirtualizedChatAreaProps {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  lastUserMessageRef: React.RefObject<HTMLDivElement | null>;
  displayConversation: DisplayMessage[];
  selectedMessages: Set<number>;
  copiedMessageIndex: number | null;
  isSelectMode: boolean;
  isLoading: boolean;
  imageUrl: string;
  isDark: boolean;
  onUploadClick: () => void;
  onToggleMessageSelect: (index: number) => void;
  onCopyMessage: (text: string, index: number) => void;
  onEnterShareMode: (index: number) => void;
  onLongPressStart: (index: number) => void;
  onLongPressEnd: () => void;
  onImagePreview: (imageUrl: string) => void;
  setShowScrollToTop: (show: boolean) => void;
  setShowScrollToBottom: (show: boolean) => void;
}

export interface VirtualizedChatAreaHandle {
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

export const VirtualizedChatArea = forwardRef<VirtualizedChatAreaHandle, VirtualizedChatAreaProps>(({
  chatContainerRef,
  lastUserMessageRef,
  displayConversation,
  selectedMessages,
  copiedMessageIndex,
  isSelectMode,
  isLoading,
  imageUrl,
  isDark,
  onUploadClick,
  onToggleMessageSelect,
  onCopyMessage,
  onEnterShareMode,
  onLongPressStart,
  onLongPressEnd,
  onImagePreview,
  setShowScrollToTop,
  setShowScrollToBottom,
}: VirtualizedChatAreaProps, ref) => {
  const listRef = useRef<VirtuosoHandle>(null);
  const wasAtBottomRef = useRef(true);

  // Manual scroll detection to handle 80vh padding issue
  const checkIfAtBottom = () => {
    const container = chatContainerRef.current;
    if (!container) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    // Consider "at bottom" if within 50px of the bottom (ignoring padding)
    const threshold = 50;
    const actualContentHeight = scrollHeight - (isLoading ? window.innerHeight * 0.8 : 0);
    return scrollTop + clientHeight >= actualContentHeight - threshold;
  };

  // Expose scroll methods to parent
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      listRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
    },
    scrollToBottom: () => {
      if (displayConversation.length > 0) {
        listRef.current?.scrollToIndex({ 
          index: displayConversation.length - 1, 
          align: 'end', 
          behavior: 'smooth' 
        });
      }
    }
  }), [displayConversation.length]);

  // Handle scroll state changes for top/bottom buttons
  const handleAtTopStateChange = (atTop: boolean) => {
    setShowScrollToTop(!atTop);
  };

  const handleAtBottomStateChange = (atBottom: boolean) => {
    setShowScrollToBottom(!atBottom);
  };

  // Calculate last user message index
  const lastUserMessageIndex = useMemo(() => {
    for (let i = displayConversation.length - 1; i >= 0; i--) {
      if (displayConversation[i].role === 'user') {
        return i;
      }
    }
    return -1;
  }, [displayConversation]);

  // Track previous conversation state
  const prevConversationRef = useRef<typeof displayConversation>([]);
  
  // Auto-scroll to bottom ONLY when user sends a message (not during AI response)
  useEffect(() => {
    const prev = prevConversationRef.current;
    const current = displayConversation;
    
    // Check if a new message was added
    if (current.length > prev.length) {
      const newMessage = current[current.length - 1];
      
      // Only scroll if it's a user message (not AI response)
      if (newMessage.role === 'user') {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: current.length - 1,
            align: 'start',  // Align to top of viewport (loading animation at top, blank below)
            behavior: 'smooth'
          });
        }, 100);
      }
    }
    
    // Update ref
    prevConversationRef.current = current;
  }, [displayConversation]);

  // Update wasAtBottom when scroll state changes
  const handleAtBottomChange = (atBottom: boolean) => {
    wasAtBottomRef.current = atBottom;
    // Only update button visibility when NOT loading
    // When loading, button is controlled separately (always visible due to 80vh padding)
    if (!isLoading) {
      setShowScrollToBottom(!atBottom);
    }
  };
  
  // Initialize button state when conversation appears
  useEffect(() => {
    if (displayConversation.length > 0) {
      setShowScrollToBottom(true);
    } else {
      setShowScrollToBottom(false);
    }
  }, [displayConversation.length > 0, setShowScrollToBottom]);
  
  // Control button visibility during loading
  useEffect(() => {
    if (isLoading) {
      // When loading starts, always show button
      setShowScrollToBottom(true);
    } else {
      // When loading ends, check if we're at bottom after a delay
      setTimeout(() => {
        const atBottom = checkIfAtBottom();
        setShowScrollToBottom(!atBottom);
      }, 200);
    }
  }, [isLoading, setShowScrollToBottom]);

  // Monitor scroll position to update button visibility
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isLoading) {
        const atBottom = checkIfAtBottom();
        setShowScrollToBottom(!atBottom);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isLoading, chatContainerRef, setShowScrollToBottom]);

  // Item renderer for Virtuoso
  const itemContent = (index: number, msg: DisplayMessage) => {
    const isLastUserMessage = msg.role === 'user' && index === lastUserMessageIndex;
    const isSelected = selectedMessages.has(index);

    return (
      <div className="px-4 pb-4">
        <MessageBubble
          ref={isLastUserMessage ? lastUserMessageRef : null}
          msg={msg}
          index={index}
          isLastUserMessage={isLastUserMessage}
          isSelectMode={isSelectMode}
          isSelected={isSelected}
          copiedMessageIndex={copiedMessageIndex}
          isDark={isDark}
          onToggleSelect={onToggleMessageSelect}
          onCopyMessage={onCopyMessage}
          onEnterShareMode={onEnterShareMode}
          onLongPressStart={onLongPressStart}
          onLongPressEnd={onLongPressEnd}
          onImagePreview={onImagePreview}
        />
      </div>
    );
  };

  // Footer component for loading state
  const Footer = () => {
    if (!isLoading) return null;
    
    return (
      <div className="px-4 pb-4" style={{ paddingBottom: '80vh' }}>
        <div className="flex justify-start">
          <div className="max-w-lg lg:max-w-3xl p-3 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-gray-800/95 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8">
                <defs>
                  <linearGradient id="robotGradientThinking" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#60A5FA'}} />
                    <stop offset="100%" style={{stopColor: '#A78BFA'}} />
                  </linearGradient>
                </defs>
                <rect x="25" y="30" width="50" height="45" rx="8" fill="url(#robotGradientThinking)" />
                <line x1="50" y1="30" x2="50" y2="20" stroke="url(#robotGradientThinking)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="17" r="4" fill="url(#robotGradientThinking)" />
                <circle cx="40" cy="45" r="5" fill="white" opacity="0.9" />
                <circle cx="60" cy="45" r="5" fill="white" opacity="0.9" />
                <circle cx="41" cy="45" r="2.5" fill="#1E293B" />
                <circle cx="61" cy="45" r="2.5" fill="#1E293B" />
                <path d="M 38 58 Q 50 65 62 58" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                <rect x="18" y="42" width="7" height="12" rx="3" fill="url(#robotGradientThinking)" opacity="0.8" />
                <rect x="75" y="42" width="7" height="12" rx="3" fill="url(#robotGradientThinking)" opacity="0.8" />
              </svg>
            </div>
            <p className="text-sm animate-pulse">AI 正在思考中...</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={chatContainerRef} className="flex-1 overflow-hidden" style={{ overscrollBehavior: 'contain' }}>
      {displayConversation.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
          <div
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center w-full max-w-md h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2"/>
            ) : (
              <div className="flex flex-col items-center justify-center p-5 text-center">
                <svg className="w-10 h-10 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                <p className="font-semibold">點擊上傳題目照片</p>
                <p className="text-xs mt-1">或從相簿選擇</p>
              </div>
            )}
          </div>
          <p className="mt-4">可以上傳圖片、輸入文字，或兩者皆可</p>
        </div>
      )}

      {displayConversation.length > 0 && (
        <VirtualList
          ref={listRef}
          data={displayConversation}
          itemContent={itemContent}
          style={{ height: '100%' }}
          atTopStateChange={handleAtTopStateChange}
          atBottomStateChange={handleAtBottomChange}
          components={{ Footer }}
        />
      )}
    </div>
  );
});

VirtualizedChatArea.displayName = 'VirtualizedChatArea';
