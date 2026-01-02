// src/__tests__/messageInteraction.integration.test.tsx
// Integration tests for message interaction - 驗證複製按鈕、分享選取、桌面分享按鈕

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';

type Message = {
  role: 'user' | 'model';
  text: string;
};

// 簡化的 MessageBubble 組件
function MessageBubble({ 
  msg, 
  index, 
  isSelectMode, 
  isSelected, 
  copiedMessageIndex,
  onToggleSelect,
  onCopyMessage,
  onEnterShareMode,
  onLongPressStart,
  onLongPressEnd 
}: {
  msg: Message;
  index: number;
  isSelectMode: boolean;
  isSelected: boolean;
  copiedMessageIndex: number | null;
  onToggleSelect: (index: number) => void;
  onCopyMessage: (text: string, index: number) => void;
  onEnterShareMode: (index: number) => void;
  onLongPressStart: (index: number) => void;
  onLongPressEnd: () => void;
}) {
  return (
    <div className="flex group" data-testid={`message-${index}`}>
      <div className="flex items-start gap-2">
        {/* 選取框 */}
        {isSelectMode && (
          <button
            onClick={() => onToggleSelect(index)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'bg-white dark:bg-gray-700 border-gray-300'
            }`}
            data-testid={`checkbox-${index}`}
            aria-label={isSelected ? '取消選取' : '選取此訊息'}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}
        
        <div className="relative">
          <div 
            onTouchStart={() => !isSelectMode && onLongPressStart(index)}
            onTouchEnd={onLongPressEnd}
            onTouchMove={onLongPressEnd}
            onClick={() => isSelectMode && onToggleSelect(index)}
            className={`p-3 rounded-lg shadow-md cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            } ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            data-testid={`message-bubble-${index}`}
          >
            {msg.text}
          </div>
          
          {/* 複製和分享按鈕 */}
          {!isSelectMode && (
            <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
              {/* 桌面分享按鈕 */}
              <button
                onClick={() => onEnterShareMode(index)}
                className="hidden lg:block p-1.5 rounded-full bg-white shadow-md opacity-0 lg:group-hover:opacity-100 transition-all"
                data-testid={`desktop-share-btn-${index}`}
                title="選取訊息以分享"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12" />
                </svg>
              </button>
              
              {/* 複製按鈕 */}
              <button
                onClick={() => onCopyMessage(msg.text, index)}
                className="p-1.5 rounded-full bg-white shadow-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                data-testid={`copy-btn-${index}`}
                title={copiedMessageIndex === index ? "已複製！" : "複製內容"}
              >
                {copiedMessageIndex === index ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Container for testing
function MessageList() {
  const [messages] = useState<Message[]>([
    { role: 'user', text: 'Test message 1' },
    { role: 'model', text: 'Test response 1' },
    { role: 'user', text: 'Test message 2' },
  ]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  const toggleMessageSelect = (index: number) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const enterShareMode = (index: number) => {
    setIsSelectMode(true);
    setSelectedMessages(new Set([index]));
  };

  const handleLongPressStart = (index: number) => {
    // 500ms long press
    setTimeout(() => {
      setIsSelectMode(true);
      setSelectedMessages(new Set([index]));
    }, 500);
  };

  const selectAll = () => {
    setSelectedMessages(new Set(messages.map((_, i) => i)));
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  };

  return (
    <div>
      <button onClick={() => setIsSelectMode(true)} data-testid="enter-select-mode">Enter Select Mode</button>
      <button onClick={selectAll} data-testid="select-all-btn">Select All</button>
      <button onClick={clearSelection} data-testid="clear-selection-btn">Clear</button>
      
      {messages.map((msg, index) => (
        <MessageBubble
          key={index}
          msg={msg}
          index={index}
          isSelectMode={isSelectMode}
          isSelected={selectedMessages.has(index)}
          copiedMessageIndex={copiedMessageIndex}
          onToggleSelect={toggleMessageSelect}
          onCopyMessage={handleCopyMessage}
          onEnterShareMode={enterShareMode}
          onLongPressStart={handleLongPressStart}
          onLongPressEnd={() => {}}
        />
      ))}
      
      {isSelectMode && (
        <div data-testid="bottom-toolbar" className="px-4 py-3 flex items-center justify-between">
          <button onClick={selectAll} data-testid="toolbar-select-all">全選</button>
          <div className="flex items-center gap-2">
            <span data-testid="selected-count">已選 {selectedMessages.size} 則</span>
            <button onClick={clearSelection} data-testid="toolbar-cancel">取消</button>
            <button 
              disabled={selectedMessages.size === 0}
              data-testid="toolbar-share"
              className={selectedMessages.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              分享
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

describe('Message Interaction Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Copy Button', () => {
    it('should render copy button at bottom-right outside bubble', () => {
      render(<MessageList />);
      
      const copyBtn = screen.getByTestId('copy-btn-0');
      expect(copyBtn).toBeInTheDocument();
      expect(copyBtn.parentElement).toHaveClass('absolute', '-bottom-2', '-right-2');
    });

    it('should have correct styling for copy button', () => {
      render(<MessageList />);
      
      const copyBtn = screen.getByTestId('copy-btn-0');
      expect(copyBtn).toHaveClass('p-1.5', 'rounded-full', 'bg-white', 'shadow-md');
      expect(copyBtn).toHaveClass('opacity-100', 'lg:opacity-0', 'lg:group-hover:opacity-100');
    });

    it('should call clipboard API when clicking copy button', async () => {
      render(<MessageList />);
      
      const copyBtn = screen.getByTestId('copy-btn-0');
      fireEvent.click(copyBtn);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test message 1');
      });
    });

    it('should show green checkmark after copy', async () => {
      render(<MessageList />);
      
      const copyBtn = screen.getByTestId('copy-btn-0');
      
      // Before copy - should have copy icon
      const copyIconBefore = copyBtn.querySelector('svg');
      expect(copyIconBefore).toHaveClass('text-gray-600');
      
      fireEvent.click(copyBtn);
      
      // After copy - should have checkmark
      await waitFor(() => {
        const checkmark = copyBtn.querySelector('svg');
        expect(checkmark).toHaveClass('text-green-500');
      });
    });

    it('should revert to copy icon after 2 seconds', async () => {
      render(<MessageList />);
      
      const copyBtn = screen.getByTestId('copy-btn-0');
      fireEvent.click(copyBtn);
      
      // Should show checkmark immediately
      await waitFor(() => {
        const checkmark = copyBtn.querySelector('svg');
        expect(checkmark).toHaveClass('text-green-500');
      });
      
      // Wait 2 seconds for timeout to revert
      await waitFor(() => {
        const copyIcon = copyBtn.querySelector('svg');
        expect(copyIcon).toHaveClass('text-gray-600');
      }, { timeout: 3000 });
    });

    it('should update title attribute after copy', async () => {
      render(<MessageList />);
      
      const copyBtn = screen.getByTestId('copy-btn-0');
      expect(copyBtn).toHaveAttribute('title', '複製內容');
      
      fireEvent.click(copyBtn);
      
      // Wait for state update
      await waitFor(() => {
        expect(copyBtn).toHaveAttribute('title', '已複製！');
      });
    });
  });

  describe('Share Selection', () => {
    it('should show checkbox when entering select mode', () => {
      render(<MessageList />);
      
      expect(screen.queryByTestId('checkbox-0')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      expect(screen.getByTestId('checkbox-0')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-1')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-2')).toBeInTheDocument();
    });

    it('should render checkbox with correct styling', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      const checkbox = screen.getByTestId('checkbox-0');
      expect(checkbox).toHaveClass('w-6', 'h-6', 'rounded', 'border-2');
    });

    it('should toggle message selection on checkbox click', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      const checkbox = screen.getByTestId('checkbox-0');
      
      // Initially unselected
      expect(checkbox).toHaveClass('bg-white', 'border-gray-300');
      expect(checkbox).not.toHaveClass('bg-blue-500');
      
      // Click to select
      fireEvent.click(checkbox);
      expect(checkbox).toHaveClass('bg-blue-500', 'border-blue-500');
      
      // Click to unselect
      fireEvent.click(checkbox);
      expect(checkbox).toHaveClass('bg-white', 'border-gray-300');
    });

    it('should show checkmark icon when selected', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      const checkbox = screen.getByTestId('checkbox-0');
      
      // No checkmark when unselected
      expect(checkbox.querySelector('svg')).not.toBeInTheDocument();
      
      // Click to select
      fireEvent.click(checkbox);
      
      // Should show checkmark
      const checkmark = checkbox.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
      expect(checkmark).toHaveClass('w-4', 'h-4', 'text-white');
    });

    it('should highlight selected message with ring', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      const bubble = screen.getByTestId('message-bubble-0');
      expect(bubble).not.toHaveClass('ring-2');
      
      fireEvent.click(screen.getByTestId('checkbox-0'));
      
      expect(bubble).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('should show bottom toolbar in select mode', () => {
      render(<MessageList />);
      
      expect(screen.queryByTestId('bottom-toolbar')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      expect(screen.getByTestId('bottom-toolbar')).toBeInTheDocument();
    });

    it('should display selected count in toolbar', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('已選 0 則');
      
      fireEvent.click(screen.getByTestId('checkbox-0'));
      expect(screen.getByTestId('selected-count')).toHaveTextContent('已選 1 則');
      
      fireEvent.click(screen.getByTestId('checkbox-1'));
      expect(screen.getByTestId('selected-count')).toHaveTextContent('已選 2 則');
    });

    it('should select all messages when clicking select all button', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('已選 0 則');
      
      fireEvent.click(screen.getByTestId('toolbar-select-all'));
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('已選 3 則');
      
      // All checkboxes should be selected
      expect(screen.getByTestId('checkbox-0')).toHaveClass('bg-blue-500');
      expect(screen.getByTestId('checkbox-1')).toHaveClass('bg-blue-500');
      expect(screen.getByTestId('checkbox-2')).toHaveClass('bg-blue-500');
    });

    it('should clear selection and exit select mode when clicking cancel', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      fireEvent.click(screen.getByTestId('checkbox-0'));
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('已選 1 則');
      
      fireEvent.click(screen.getByTestId('toolbar-cancel'));
      
      expect(screen.queryByTestId('bottom-toolbar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkbox-0')).not.toBeInTheDocument();
    });

    it('should disable share button when no messages selected', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      const shareBtn = screen.getByTestId('toolbar-share');
      expect(shareBtn).toBeDisabled();
      expect(shareBtn).toHaveClass('opacity-50', 'cursor-not-allowed');
      
      fireEvent.click(screen.getByTestId('checkbox-0'));
      
      expect(shareBtn).not.toBeDisabled();
      expect(shareBtn).not.toHaveClass('opacity-50');
    });

    it('should hide copy and share buttons in select mode', () => {
      render(<MessageList />);
      
      expect(screen.getByTestId('copy-btn-0')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-share-btn-0')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('enter-select-mode'));
      
      expect(screen.queryByTestId('copy-btn-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('desktop-share-btn-0')).not.toBeInTheDocument();
    });
  });

  describe('Desktop Share Button', () => {
    it('should render desktop share button with hidden lg:block class', () => {
      render(<MessageList />);
      
      const shareBtn = screen.getByTestId('desktop-share-btn-0');
      expect(shareBtn).toBeInTheDocument();
      expect(shareBtn).toHaveClass('hidden', 'lg:block');
    });

    it('should have hover opacity effect', () => {
      render(<MessageList />);
      
      const shareBtn = screen.getByTestId('desktop-share-btn-0');
      expect(shareBtn).toHaveClass('opacity-0', 'lg:group-hover:opacity-100');
    });

    it('should be positioned left of copy button', () => {
      render(<MessageList />);
      
      const container = screen.getByTestId('copy-btn-0').parentElement;
      const buttons = container?.querySelectorAll('button');
      
      expect(buttons).toHaveLength(2);
      expect(buttons?.[0]).toHaveAttribute('data-testid', 'desktop-share-btn-0');
      expect(buttons?.[1]).toHaveAttribute('data-testid', 'copy-btn-0');
    });

    it('should enter select mode when clicking desktop share button', () => {
      render(<MessageList />);
      
      expect(screen.queryByTestId('bottom-toolbar')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('desktop-share-btn-0'));
      
      expect(screen.getByTestId('bottom-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-0')).toBeInTheDocument();
    });

    it('should pre-select clicked message when entering share mode', () => {
      render(<MessageList />);
      
      fireEvent.click(screen.getByTestId('desktop-share-btn-1'));
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('已選 1 則');
      expect(screen.getByTestId('checkbox-1')).toHaveClass('bg-blue-500');
      expect(screen.getByTestId('message-bubble-1')).toHaveClass('ring-2');
    });

    it('should have correct title attribute', () => {
      render(<MessageList />);
      
      const shareBtn = screen.getByTestId('desktop-share-btn-0');
      expect(shareBtn).toHaveAttribute('title', '選取訊息以分享');
    });
  });
});
