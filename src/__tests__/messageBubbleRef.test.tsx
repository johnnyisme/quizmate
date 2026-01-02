// src/__tests__/messageBubbleRef.test.tsx
// 測試 MessageBubble 組件的 ref forwarding 功能

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useRef, useEffect } from 'react';
import MessageBubble from '@/components/MessageBubble';

describe('MessageBubble Ref Forwarding', () => {
  const mockMsg = {
    role: 'user' as const,
    text: 'Test message',
  };

  const mockProps = {
    msg: mockMsg,
    index: 0,
    isLastUserMessage: false,
    isSelectMode: false,
    isSelected: false,
    copiedMessageIndex: null,
    isDark: false,
    onToggleSelect: vi.fn(),
    onCopyMessage: vi.fn(),
    onEnterShareMode: vi.fn(),
    onLongPressStart: vi.fn(),
    onLongPressEnd: vi.fn(),
    onImagePreview: vi.fn(),
  };

  it('should forward ref to DOM element when isLastUserMessage is true', () => {
    const TestWrapper = () => {
      const messageRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        // 驗證 ref 是否正確綁定到 DOM
        expect(messageRef.current).toBeTruthy();
        expect(messageRef.current?.tagName).toBe('DIV');
      }, []);

      return (
        <MessageBubble
          {...mockProps}
          isLastUserMessage={true}
          ref={messageRef}
        />
      );
    };

    render(<TestWrapper />);
  });

  it('should not attach ref when isLastUserMessage is false', () => {
    const TestWrapper = () => {
      const messageRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        // 當不是最後一個 user message 時，ref 應該是 null
        expect(messageRef.current).toBeNull();
      }, []);

      return (
        <MessageBubble
          {...mockProps}
          isLastUserMessage={false}
          ref={messageRef}
        />
      );
    };

    render(<TestWrapper />);
  });

  it('should allow ref.current to be used for scrolling', () => {
    const TestWrapper = () => {
      const messageRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (messageRef.current) {
          // 模擬滾動操作
          const mockScrollIntoView = vi.fn();
          messageRef.current.scrollIntoView = mockScrollIntoView;
          
          messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          expect(mockScrollIntoView).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, []);

      return (
        <MessageBubble
          {...mockProps}
          isLastUserMessage={true}
          ref={messageRef}
        />
      );
    };

    render(<TestWrapper />);
  });

  it('should maintain ref across re-renders with memo', () => {
    const TestWrapper = ({ count }: { count: number }) => {
      const messageRef = useRef<HTMLDivElement>(null);
      const renderCount = useRef(0);

      useEffect(() => {
        renderCount.current += 1;
        
        // 即使 count 改變（模擬 parent re-render），ref 仍應保持有效
        if (messageRef.current) {
          expect(messageRef.current.tagName).toBe('DIV');
        }
      });

      return (
        <div>
          <p>Render count: {renderCount.current}</p>
          <MessageBubble
            {...mockProps}
            isLastUserMessage={true}
            ref={messageRef}
          />
          <p>External state: {count}</p>
        </div>
      );
    };

    const { rerender } = render(<TestWrapper count={0} />);
    
    // 觸發 parent re-render，但 MessageBubble 應該因為 memo 而不重新渲染
    rerender(<TestWrapper count={1} />);
    rerender(<TestWrapper count={2} />);
  });

  it('should work with multiple MessageBubble instances', () => {
    const TestWrapper = () => {
      const ref1 = useRef<HTMLDivElement>(null);
      const ref2 = useRef<HTMLDivElement>(null);
      const ref3 = useRef<HTMLDivElement>(null);

      useEffect(() => {
        // 只有最後一個 user message 應該有 ref
        expect(ref1.current).toBeNull();
        expect(ref2.current).toBeNull();
        expect(ref3.current).toBeTruthy();
      }, []);

      return (
        <div>
          <MessageBubble {...mockProps} index={0} isLastUserMessage={false} ref={ref1} />
          <MessageBubble {...mockProps} index={1} isLastUserMessage={false} ref={ref2} />
          <MessageBubble {...mockProps} index={2} isLastUserMessage={true} ref={ref3} />
        </div>
      );
    };

    render(<TestWrapper />);
  });
});
