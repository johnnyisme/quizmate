// Custom hook for message actions (copy, share, select)
import { useCallback, useRef } from 'react';
import type { ChatError, DisplayMessage } from './useChatState';

type MessageActionsProps = {
  displayConversation: DisplayMessage[];
  isSelectMode: boolean;
  selectedMessages: Set<number>;
  setCopiedMessageIndex: (idx: number | null) => void;
  setIsSelectMode: (mode: boolean) => void;
  setSelectedMessages: (msgs: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setError: (err: ChatError) => void;
};

export const useMessageActions = ({
  displayConversation,
  isSelectMode,
  selectedMessages,
  setCopiedMessageIndex,
  setIsSelectMode,
  setSelectedMessages,
  setError,
}: MessageActionsProps) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Copy message content
  const handleCopyMessage = useCallback(async (text: string, index: number) => {
    try {
      // Primary: modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: traditional execCommand method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      
      setCopiedMessageIndex(index);
      // Clear copy state after 2 seconds
      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError({
        message: "複製失敗",
        suggestion: "請檢查瀏覽器是否允許存取剪貼簿"
      });
    }
  }, [setCopiedMessageIndex, setError]);

  // Long press to enter select mode
  const handleLongPressStart = useCallback((index: number) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelectMode(true);
      setSelectedMessages(new Set([index]));
    }, 500); // 500ms long press
  }, [setIsSelectMode, setSelectedMessages]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current as ReturnType<typeof setTimeout>);
      longPressTimer.current = null;
    }
  }, []);

  // Toggle message selection
  const toggleMessageSelect = useCallback((index: number) => {
    if (!isSelectMode) return;
    
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, [isSelectMode, setSelectedMessages]);

  // Select all messages
  const selectAllMessages = useCallback(() => {
    const allIndices = displayConversation.map((_, i) => i);
    setSelectedMessages(new Set(allIndices));
  }, [displayConversation, setSelectedMessages]);

  // Clear selection and exit select mode
  const clearSelection = useCallback(() => {
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  }, [setSelectedMessages, setIsSelectMode]);

  // Format selected messages as Markdown
  const formatSelectedMessages = useCallback((): string => {
    const sortedIndices = Array.from(selectedMessages).sort((a, b) => a - b);
    const messages = sortedIndices.map(i => displayConversation[i]);
    
    const header = '與 QuizMate AI 老師的討論\n' + '─'.repeat(30) + '\n\n';
    const body = messages.map(msg => {
      const icon = msg.role === 'user' ? '👤' : '🤖';
      const label = msg.role === 'user' ? '用戶' : 'AI';
      return `${icon} ${label}：${msg.text}`;
    }).join('\n\n');
    
    return header + body;
  }, [selectedMessages, displayConversation]);

  // Enter share mode (desktop)
  const enterShareMode = useCallback((index: number) => {
    setIsSelectMode(true);
    setSelectedMessages(new Set([index]));
  }, [setIsSelectMode, setSelectedMessages]);

  // Share selected messages
  const shareSelectedMessages = useCallback(async () => {
    if (selectedMessages.size === 0) {
      setError({
        message: "請先選取訊息",
        suggestion: "點擊訊息泡泡上的勾選框來選取要分享的內容"
      });
      return;
    }

    const formattedText = formatSelectedMessages();

    try {
      // Check if Web Share API is supported
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        console.log('使用 Web Share API 分享');
        await navigator.share({
          title: '與 QuizMate AI 老師的討論',
          text: formattedText,
        });
        clearSelection();
        return;
      }
      
      // Fallback: copy to clipboard
      console.log('Web Share API 不支援，使用剪貼簿 fallback');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedText);
      } else {
        // Traditional fallback
        const textArea = document.createElement('textarea');
        textArea.value = formattedText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      
      alert('✅ 已複製到剪貼簿！\n\n💡 你的瀏覽器不支援直接分享功能。請手動貼上到 LINE、Messenger 等 App 分享。\n\n提示：在支援的瀏覽器（如 Safari、Chrome Mobile）上可直接呼叫分享選單。');
      clearSelection();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);

      // User cancelled sharing
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('用戶取消分享');
        return;
      }
      
      console.error('Failed to share:', err);
      setError({
        message: "分享失敗",
        suggestion: "請確認瀏覽器支援分享功能，或嘗試使用複製功能\n\n技術細節：" + errorMessage
      });
    }
  }, [selectedMessages, formatSelectedMessages, clearSelection, setError]);

  return {
    handleCopyMessage,
    handleLongPressStart,
    handleLongPressEnd,
    toggleMessageSelect,
    selectAllMessages,
    clearSelection,
    formatSelectedMessages,
    enterShareMode,
    shareSelectedMessages,
  };
};
