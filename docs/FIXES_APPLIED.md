# QuizMate v1.2.0 - Fixes Applied

## Summary
已應用 **8 個關鍵修復**，全部基於 spec compliance audit。每個修復都經過 TypeScript 編譯檢查無誤。

---

## Applied Fixes

### ✅ Fix #1: Missing `loadSessions()` on Page Load
**File**: `src/app/page.tsx`
**Change**: 在 session 復原的 useEffect 中加入 `loadSessions()` 呼叫
**Reason**: 復原 session ID 後需要重新載入側邊欄的對話列表
**Impact**: 修復側邊欄在頁面重整後顯示空白的問題

```tsx
// Before
useEffect(() => {
  const storedSessionId = localStorage.getItem('current-session-id');
  if (storedSessionId) {
    setCurrentSessionId(storedSessionId);
  }
}, []);

// After
useEffect(() => {
  const storedSessionId = localStorage.getItem('current-session-id');
  if (storedSessionId) {
    setCurrentSessionId(storedSessionId);
  }
  loadSessions(); // ✅ 新增
}, [loadSessions]);
```

---

### ✅ Fix #2: Scroll Position Restoration - Wrong Dependency
**File**: `src/hooks/useScrollManagement.ts`
**Change**: 移除 `displayConversation.length` 依賴，只依賴 `currentSessionId`
**Reason**: 規格明確要求：只在 session 切換時復原，不在 AI response 完成時復原
**Impact**: 修復 AI response 完成後捲動位置被意外重置的問題

```tsx
// Before
useEffect(() => {
  // ...
  if (prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId) {
    // restore logic
  }
  prevSessionIdRef.current = currentSessionId;
}, [currentSessionId, displayConversation.length, chatContainerRef]); // ❌ 錯誤的依賴

// After
useEffect(() => {
  // ...
  if (prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId) {
    // restore logic
  }
  prevSessionIdRef.current = currentSessionId;
}, [currentSessionId, chatContainerRef]); // ✅ 移除 displayConversation.length
```

---

### ✅ Fix #3: Auto-scroll During Loading - Wrong Dependency
**File**: `src/hooks/useScrollManagement.ts`
**Change**: 移除 `displayConversation` 依賴，只依賴 `isLoading`
**Reason**: Auto-scroll 應該只在 AI 回應時啟動，不應該在 user message 新增時觸發
**Impact**: 消除 scroll 事件競爭，修復 user message 發送時的多重 scroll 衝突

```tsx
// Before
useEffect(() => {
  if (isLoading && displayConversation.length > 0 && shouldAutoScroll.current) {
    // ...
  }
}, [isLoading, chatContainerRef, lastUserMessageRef, displayConversation]); // ❌ 依賴太多

// After
useEffect(() => {
  if (isLoading && shouldAutoScroll.current) {
    // ...
  }
}, [isLoading, chatContainerRef, lastUserMessageRef]); // ✅ 只依賴必要的
```

---

### ✅ Fix #4: Scroll-to-Question Performance
**File**: `src/components/ChatArea.tsx`
**Change**: 用 `useMemo` 優化 `lastUserMessageIndex` 計算
**Reason**: 之前在每次 render 時都重新計算，O(n) 複雜度
**Impact**: 減少不必要的計算，提升性能

```tsx
// Before
{displayConversation.map((msg, index) => {
  const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
    if (m.role === 'user') acc.push(i);
    return acc;
  }, []);
  const lastUserIndex = userMessageIndices[userMessageIndices.length - 1];
  const isLastUserMessage = msg.role === 'user' && index === lastUserIndex;
  // ...
})}

// After
{(() => {
  const lastUserMessageIndex = useMemo(() => {
    for (let i = displayConversation.length - 1; i >= 0; i--) {
      if (displayConversation[i].role === 'user') {
        return i;
      }
    }
    return -1;
  }, [displayConversation]);
  
  return displayConversation.map((msg, index) => {
    const isLastUserMessage = msg.role === 'user' && index === lastUserMessageIndex;
    // ...
  });
})()}
```

---

### ✅ Fix #5: Scroll-to-Question Calculation
**File**: `src/hooks/useScrollManagement.ts`
**Change**: 用 `getBoundingClientRect()` 取代 `offsetParent` 鏈計算
**Reason**: `offsetParent` 鏈可能不經過 container，導致計算錯誤
**Impact**: 修復 scroll-to-question 目標位置計算不正確的問題

```tsx
// Before
let messageTop = userMessage.offsetTop;
let el = userMessage.offsetParent as HTMLElement | null;
while (el && el !== container) {
  messageTop += (el.offsetTop || 0);
  el = el.offsetParent as HTMLElement | null;
}
container.scrollTo({
  top: messageTop - 16,
  behavior: 'smooth'
});

// After
const messageRect = userMessage.getBoundingClientRect();
const containerRect = container.getBoundingClientRect();
const relativeTop = messageRect.top - containerRect.top;
const scrollTop = container.scrollTop;
container.scrollTo({
  top: scrollTop + relativeTop - 16,
  behavior: 'smooth'
});
```

---

### ✅ Fix #6: Sidebar Persistence from localStorage
**File**: `src/hooks/useUIState.ts`
**Change**: 在 state 初始化時從 localStorage 讀取 sidebar 狀態
**Reason**: 規格要求在頁面重整時復原 sidebar 的開閉狀態
**Impact**: 修復 sidebar 狀態在頁面重整後被重置的問題

```tsx
// Before
const [uiState, setUIState] = useState<UIState>({
  showSettings: false,
  showSidebar: false, // ❌ 總是預設 false
  // ...
});

// After
const [uiState, setUIState] = useState<UIState>(() => {
  const storedSidebarOpen = localStorage.getItem('sidebar-open');
  return {
    showSettings: false,
    showSidebar: storedSidebarOpen === 'true', // ✅ 從 localStorage 讀取
    // ...
  };
});
```

---

### ✅ Fix #11: Manual Scroll Detection - Auto-scroll Flag
**File**: `src/hooks/useScrollManagement.ts`
**Change**: 加入 `isAutoScrollingRef` 來區分 auto-scroll 和 manual scroll
**Reason**: `container.scrollTo()` 會觸發 'scroll' event，導致誤認為用戶在手動捲動
**Impact**: 修復用戶在 AI 回應時手動捲動被誤認為 auto-scroll 的問題

```tsx
// Before
const handleUserScroll = () => {
  if (isLoading) {
    shouldAutoScroll.current = false; // ❌ 無法區分 auto vs manual
  }
};

// After
const isAutoScrollingRef = useRef(false);

// 在 auto-scroll useEffect 中
isAutoScrollingRef.current = true;
const scrollHandler = () => {
  isAutoScrollingRef.current = false;
  container.removeEventListener('scroll', scrollHandler);
};
container.addEventListener('scroll', scrollHandler, { once: true });

// 在 manual scroll handler 中
const handleUserScroll = () => {
  if (isLoading && !isAutoScrollingRef.current) { // ✅ 檢查 flag
    shouldAutoScroll.current = false;
  }
};
```

---

### ✅ Fix #9: Scroll Button Visibility Performance
**File**: `src/hooks/useScrollManagement.ts`
**Change**: 只在值改變時才更新 state，減少不必要的 re-render
**Reason**: 頻繁的 scroll event 導致頻繁 re-render
**Impact**: 改善 scroll 時的性能

```tsx
// Before
const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = container;
  setShowScrollToTop(scrollTop > threshold); // ❌ 每次都更新
  setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - threshold);
};

// After
const prevShowStateRef = useRef({ top: false, bottom: false });

const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = container;
  const newShowTop = scrollTop > threshold;
  const newShowBottom = scrollTop < scrollHeight - clientHeight - threshold;
  
  if (newShowTop !== prevShowStateRef.current.top) { // ✅ 只在值改變時更新
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

## Testing Checklist

- [x] TypeScript 編譯通過 (0 errors)
- [ ] 開發服務器正常運行 (npm run dev on port 3001)
- [ ] 頁面重整時側邊欄載入正常
- [ ] Session 切換時捲動位置恢復正確
- [ ] AI 回應時自動捲動到最後 user message
- [ ] 手動捲動時 auto-scroll 停止
- [ ] Scroll buttons 顯示/隱藏邏輯正確
- [ ] 沒有新的 regression

---

## Files Modified

1. `src/app/page.tsx` - Session initialization
2. `src/hooks/useScrollManagement.ts` - Scroll behavior (multiple fixes)
3. `src/hooks/useUIState.ts` - Sidebar persistence
4. `src/components/ChatArea.tsx` - lastUserMessageIndex optimization

---

## Next Steps

1. Manual test all features in browser
2. Run full test suite: `npm run test`
3. If all pass, commit changes
4. Monitor for regressions

