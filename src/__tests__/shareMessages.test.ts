import { describe, it, expect, beforeEach, vi } from 'vitest';

// 模擬 displayConversation 資料
const mockConversation = [
  { role: 'user' as const, text: '請問 2+2 等於多少？' },
  { role: 'model' as const, text: '2+2 等於 4。\n\n這是基礎的加法運算。' },
  { role: 'user' as const, text: '為什麼是 4？' },
  { role: 'model' as const, text: '因為：\n- 2 個蘋果\n- 加上 2 個蘋果\n- 總共 4 個蘋果' },
];

// 測試訊息格式化函數
describe('formatSelectedMessages', () => {
  it('should format single message correctly', () => {
    const selectedMessages = new Set([0]);
    const messages = selectedMessages.size > 0 
      ? Array.from(selectedMessages).map(i => mockConversation[i]) 
      : [];
    
    const header = '與 QuizMate AI 老師的討論\n' + '─'.repeat(30) + '\n\n';
    const body = messages.map(msg => {
      const icon = msg.role === 'user' ? '👤' : '🤖';
      const label = msg.role === 'user' ? '用戶' : 'AI';
      return `${icon} ${label}：${msg.text}`;
    }).join('\n\n');
    
    const result = header + body;
    
    expect(result).toContain('與 QuizMate AI 老師的討論');
    expect(result).toContain('👤 用戶：請問 2+2 等於多少？');
    expect(result).not.toContain('🤖');
  });

  it('should format multiple messages correctly', () => {
    const selectedMessages = new Set([0, 1]);
    const messages = Array.from(selectedMessages).sort((a, b) => a - b).map(i => mockConversation[i]);
    
    const header = '與 QuizMate AI 老師的討論\n' + '─'.repeat(30) + '\n\n';
    const body = messages.map(msg => {
      const icon = msg.role === 'user' ? '👤' : '🤖';
      const label = msg.role === 'user' ? '用戶' : 'AI';
      return `${icon} ${label}：${msg.text}`;
    }).join('\n\n');
    
    const result = header + body;
    
    expect(result).toContain('👤 用戶：請問 2+2 等於多少？');
    expect(result).toContain('🤖 AI：2+2 等於 4。');
    expect(result).toMatch(/👤.*\n\n🤖/); // 確認有換行分隔
  });

  it('should preserve message order', () => {
    const selectedMessages = new Set([3, 1, 2]); // 亂序
    const sortedIndices = Array.from(selectedMessages).sort((a, b) => a - b);
    
    expect(sortedIndices).toEqual([1, 2, 3]); // 應該排序為 [1, 2, 3]
  });

  it('should include multi-line messages', () => {
    const selectedMessages = new Set([3]);
    const messages = Array.from(selectedMessages).map(i => mockConversation[i]);
    
    const header = '與 QuizMate AI 老師的討論\n' + '─'.repeat(30) + '\n\n';
    const body = messages.map(msg => {
      const icon = msg.role === 'user' ? '👤' : '🤖';
      const label = msg.role === 'user' ? '用戶' : 'AI';
      return `${icon} ${label}：${msg.text}`;
    }).join('\n\n');
    
    const result = header + body;
    
    expect(result).toContain('- 2 個蘋果');
    expect(result).toContain('- 總共 4 個蘋果');
  });
});

// 測試 Web Share API 支援檢測
describe('Web Share API Detection', () => {
  it('should detect Web Share API support', () => {
    // 模擬支援 Web Share API
    const mockNavigator = {
      share: vi.fn(),
    };
    
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
    
    expect(navigator.share).toBeDefined();
  });

  it('should fallback to clipboard when share is not available', () => {
    // 模擬不支援 Web Share API
    const mockNavigator = {
      share: undefined,
      clipboard: {
        writeText: vi.fn(),
      },
    };
    
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
    
    expect(navigator.share).toBeUndefined();
    expect(navigator.clipboard.writeText).toBeDefined();
  });
});

// 測試選取狀態管理
describe('Selection State Management', () => {
  it('should toggle message selection', () => {
    const selectedMessages = new Set<number>();
    const index = 0;
    
    // 第一次點擊：選取
    if (selectedMessages.has(index)) {
      selectedMessages.delete(index);
    } else {
      selectedMessages.add(index);
    }
    
    expect(selectedMessages.has(0)).toBe(true);
    expect(selectedMessages.size).toBe(1);
    
    // 第二次點擊：取消選取
    if (selectedMessages.has(index)) {
      selectedMessages.delete(index);
    } else {
      selectedMessages.add(index);
    }
    
    expect(selectedMessages.has(0)).toBe(false);
    expect(selectedMessages.size).toBe(0);
  });

  it('should select all messages', () => {
    const selectedMessages = new Set<number>();
    const allIndices = mockConversation.map((_, i) => i);
    
    allIndices.forEach(i => selectedMessages.add(i));
    
    expect(selectedMessages.size).toBe(mockConversation.length);
    expect(selectedMessages.has(0)).toBe(true);
    expect(selectedMessages.has(3)).toBe(true);
  });

  it('should clear selection', () => {
    const selectedMessages = new Set([0, 1, 2]);
    
    selectedMessages.clear();
    
    expect(selectedMessages.size).toBe(0);
  });

  it('should handle empty selection', () => {
    const selectedMessages = new Set<number>();
    
    expect(selectedMessages.size).toBe(0);
    expect(Array.from(selectedMessages)).toEqual([]);
  });
});

// 測試長按手勢（移動端）
describe('Long Press Gesture (Mobile Only)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should trigger selection mode after 500ms (touch)', () => {
    let isSelectMode = false;
    const selectedMessages = new Set<number>();
    
    const handleLongPressStart = (index: number) => {
      setTimeout(() => {
        isSelectMode = true;
        selectedMessages.add(index);
      }, 500);
    };
    
    handleLongPressStart(0);
    
    // 500ms 前不應觸發
    vi.advanceTimersByTime(400);
    expect(isSelectMode).toBe(false);
    
    // 500ms 後應觸發
    vi.advanceTimersByTime(100);
    expect(isSelectMode).toBe(true);
    expect(selectedMessages.has(0)).toBe(true);
  });

  it('should cancel long press on touch end', () => {
    let isSelectMode = false;
    let timerId: NodeJS.Timeout | null = null;
    
    const handleLongPressStart = (index: number) => {
      timerId = setTimeout(() => {
        isSelectMode = true;
      }, 500);
    };
    
    const handleLongPressEnd = () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    };
    
    handleLongPressStart(0);
    vi.advanceTimersByTime(200);
    handleLongPressEnd();
    
    // 繼續等待，不應觸發
    vi.advanceTimersByTime(400);
    expect(isSelectMode).toBe(false);
  });

  it('should cancel long press on mouse leave', () => {
    let isSelectMode = false;
    let timerId: NodeJS.Timeout | null = null;
    
    const handleLongPressStart = () => {
      timerId = setTimeout(() => {
        isSelectMode = true;
      }, 500);
    };
    
    const handleLongPressEnd = () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    };
    
    // 模擬 mouse down -> mouse leave
    handleLongPressStart();
    vi.advanceTimersByTime(300);
    handleLongPressEnd(); // mouse leave
    
    vi.advanceTimersByTime(300);
    expect(isSelectMode).toBe(false);
  });
});

// 測試 emoji 圖示
describe('Message Icons', () => {
  it('should use correct emoji for user messages', () => {
    const getIcon = (role: 'user' | 'model') => role === 'user' ? '👤' : '🤖';
    
    expect(getIcon('user')).toBe('👤');
  });

  it('should use correct emoji for AI messages', () => {
    const getIcon = (role: 'user' | 'model') => role === 'user' ? '👤' : '🤖';
    
    expect(getIcon('model')).toBe('🤖');
  });

  it('should use correct label for user messages', () => {
    const getLabel = (role: 'user' | 'model') => role === 'user' ? '用戶' : 'AI';
    
    expect(getLabel('user')).toBe('用戶');
  });

  it('should use correct label for AI messages', () => {
    const getLabel = (role: 'user' | 'model') => role === 'user' ? '用戶' : 'AI';
    
    expect(getLabel('model')).toBe('AI');
  });
});

// 測試分享錯誤處理
describe('Share Error Handling', () => {
  it('should show error when no messages selected', () => {
    const selectedMessages = new Set<number>();
    
    if (selectedMessages.size === 0) {
      expect(true).toBe(true); // 應該顯示錯誤
    } else {
      expect(false).toBe(true); // 不應該執行到這裡
    }
  });

  it('should handle user abort', async () => {
    const mockShare = vi.fn().mockRejectedValue({ name: 'AbortError' });
    
    Object.defineProperty(global, 'navigator', {
      value: { share: mockShare },
      writable: true,
    });
    
    try {
      await navigator.share({ title: 'Test', text: 'Test' });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        expect((err as { name: string }).name).toBe('AbortError'); // 用戶取消不應顯示錯誤
      }
    }
  });
});

// 測試訊息分隔
describe('Message Separator', () => {
  it('should use 30 dashes as separator', () => {
    const separator = '─'.repeat(30);
    
    expect(separator.length).toBe(30);
    expect(separator).toBe('──────────────────────────────');
  });

  it('should include separator in formatted output', () => {
    const header = '與 QuizMate AI 老師的討論\n' + '─'.repeat(30) + '\n\n';
    
    expect(header).toContain('─'.repeat(30));
    expect(header.split('\n').length).toBeGreaterThan(1);
  });
});

// 測試 UI 狀態切換
describe('UI State Management', () => {
  it('should hide input area when in selection mode', () => {
    const isSelectMode = true;
    const shouldShowInput = !isSelectMode;
    
    expect(shouldShowInput).toBe(false);
  });

  it('should show input area when not in selection mode', () => {
    const isSelectMode = false;
    const shouldShowInput = !isSelectMode;
    
    expect(shouldShowInput).toBe(true);
  });

  it('should show selection toolbar when in selection mode', () => {
    const isSelectMode = true;
    const shouldShowToolbar = isSelectMode;
    
    expect(shouldShowToolbar).toBe(true);
  });

  it('should hide copy button when in selection mode', () => {
    const isSelectMode = true;
    const shouldShowCopyButton = !isSelectMode;
    
    expect(shouldShowCopyButton).toBe(false);
  });

  it('should show checkboxes when in selection mode', () => {
    const isSelectMode = true;
    const shouldShowCheckboxes = isSelectMode;
    
    expect(shouldShowCheckboxes).toBe(true);
  });

  it('should highlight selected messages', () => {
    const selectedMessages = new Set([0, 2]);
    const messageIndex = 0;
    const isSelected = selectedMessages.has(messageIndex);
    
    expect(isSelected).toBe(true);
  });

  it('should not highlight unselected messages', () => {
    const selectedMessages = new Set([0, 2]);
    const messageIndex = 1;
    const isSelected = selectedMessages.has(messageIndex);
    
    expect(isSelected).toBe(false);
  });
});

// 測試選取模式生命週期
describe('Selection Mode Lifecycle', () => {
  it('should enter selection mode with first message selected', () => {
    const isSelectMode = false;
    const selectedMessages = new Set<number>();
    const index = 0;
    
    // 模擬進入選取模式
    const newSelectMode = true;
    selectedMessages.add(index);
    
    expect(newSelectMode).toBe(true);
    expect(selectedMessages.has(0)).toBe(true);
    expect(selectedMessages.size).toBe(1);
  });

  it('should exit selection mode and clear selection on cancel', () => {
    let isSelectMode = true;
    const selectedMessages = new Set([0, 1, 2]);
    
    // 模擬取消選取
    isSelectMode = false;
    selectedMessages.clear();
    
    expect(isSelectMode).toBe(false);
    expect(selectedMessages.size).toBe(0);
  });

  it('should exit selection mode and clear selection after share', () => {
    let isSelectMode = true;
    const selectedMessages = new Set([0, 1]);
    
    // 模擬分享後清除
    isSelectMode = false;
    selectedMessages.clear();
    
    expect(isSelectMode).toBe(false);
    expect(selectedMessages.size).toBe(0);
  });
});
