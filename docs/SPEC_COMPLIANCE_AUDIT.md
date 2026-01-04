# QuizMate v1.2.0 - Specification Compliance Audit

## Executive Summary
經過系統化的程式碼審查，發現**至少 11 個實現與規格不符的地方**，導致目前的 scroll/session 相關 bug。

---

## 1. ❌ CRITICAL: Session Initialization - Missing `loadSessions()` Call

**規格要求**（copilot-instructions.md, Line ~125）:
```
- Auto-restores last session on page reload
- Cleared when starting new chat
- Updated when switching sessions or creating new session
- Enables seamless user experience across browser refreshes
```

**當前實現問題** (page.tsx, Line 116-120):
```tsx
// Restore last session on page load
useEffect(() => {
  const storedSessionId = localStorage.getItem('current-session-id');
  if (storedSessionId) {
    setCurrentSessionId(storedSessionId);  // ❌ 只設置 ID，但沒有載入 sessions 列表
  }
}, []);
```

**問題**:
- 只復原 `currentSessionId`，但**沒有呼叫 `loadSessions()`** 來重新載入側邊欄的對話列表
- 側邊欄會顯示空白，直到用戶手動操作
- 應該在初始化時就載入完整的 session 列表

**修復**:
```tsx
useEffect(() => {
  const storedSessionId = localStorage.getItem('current-session-id');
  if (storedSessionId) {
    setCurrentSessionId(storedSessionId);
  }
  // ✅ 初始化時載入所有 sessions
  loadSessions();
}, []);
```

---

## 2. ⚠️ CRITICAL: Scroll Position Restoration - Wrong Dependency

**規格要求** (copilot-instructions.md, Line 147):
```
Restored ONLY when switching between sessions (detected via prevSessionIdRef)
NOT restored during same-session updates (e.g., AI streaming responses)
```

**當前實現問題** (useScrollManagement.ts, Line 159-179):
```tsx
useEffect(() => {
  if (!currentSessionId || !chatContainerRef.current || displayConversation.length === 0) return;
  
  // ❌ 問題：依賴 displayConversation.length
  // 這會在每次 AI response 完成時都觸發（length 增加）
  // 導致捲動位置在 AI response 完成後被重置到之前的位置
  
  if (prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId) {
    const storedScrollPos = localStorage.getItem(`scroll-pos-${currentSessionId}`);
    // ...
  }
  prevSessionIdRef.current = currentSessionId;
}, [currentSessionId, displayConversation.length, chatContainerRef]);
```

**問題**:
- 依賴 `displayConversation.length` 會在每次訊息增加時觸發
- 當 AI response 完成（length 從 2→3）時，這個 useEffect 會再次執行
- 這樣會導致**捲動位置被意外重置**

**規格的做法**:
- 只有當 `currentSessionId` 變化時才觸發
- 使用 `prevSessionIdRef` 判斷是否真的發生了 session 切換
- ❌ 移除 `displayConversation.length` 依賴

**修復**:
```tsx
useEffect(() => {
  if (!currentSessionId || !chatContainerRef.current) return;
  
  // ✅ 只在 currentSessionId 改變時觸發（移除 displayConversation.length）
  if (prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId) {
    const storedScrollPos = localStorage.getItem(`scroll-pos-${currentSessionId}`);
    if (storedScrollPos) {
      const scrollPos = parseInt(storedScrollPos, 10);
      const rafId = requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = scrollPos;
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }
  
  prevSessionIdRef.current = currentSessionId;
}, [currentSessionId, chatContainerRef]); // ✅ 移除 displayConversation.length
```

---

## 3. ❌ CRITICAL: Auto-scroll During Loading - Wrong Dependency

**規格要求** (copilot-instructions.md, Line 149):
```
Smooth scroll triggered via requestAnimationFrame in useEffect
No Scroll Jumps: User scroll position maintained during AI streaming and after completion
```

**當前實現問題** (useScrollManagement.ts, Line 64-82):
```tsx
useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  // ❌ 依賴 displayConversation.length
  // 每次 displayConversation 改變都會觸發新的 auto-scroll
  // 包括 user message 新增時 (不應該自動捲動)
  if (isLoading && displayConversation.length > 0 && shouldAutoScroll.current) {
    const rafId = requestAnimationFrame(() => {
      // ... auto-scroll logic
    });
    return () => cancelAnimationFrame(rafId);
  }
}, [isLoading, chatContainerRef, lastUserMessageRef, displayConversation]);
```

**問題**:
- 依賴 `displayConversation` 導致頻繁觸發
- 當使用者發送訊息時（user message 被加入），這個 useEffect 會執行
- 此時 `isLoading=false`，但是下一個 useEffect tick 會是 `isLoading=true`
- 造成多個 scroll 事件競爭

**修復**:
- 移除 `displayConversation` 依賴
- 只依賴 `isLoading` 和必要的 refs

```tsx
useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  if (isLoading && shouldAutoScroll.current) {
    const rafId = requestAnimationFrame(() => {
      const userMessage = lastUserMessageRef.current;
      if (userMessage && shouldAutoScroll.current) {
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
}, [isLoading]); // ✅ 只依賴 isLoading，不依賴 displayConversation
```

---

## 4. ❌ Scroll-to-Question: lastUserMessageRef 可能為 null

**規格要求** (copilot-instructions.md, Line 271):
```
Ref Forwarding: Uses React.forwardRef to pass lastUserMessageRef for scroll-to-question behavior
```

**當前實現問題** (ChatArea.tsx, Line 70-76):
```tsx
{displayConversation.map((msg, index) => {
  const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
    if (m.role === 'user') acc.push(i);
    return acc;
  }, []);
  const lastUserIndex = userMessageIndices[userMessageIndices.length - 1];
  const isLastUserMessage = msg.role === 'user' && index === lastUserIndex;
  
  return (
    <MessageBubble
      ref={isLastUserMessage ? lastUserMessageRef : null}
      // ... 其他 props
    />
  );
})}
```

**問題**:
- 這個邏輯會在**每次 render 時重新計算** lastUserIndex
- 當 AI response 時，displayConversation 變成 `[user, model]`
- 此時 `lastUserMessage` 仍然指向第 0 個 user message
- 但如果之後有新 user message 加入，ref 會改指向新的 message
- 造成 scroll-to-question 的目標不穩定

**規格的做法**:
- lastUserMessageRef 應該指向最後一個 **user** message（不是最後一個 message）
- 當用戶發送新訊息時，ref 應該指向新的 message

**當前邏輯其實是對的**，問題在於：
- ❌ 在 `displayConversation.map()` 內**每次都重新計算** userMessageIndices（O(n) 操作）
- 應該用 `useMemo` 優化

**修復** (ChatArea.tsx):
```tsx
const lastUserMessageIndex = useMemo(() => {
  for (let i = displayConversation.length - 1; i >= 0; i--) {
    if (displayConversation[i].role === 'user') {
      return i;
    }
  }
  return -1;
}, [displayConversation]);

{displayConversation.map((msg, index) => {
  const isLastUserMessage = msg.role === 'user' && index === lastUserMessageIndex;
  return (
    <MessageBubble
      ref={isLastUserMessage ? lastUserMessageRef : null}
      // ...
    />
  );
})}
```

---

## 5. ❌ Scroll-to-Question: offsetParent 計算可能不正確

**規格要求** (copilot-instructions.md, Line 218):
```
Scroll Behavior: User question scrolls to top of viewport when sending
Implementation: Direct DOM manipulation in handleSubmit
```

**當前實現問題** (useScrollManagement.ts, Line 35-60):
```tsx
useEffect(() => {
  if (shouldScrollToQuestion.current && lastUserMessageRef.current && chatContainerRef.current) {
    shouldScrollToQuestion.current = false;
    
    const rafId = requestAnimationFrame(() => {
      const userMessage = lastUserMessageRef.current;
      const container = chatContainerRef.current;
      
      if (!userMessage || !container) return;
      
      // ❌ 這個計算有問題
      let messageTop = userMessage.offsetTop;
      let el = userMessage.offsetParent as HTMLElement | null;
      
      while (el && el !== container) {
        messageTop += (el.offsetTop || 0);
        el = el.offsetParent as HTMLElement | null;
      }
      
      // 問題：offsetParent 的鏈可能不經過 container
      // 如果 MessageBubble 或其父元素有不同的 position context
      // 這個計算會得到錯誤的值
      
      container.scrollTo({
        top: messageTop - 16,
        behavior: 'smooth'
      });
    });
    
    return () => cancelAnimationFrame(rafId);
  }
}, [displayConversation, lastUserMessageRef, chatContainerRef]);
```

**問題**:
- `offsetParent` 鏈不一定經過 `container`
- 如果 MessageBubble 在不同的 position context，計算會錯誤
- 應該用 `getBoundingClientRect()` + `container.getBoundingClientRect()` 的相對位置

**修復**:
```tsx
useEffect(() => {
  if (shouldScrollToQuestion.current && lastUserMessageRef.current && chatContainerRef.current) {
    shouldScrollToQuestion.current = false;
    
    const rafId = requestAnimationFrame(() => {
      const userMessage = lastUserMessageRef.current;
      const container = chatContainerRef.current;
      
      if (!userMessage || !container) return;
      
      // ✅ 用相對位置計算
      const messageRect = userMessage.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const relativeTop = messageRect.top - containerRect.top;
      const scrollTop = container.scrollTop;
      
      container.scrollTo({
        top: scrollTop + relativeTop - 16,
        behavior: 'smooth'
      });
    });
    
    return () => cancelAnimationFrame(rafId);
  }
}, [displayConversation, lastUserMessageRef, chatContainerRef]);
```

---

## 6. ⚠️ Sidebar Persistence - Missing Initial Load

**規格要求** (copilot-instructions.md, Line 131):
```
Sidebar Persistence: Sidebar open/close state saved to localStorage
- Key: sidebar-open (string: 'true' or 'false')
- Restored on page load
```

**當前實現問題** (page.tsx + useUIState.ts):
- `useUIState` 初始化時 `showSidebar: false`
- 沒有在 `useEffect` 中從 localStorage 復原

**修復** (useUIState.ts):
```tsx
export const useUIState = () => {
  const [uiState, setUIState] = useState<UIState>(() => {
    // ✅ 在初始狀態就從 localStorage 讀取
    const stored = localStorage.getItem('sidebar-open');
    return {
      showSettings: false,
      showSidebar: stored === 'true', // 預設 false，存儲的話用存儲值
      showCamera: false,
      previewImage: null,
      isSelectMode: false,
      copiedMessageIndex: null,
      showScrollToTop: false,
      showScrollToBottom: false,
      showErrorSuggestion: false,
      showTechnicalDetails: false,
    };
  });
  
  // ... rest of code
};
```

---

## 7. ❌ Image State - Not Cleared on Session Switch

**規格要求** (copilot-instructions.md, Line 116):
```
- Clear on: Page reload, session switch, after successful send
```

**當前實現問題** (useSessionManagement.ts, Line 34-48):
```tsx
const handleSwitchSession = useCallback((sessionId: string) => {
  setCurrentSessionId(sessionId);
  // ✅ 有清除 image
  setImage(null);
  setImageUrl("");
  // ...
}, [...]);
```

**這部分其實是對的**，但需要確認沒有 race condition。

---

## 8. ❌ useGeminiAPI - shouldScrollToQuestion 設置時機不對

**規格要求** (copilot-instructions.md, Line 150):
```
Implementation: Direct DOM manipulation in handleSubmit
- sets paddingBottom: 80vh when loading starts, removes when complete
```

**當前實現問題** (useGeminiAPI.ts, Line 260-263):
```tsx
const handleSubmit = useCallback(async (
  promptText: string | undefined,
  image: File | null,
  imageUrl: string,
  setImage: (img: File | null) => void,
  setImageUrl: (url: string) => void
) => {
  // ...
  
  // 直接在 chat state 加入 user message
  setDisplayConversation((prev: DisplayMessage[]) => [...prev, userMessage]);
  
  // ✅ 設置 scroll flag
  shouldScrollToQuestion.current = true;
  
  // 設置 padding
  if (chatContainerRef.current) {
    chatContainerRef.current.style.paddingBottom = '80vh';
  }
```

**問題**:
- ✅ 實現本身看起來是對的
- ⚠️ 但需要確認 padding 移除的時機（在 useScrollManagement 的 finally 中？）

---

## 9. ⚠️ Scroll Button Visibility - Performance Issue

**當前實現** (useScrollManagement.ts, Line 104-120):
```tsx
useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100;
    
    // ❌ 每次 scroll 都呼叫 setShowScrollToTop/setShowScrollToBottom
    // 這會導致不必要的 re-render
    setShowScrollToTop(scrollTop > threshold);
    setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - threshold);
  };

  handleScroll(); // Initial check
  container.addEventListener('scroll', handleScroll);
  
  return () => {
    container.removeEventListener('scroll', handleScroll);
  };
}, [displayConversation, chatContainerRef, setShowScrollToTop, setShowScrollToBottom]);
```

**問題**:
- 沒有 debounce，每個 scroll event 都更新 state
- 在頻繁捲動時會導致頻繁 re-render

**修復** (添加簡單的狀態比較):
```tsx
const prevShowStateRef = useRef({ top: false, bottom: false });

const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = container;
  const threshold = 100;
  
  const newShowTop = scrollTop > threshold;
  const newShowBottom = scrollTop < scrollHeight - clientHeight - threshold;
  
  // ✅ 只有在值改變時才更新
  if (newShowTop !== prevShowStateRef.current.top) {
    setShowScrollToTop(newShowTop);
    prevShowStateRef.current.top = newShowTop;
  }
  
  if (newShowBottom !== prevShowStateRef.current.bottom) {
    setShowScrollToBottom(newShowBottom);
    prevShowStateRef.current.bottom = newShowBottom;
  }
};
```

---

## 10. ⚠️ MessageBubble - Overflow-x-hidden Might Break Horizontal Scroll

**規格要求** (copilot-instructions.md, Line 157-164):
```
Code Block Overflow Handling: Custom wrapper with horizontal scroll for long code lines
- Wrapper: overflow-x-auto
- Negative margin (-mx-3) extends scroll area
- Works seamlessly on mobile (touch scroll) and desktop (mouse scroll)
```

**當前實現** (MessageBubble.tsx):
```tsx
const markdownComponents = useMemo(() => ({
  code({ node, inline, className, children, ...props }: any) {
    // ...
    return !inline && match ? (
      <div className="overflow-x-auto -mx-3 px-3 my-2" style={{ maxWidth: 'calc(100vw - 4rem)' }}>
        <SyntaxHighlighter
          // ...
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  // ...
}), [isDark]);
```

**問題**:
- ✅ code 塊本身有 `overflow-x-auto`
- ⚠️ 但上層的 prose container 呢？

**檢查** (MessageBubble 的 prose wrapper):
```tsx
<div className="prose prose-sm max-w-none dark:prose-invert" style={{ width: '100%', wordBreak: 'break-word' }}>
  <ReactMarkdown>
    {msg.text}
  </ReactMarkdown>
</div>
```

**問題**:
- prose container 沒有明確設定 `overflow-x-hidden`
- 但根據之前修改，好像有改成隱藏？
- ⚠️ 需要確認當前的狀態

---

## 11. ❌ User Manual Scroll Detection - Can't Distinguish Between Auto-scroll and Manual Scroll

**規格要求** (copilot-instructions.md, Line 149):
```
Detect user manual scroll and stop auto-scroll
Only disable auto-scroll if AI is currently responding
```

**當前實現問題** (useScrollManagement.ts, Line 126-145):
```tsx
useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  const handleUserScroll = () => {
    // ❌ 問題：無法區分 auto-scroll 和 manual scroll
    // 當 requestAnimationFrame 內的 container.scrollTo() 執行時
    // 也會觸發 'scroll' event
    // 導致 shouldAutoScroll.current 被設置為 false
    
    if (isLoading) {
      shouldAutoScroll.current = false;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    }
  };

  container.addEventListener('scroll', handleUserScroll, { passive: true });
  
  return () => {
    container.removeEventListener('scroll', handleUserScroll);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };
}, [isLoading, chatContainerRef]);
```

**問題**:
- `container.scrollTo({ behavior: 'smooth' })` 會觸發 'scroll' event
- 此時 `shouldAutoScroll.current` 會被誤認為用戶在手動捲動
- 導致 auto-scroll 被意外關閉

**解決方案**:
需要用 flag 區分誰觸發的 scroll：

```tsx
const isAutoScrollingRef = useRef(false);

// 在 auto-scroll useEffect 中設置 flag
useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  if (isLoading && shouldAutoScroll.current) {
    isAutoScrollingRef.current = true; // ✅ 標記正在 auto-scroll
    
    const rafId = requestAnimationFrame(() => {
      // ... scroll logic
      
      // 等 scroll 完成後再關閉 flag
      container.addEventListener('scroll', () => {
        isAutoScrollingRef.current = false;
      }, { once: true });
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      isAutoScrollingRef.current = false;
    };
  }
}, [isLoading]);

// 在 user scroll handler 中檢查 flag
const handleUserScroll = () => {
  // ✅ 只有在不是 auto-scroll 時才設置 false
  if (isLoading && !isAutoScrollingRef.current) {
    shouldAutoScroll.current = false;
  }
};
```

---

## Summary of Issues Found

| # | Issue | Severity | Type | Status |
|---|-------|----------|------|--------|
| 1 | Missing `loadSessions()` on init | CRITICAL | Session | ❌ Not Fixed |
| 2 | Scroll restoration has wrong dependency | CRITICAL | Scroll | ❌ Not Fixed |
| 3 | Auto-scroll has wrong dependency | CRITICAL | Scroll | ❌ Not Fixed |
| 4 | Scroll-to-question ref calc inefficient | HIGH | Scroll | ⚠️ Minor |
| 5 | Scroll-to-question offset calc wrong | HIGH | Scroll | ❌ Not Fixed |
| 6 | Sidebar persistence not restored | HIGH | UI State | ❌ Not Fixed |
| 7 | Image state cleanup (OK) | LOW | Image | ✅ OK |
| 8 | shouldScrollToQuestion timing | MEDIUM | Scroll | ⚠️ Check |
| 9 | Scroll button visibility perf issue | LOW | Performance | ⚠️ Minor |
| 10 | Code block overflow handling | LOW | UI | ⚠️ Check |
| 11 | Manual scroll detection incorrect | HIGH | Scroll | ❌ Not Fixed |

---

## Recommended Fix Order

1. **Fix #1**: Add `loadSessions()` on init (trivial, fixes sidebar)
2. **Fix #2**: Remove `displayConversation.length` from scroll restoration dependency
3. **Fix #3**: Remove `displayConversation` from auto-scroll dependency
4. **Fix #5**: Use `getBoundingClientRect()` for scroll-to-question calculation
5. **Fix #6**: Load sidebar state from localStorage in `useUIState` init
6. **Fix #11**: Add `isAutoScrollingRef` flag to distinguish auto vs manual scroll
7. **Fix #4**: Add `useMemo` for `lastUserMessageIndex` in ChatArea
8. **Fix #9**: Add state comparison to prevent unnecessary re-renders of scroll buttons

---

## Testing Strategy

After each fix:
1. Run `npm run dev`
2. Test session switching (sidebar should populate, scroll position should restore)
3. Test scroll-to-question (should scroll to last user message at top of viewport)
4. Test auto-scroll during AI response (should maintain user scroll if they manually scroll)
5. Run `npm run test` to check for test regressions

**Don't apply multiple fixes at once** - apply one, test thoroughly, commit, then move to next.
