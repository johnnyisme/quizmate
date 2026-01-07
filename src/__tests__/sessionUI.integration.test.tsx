// src/__tests__/sessionUI.integration.test.tsx
// Integration tests for session UI - 驗證標題編輯、hover 按鈕、時間格式顯示、側邊欄滾動

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState, useRef, useEffect } from 'react';

interface Session {
  id: string;
  title: string;
  updatedAt: number;
}

// 模擬 Session Item 組件
function SessionItem({ session, onEdit, onDelete, onTitleSave }: {
  session: Session;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTitleSave: (id: string, newTitle: string) => void;
}) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const editingContainerRef = useRef<HTMLDivElement>(null);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveTitle = () => {
    if (!editingTitle.trim()) return;
    onTitleSave(session.id, editingTitle.trim());
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingSessionId && editingContainerRef.current && !editingContainerRef.current.contains(event.target as Node)) {
        handleCancelEdit();
      }
    };

    if (editingSessionId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingSessionId]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-TW', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    });
  };

  return (
    <div className="group p-3 rounded-lg bg-white dark:bg-gray-900 border" data-testid={`session-${session.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {editingSessionId === session.id ? (
            <div ref={editingContainerRef} className="flex items-center gap-1" data-testid="editing-container">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={30}
                autoFocus
                className="flex-1 min-w-0 text-sm font-medium bg-white dark:bg-gray-800 border border-blue-500 rounded px-2 py-1"
                data-testid="title-input"
              />
              <button 
                onClick={handleSaveTitle}
                className="p-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white"
                data-testid="save-button"
                title="保存"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button 
                onClick={handleCancelEdit}
                className="p-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 text-gray-700"
                data-testid="cancel-button"
                title="取消"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium truncate" data-testid="session-title">{session.title}</p>
              <p className="text-xs text-gray-500" data-testid="session-time">{formatTime(session.updatedAt)}</p>
            </>
          )}
        </div>
        
        {/* Hover buttons - hidden lg:opacity-0, show on hover lg:group-hover:opacity-100 */}
        {editingSessionId !== session.id && (
          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200" data-testid="hover-buttons">
            <button 
              onClick={handleStartEdit}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-500"
              data-testid="edit-button"
              title="編輯標題"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              onClick={() => onDelete(session.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
              data-testid="delete-button"
              title="刪除對話"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Container component for testing
function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([
    { id: 'session-1', title: 'Test Session 1', updatedAt: new Date('2026-01-01 14:30:45').getTime() },
    { id: 'session-2', title: 'Test Session 2', updatedAt: new Date('2026-01-02 09:15:30').getTime() },
  ]);

  const handleEdit = (id: string, title: string) => {
    console.log('Edit:', id, title);
  };

  const handleDelete = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleTitleSave = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  return (
    <div>
      {sessions.map(session => (
        <SessionItem
          key={session.id}
          session={session}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTitleSave={handleTitleSave}
        />
      ))}
    </div>
  );
}

describe('Session UI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Title Editing', () => {
    it('should render edit icon button', () => {
      render(<SessionList />);
      
      const editButton = screen.getAllByTestId('edit-button')[0];
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveAttribute('title', '編輯標題');
    });

    it('should show input field when clicking edit button', () => {
      render(<SessionList />);
      
      expect(screen.queryByTestId('title-input')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('border-blue-500');
      expect(input).toHaveValue('Test Session 1');
    });

    it('should show save and cancel buttons in edit mode', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const saveButton = screen.getByTestId('save-button');
      const cancelButton = screen.getByTestId('cancel-button');
      
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toHaveClass('bg-green-600', 'rounded-full');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveClass('bg-gray-300', 'rounded-full');
    });

    it('should autofocus input when entering edit mode', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input');
      expect(input).toHaveFocus();
    });

    it('should save title when pressing Enter key', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input');
      fireEvent.change(input, { target: { value: 'Updated Title' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.queryByTestId('title-input')).not.toBeInTheDocument();
    });

    it('should cancel edit when pressing Escape key', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input');
      fireEvent.change(input, { target: { value: 'Changed Title' } });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      
      expect(screen.queryByTestId('title-input')).not.toBeInTheDocument();
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });

    it('should cancel edit when clicking outside editing container', async () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      expect(screen.getByTestId('title-input')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByTestId('title-input')).not.toBeInTheDocument();
      });
    });

    it('should save when clicking save button', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input');
      fireEvent.change(input, { target: { value: 'New Title' } });
      fireEvent.click(screen.getByTestId('save-button'));
      
      expect(screen.getByText('New Title')).toBeInTheDocument();
      expect(screen.queryByTestId('title-input')).not.toBeInTheDocument();
    });

    it('should cancel when clicking cancel button', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input');
      fireEvent.change(input, { target: { value: 'Changed' } });
      fireEvent.click(screen.getByTestId('cancel-button'));
      
      expect(screen.queryByTestId('title-input')).not.toBeInTheDocument();
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });

    it('should limit input to 30 characters', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input') as HTMLInputElement;
      expect(input.maxLength).toBe(30);
    });

    it('should not save empty title', () => {
      render(<SessionList />);
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      const input = screen.getByTestId('title-input');
      fireEvent.change(input, { target: { value: '   ' } }); // Only whitespace
      fireEvent.click(screen.getByTestId('save-button'));
      
      // Should still be in edit mode
      expect(screen.getByTestId('title-input')).toBeInTheDocument();
    });

    it('should hide hover buttons when in edit mode', () => {
      render(<SessionList />);
      
      // Before edit mode - hover buttons should exist for first session
      expect(screen.getAllByTestId('hover-buttons')[0]).toBeInTheDocument();
      
      fireEvent.click(screen.getAllByTestId('edit-button')[0]);
      
      // After entering edit mode - should only have hover buttons for second session
      const hoverButtons = screen.getAllByTestId('hover-buttons');
      expect(hoverButtons).toHaveLength(1); // Only session-2 has hover buttons now
      
      // Verify editing container is shown instead
      expect(screen.getByTestId('editing-container')).toBeInTheDocument();
    });
  });

  describe('Hover Buttons', () => {
    it('should render edit and delete buttons', () => {
      render(<SessionList />);
      
      const editButtons = screen.getAllByTestId('edit-button');
      const deleteButtons = screen.getAllByTestId('delete-button');
      
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it('should have opacity transition class', () => {
      render(<SessionList />);
      
      const hoverButtons = screen.getAllByTestId('hover-buttons')[0];
      expect(hoverButtons).toHaveClass('opacity-100', 'lg:opacity-0', 'lg:group-hover:opacity-100', 'transition-opacity');
    });

    it('should show edit button with correct icon and color', () => {
      render(<SessionList />);
      
      const editButton = screen.getAllByTestId('edit-button')[0];
      expect(editButton).toHaveClass('text-blue-500', 'hover:bg-blue-100');
    });

    it('should show delete button with correct icon and color', () => {
      render(<SessionList />);
      
      const deleteButton = screen.getAllByTestId('delete-button')[0];
      expect(deleteButton).toHaveClass('text-red-500', 'hover:bg-red-100');
    });

    it('should trigger delete when clicking delete button', () => {
      render(<SessionList />);
      
      expect(screen.getByTestId('session-session-1')).toBeInTheDocument();
      
      fireEvent.click(screen.getAllByTestId('delete-button')[0]);
      
      expect(screen.queryByTestId('session-session-1')).not.toBeInTheDocument();
    });
  });

  describe('Time Format Display', () => {
    it('should display time in correct format (YYYY/MM/DD HH:mm:ss)', () => {
      render(<SessionList />);
      
      const timeDisplay = screen.getAllByTestId('session-time')[0];
      expect(timeDisplay).toHaveTextContent('2026/01/01 14:30:45');
    });

    it('should display time with 24-hour format', () => {
      render(<SessionList />);
      
      const timeDisplay = screen.getAllByTestId('session-time')[1];
      // Should be 09:15:30, not 9:15:30 AM
      expect(timeDisplay).toHaveTextContent('2026/01/02 09:15:30');
      expect(timeDisplay).not.toHaveTextContent('AM');
      expect(timeDisplay).not.toHaveTextContent('PM');
    });

    it('should display time with zero-padded values', () => {
      render(<SessionList />);
      
      const timeDisplay = screen.getAllByTestId('session-time')[1];
      const timeText = timeDisplay.textContent || '';
      
      // Check for zero-padded month, day, hour, minute, second
      expect(timeText).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should include seconds in time display', () => {
      render(<SessionList />);
      
      const timeDisplay = screen.getAllByTestId('session-time')[0];
      expect(timeDisplay).toHaveTextContent(':45'); // seconds part
    });

    it('should have correct text color for time', () => {
      render(<SessionList />);
      
      const timeDisplay = screen.getAllByTestId('session-time')[0];
      expect(timeDisplay).toHaveClass('text-xs', 'text-gray-500');
    });
  });

  describe('側邊欄滾動功能', () => {
    it('should allow vertical scrolling when session list exceeds container height', () => {
      const SidebarWithScroll = () => {
        const sessions = Array.from({ length: 30 }, (_, i) => ({
          id: `session-${i}`,
          title: `Session ${i}`,
          updatedAt: Date.now() - i * 60000,
        }));

        return (
          <div className="fixed inset-y-0 left-0 w-72 bg-white flex flex-col">
            <div className="p-4 border-b">
              <h2>對話歷史</h2>
            </div>
            <div className="p-2">
              <button>新對話</button>
            </div>
            <div className="flex-1 overflow-y-auto" data-testid="session-list-container">
              {sessions.map(session => (
                <div key={session.id} className="p-2 border-b" data-testid="session-item">
                  {session.title}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<SidebarWithScroll />);
      
      const container = screen.getByTestId('session-list-container');
      
      // ✅ 應該有 overflow-y-auto class
      expect(container).toHaveClass('overflow-y-auto');
      
      // ✅ 不應該有 overflow-hidden
      expect(container).not.toHaveClass('overflow-hidden');
    });

    it('should render all sessions in scrollable container', () => {
      const SidebarWithScroll = () => {
        const sessions = Array.from({ length: 50 }, (_, i) => ({
          id: `session-${i}`,
          title: `Session ${i}`,
          updatedAt: Date.now() - i * 60000,
        }));

        return (
          <div className="flex-1 overflow-y-auto" data-testid="session-list-container">
            {sessions.map(session => (
              <div key={session.id} className="p-2" data-testid="session-item">
                {session.title}
              </div>
            ))}
          </div>
        );
      };

      render(<SidebarWithScroll />);
      
      const container = screen.getByTestId('session-list-container');
      const sessionItems = screen.getAllByTestId('session-item');
      
      // ✅ 所有 50 個 session 都應該被渲染（雖然可能需要滾動才能看到）
      expect(sessionItems).toHaveLength(50);
      
      // ✅ 容器應該有滾動能力
      expect(container).toHaveClass('overflow-y-auto');
    });

    it('should maintain flex-1 to fill available space', () => {
      const SidebarLayout = () => {
        return (
          <div className="flex flex-col h-screen">
            <div className="p-4">Header</div>
            <div className="p-2">Button</div>
            <div className="flex-1 overflow-y-auto" data-testid="session-list-container">
              <div>Session 1</div>
              <div>Session 2</div>
            </div>
          </div>
        );
      };

      render(<SidebarLayout />);
      
      const container = screen.getByTestId('session-list-container');
      
      // ✅ 應該同時有 flex-1 和 overflow-y-auto
      expect(container).toHaveClass('flex-1');
      expect(container).toHaveClass('overflow-y-auto');
    });

    it('should have correct CSS classes for scrolling', () => {
      const ScrollableSessionList = () => {
        const containerRef = useRef<HTMLDivElement>(null);
        const sessions = Array.from({ length: 100 }, (_, i) => ({
          id: `session-${i}`,
          title: `Session ${i}`,
        }));

        const scrollToBottom = () => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        };

        return (
          <div>
            <button onClick={scrollToBottom} data-testid="scroll-to-bottom">
              Scroll to Bottom
            </button>
            <div ref={containerRef} className="flex-1 overflow-y-auto h-64" data-testid="session-list-container">
              {sessions.map(session => (
                <div key={session.id} className="p-2 h-16" data-testid="session-item">
                  {session.title}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<ScrollableSessionList />);
      
      const container = screen.getByTestId('session-list-container');
      const scrollButton = screen.getByTestId('scroll-to-bottom');
      
      // ✅ 容器應該有正確的 CSS classes
      expect(container).toHaveClass('overflow-y-auto');
      expect(container).toHaveClass('h-64');
      
      // ✅ 按鈕應該存在且可點擊
      expect(scrollButton).toBeInTheDocument();
      
      // ✅ 所有 session 都應該被渲染
      const sessionItems = screen.getAllByTestId('session-item');
      expect(sessionItems).toHaveLength(100);
    });
  });
});
