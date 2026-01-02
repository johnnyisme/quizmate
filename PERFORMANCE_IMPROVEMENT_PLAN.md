# QuizMate 性能優化計畫

## 📊 現況分析

### 主要性能瓶頸

#### 🔴 Critical - 輸入卡頓問題
**問題描述**：在有大量對話歷史時，輸入文字會卡頓  
**根本原因**：
1. **37 個 useState** - 每次輸入都觸發大量 state 更新
2. **16 個 useEffect** - 部分沒有優化依賴陣列，造成過度 re-render
3. **重複的 useEffect** - 同樣的 scrollIntoView 邏輯重複出現 2 次
4. **MessageBubble 渲染成本** - 雖有 React.memo，但 props 未 memoized
5. **ReactMarkdown + KaTeX + SyntaxHighlighter** - 每次 re-render 都重新解析

#### 🟡 High - Session 列表性能
**問題描述**：側邊欄 session 列表在數量多時會拖慢整體性能  
**根本原因**：
1. **sessionList 沒有虛擬化** - 10+ sessions 全部渲染
2. **每個 session hover 都有複雜的 CSS transition**
3. **IndexedDB 查詢未優化** - `listSessions()` 每次都全部載入

#### 🟡 High - 記憶體洩漏風險
**問題描述**：長時間使用後可能記憶體占用過高  
**根本原因**：
1. **displayConversation 持續累積** - 沒有上限
2. **imageUrl 使用 URL.createObjectURL** - 未手動 revoke
3. **cameraStream 可能未正確釋放**
4. **scroll event listener 未 debounce**

---

## 🎯 優化目標

### KPI 指標
- ✅ **輸入延遲** < 16ms (60fps)
- ✅ **首次渲染** < 1s
- ✅ **Session 切換** < 200ms
- ✅ **記憶體占用** 穩定在 50MB 以內（100+ 訊息）

---

## 📋 執行計畫

### Phase 1: 輸入卡頓修復 (P0 - 最高優先)

#### 1.1 狀態管理重構
**目標**：減少 state 數量，合併相關 state

```typescript
// Before: 37 個獨立 state
const [apiKeys, setApiKeys] = useState<string[]>([]);
const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
const [selectedModel, setSelectedModel] = useState<ModelType>("gemini-2.5-flash");
const [thinkingMode, setThinkingMode] = useState<ThinkingMode>("fast");
// ... 還有 33 個

// After: 使用 useReducer + 分組 state
const [uiState, setUIState] = useState({
  showSettings: false,
  showSidebar: false,
  showCamera: false,
  isSelectMode: false,
  inputFocused: false,
  // ...
});

const [chatState, setChatState] = useState({
  currentPrompt: "",
  isLoading: false,
  displayConversation: [],
  apiHistory: [],
  // ...
});

const [settingsState, setSettingsState] = useState({
  apiKeys: [],
  currentKeyIndex: 0,
  selectedModel: "gemini-2.5-flash",
  // ...
});
```

**效益**：
- 減少 re-render 次數 50%+
- 降低 reconciliation 成本

#### 1.2 useCallback/useMemo 優化
**目標**：穩定化 MessageBubble props

```typescript
// Before: 每次 render 都創建新函數
<MessageBubble
  onToggleSelect={(index) => toggleMessageSelect(index)}
  onCopyMessage={(text, index) => handleCopyMessage(text, index)}
/>

// After: 使用 useCallback
const handleToggleSelect = useCallback((index: number) => {
  toggleMessageSelect(index);
}, []);

const handleCopyMessage = useCallback((text: string, index: number) => {
  // ... logic
}, []);

<MessageBubble
  onToggleSelect={handleToggleSelect}
  onCopyMessage={handleCopyMessage}
/>
```

**效益**：
- MessageBubble memo 真正生效
- 避免不必要的子組件 re-render

#### 1.3 輸入框獨立為組件
**目標**：隔離輸入狀態，避免影響整個頁面

```typescript
// 新建 src/components/ChatInput.tsx
export const ChatInput = React.memo(({ onSubmit, isLoading }) => {
  const [localPrompt, setLocalPrompt] = useState("");
  
  const handleChange = (e) => {
    setLocalPrompt(e.target.value);
    // 不觸發父組件 state 更新
  };
  
  const handleSubmit = () => {
    onSubmit(localPrompt);
    setLocalPrompt("");
  };
  
  return <textarea value={localPrompt} onChange={handleChange} />;
});
```

**效益**：
- 輸入時只更新 ChatInput 內部狀態
- 不觸發整個 HomePage re-render
- **預期提升 80%+ 輸入流暢度**

#### 1.4 清理重複 useEffect
**目標**：移除重複邏輯

```typescript
// Before: 重複 2 次
useEffect(() => {
  if (showErrorSuggestion && errorSuggestionRef.current) {
    setTimeout(() => {
      errorSuggestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}, [showErrorSuggestion]);

// 同樣的邏輯又出現一次...

// After: 合併為一個
useEffect(() => {
  if (showErrorSuggestion && errorSuggestionRef.current) {
    setTimeout(() => {
      errorSuggestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
  
  if (showTechnicalDetails && errorTechnicalRef.current) {
    setTimeout(() => {
      errorTechnicalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}, [showErrorSuggestion, showTechnicalDetails]);
```

**預期成果**：
- ✅ 輸入延遲從 100ms+ 降到 <16ms
- ✅ 60fps 流暢輸入體驗

---

### Phase 2: Session 列表虛擬化 (P0)

#### 2.1 引入 react-window
**目標**：只渲染可見的 session

```bash
npm install react-window
```

```typescript
// src/components/SessionList.tsx
import { FixedSizeList as List } from 'react-window';

export const SessionList = ({ sessions, onSelect }) => {
  const Row = ({ index, style }) => {
    const session = sessions[index];
    return (
      <div style={style}>
        <SessionItem session={session} onClick={() => onSelect(session.id)} />
      </div>
    );
  };

  return (
    <List
      height={600}
      itemCount={sessions.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

**效益**：
- 100 個 sessions → 只渲染可見的 7-8 個
- **預期減少 90%+ DOM 節點**

#### 2.2 Session 預載優化
**目標**：lazy load session messages

```typescript
// Before: 全部載入
const { sessions: sessionList, loadSessions } = useSessionHistory();

// After: 只載入 metadata
const listSessionMetadata = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_SESSIONS, 'readonly');
  const index = tx.store.index('updatedAt');
  
  const sessions = await index.getAll();
  
  // 只返回必要欄位，不載入 messages
  return sessions.map(s => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt,
    messageCount: s.messages.length,
  }));
};
```

**預期成果**：
- ✅ 側邊欄滾動 60fps
- ✅ Session 切換 <200ms

---

### Phase 3: Markdown 渲染優化 (P1)

#### 3.1 虛擬化訊息列表
**目標**：長對話時只渲染可見訊息

```typescript
// src/components/VirtualizedChat.tsx
import { VariableSizeList as List } from 'react-window';

export const VirtualizedChat = ({ messages }) => {
  const listRef = useRef<List>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});

  const getRowHeight = (index: number) => {
    return rowHeights.current[index] || 100; // 預設高度
  };

  const Row = ({ index, style }) => (
    <div style={style}>
      <MessageBubble
        msg={messages[index]}
        onHeightChange={(height) => {
          rowHeights.current[index] = height;
          listRef.current?.resetAfterIndex(index);
        }}
      />
    </div>
  );

  return (
    <List
      ref={listRef}
      height={600}
      itemCount={messages.length}
      itemSize={getRowHeight}
    >
      {Row}
    </List>
  );
};
```

**效益**：
- 100 訊息 → 只渲染可見的 5-6 條
- **減少 95% Markdown/KaTeX 解析成本**

#### 3.2 Markdown 解析快取
**目標**：避免重複解析相同內容

```typescript
// src/lib/useMarkdownCache.ts
const markdownCache = new Map<string, React.ReactElement>();

export const useMarkdownCache = (text: string) => {
  return useMemo(() => {
    const cached = markdownCache.get(text);
    if (cached) return cached;

    const rendered = (
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
      >
        {text}
      </ReactMarkdown>
    );

    markdownCache.set(text, rendered);
    if (markdownCache.size > 100) {
      // LRU cleanup
      const firstKey = markdownCache.keys().next().value;
      markdownCache.delete(firstKey);
    }

    return rendered;
  }, [text]);
};
```

**預期成果**：
- ✅ 切換 session 時不重新解析
- ✅ 渲染時間減少 70%+

---

### Phase 4: 記憶體優化 (P1)

#### 4.1 圖片 URL 清理
**目標**：防止記憶體洩漏

```typescript
// Before: 沒有清理
setImageUrl(URL.createObjectURL(file));

// After: 自動清理
useEffect(() => {
  if (imageUrl && imageUrl.startsWith('blob:')) {
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }
}, [imageUrl]);
```

#### 4.2 Scroll Event Debounce
**目標**：減少頻繁觸發

```typescript
// Before: 每次滾動都觸發
container.addEventListener('scroll', handleScroll);

// After: debounce
import { debounce } from 'lodash-es'; // 或自己實現

const debouncedScroll = useMemo(
  () => debounce(handleScroll, 100),
  []
);

container.addEventListener('scroll', debouncedScroll);
```

#### 4.3 訊息數量限制
**目標**：避免無限增長

```typescript
// src/lib/messageLimit.ts
const MAX_MESSAGES_IN_MEMORY = 100;

export const limitMessages = (messages: Message[]) => {
  if (messages.length > MAX_MESSAGES_IN_MEMORY) {
    // 保留最近 100 條
    return messages.slice(-MAX_MESSAGES_IN_MEMORY);
  }
  return messages;
};
```

**預期成果**：
- ✅ 記憶體占用穩定
- ✅ 長時間使用不卡頓

---

### Phase 5: Bundle Size 優化 (P2)

#### 5.1 Code Splitting
**目標**：減少首次載入

```typescript
// Before: 全部 import
import Settings from '@/components/Settings';
import PromptSettings from '@/components/PromptSettings';

// After: 動態 import
const Settings = dynamic(() => import('@/components/Settings'), {
  loading: () => <LoadingSpinner />,
});

const PromptSettings = dynamic(() => import('@/components/PromptSettings'), {
  loading: () => <LoadingSpinner />,
});
```

#### 5.2 移除未使用的依賴
**目標**：減少 bundle size

```bash
# 分析工具
npm install -D @next/bundle-analyzer

# package.json
"analyze": "ANALYZE=true next build"
```

**可能移除**：
- `rehype-raw` - 如果不需要 HTML 支持
- 部分 `react-syntax-highlighter` themes

**預期成果**：
- ✅ 首次載入 < 1s
- ✅ Bundle size 減少 20%+

---

## 🗓️ 實施時程

### Week 1: 輸入卡頓修復 (Phase 1)
- Day 1-2: 狀態管理重構
- Day 3: useCallback/useMemo 優化
- Day 4: ChatInput 組件化
- Day 5: 清理重複 useEffect + 測試

### Week 2: Session 優化 (Phase 2)
- Day 1-2: react-window 整合
- Day 3: Session metadata lazy loading
- Day 4-5: 測試 + 修復 bug

### Week 3: Markdown 優化 (Phase 3)
- Day 1-2: 虛擬化訊息列表
- Day 3: Markdown cache
- Day 4-5: 性能測試 + 調整

### Week 4: 記憶體 + Bundle (Phase 4-5)
- Day 1-2: 記憶體優化
- Day 3-4: Code splitting
- Day 5: 整體測試 + 文檔

---

## 📈 預期成效

| 指標 | 現況 | 目標 | 預期改善 |
|------|------|------|----------|
| 輸入延遲 | ~100ms | <16ms | **-84%** |
| 訊息渲染 | ~200ms | <50ms | **-75%** |
| Session 切換 | ~500ms | <200ms | **-60%** |
| 記憶體占用 | ~150MB | <50MB | **-66%** |
| 首次載入 | ~2s | <1s | **-50%** |

---

## 🧪 測試策略

### 性能測試工具
1. **React DevTools Profiler** - 追蹤 re-render
2. **Chrome Performance** - 分析主執行緒阻塞
3. **Lighthouse** - 整體性能評分
4. **Memory Profiler** - 記憶體洩漏檢測

### 測試場景
1. ✅ 輸入 100 字連續打字
2. ✅ 切換 10 個不同 sessions
3. ✅ 載入 50+ 訊息的長對話
4. ✅ 側邊欄滾動 100+ sessions
5. ✅ 長時間使用 1 小時+

---

## 🚨 風險評估

### 高風險項目
1. **狀態管理重構** - 可能破壞現有功能
   - 緩解：分階段重構，每步都有完整測試
   
2. **虛擬化列表** - 影響滾動行為
   - 緩解：保留原始版本作為 fallback

3. **Markdown cache** - 可能占用記憶體
   - 緩解：實施 LRU eviction 策略

### 中風險項目
1. **Code splitting** - 可能增加載入次數
   - 緩解：只對大型組件使用

---

## 📝 實施檢查清單

### Phase 1: 輸入卡頓
- [ ] 合併相關 state 為 3-5 個群組
- [ ] 所有 MessageBubble props 使用 useCallback
- [ ] ChatInput 獨立組件化
- [ ] 移除重複 useEffect
- [ ] 輸入測試 60fps 通過

### Phase 2: Session 優化
- [ ] 安裝 react-window
- [ ] SessionList 虛擬化
- [ ] 實作 session metadata API
- [ ] Session 切換 <200ms

### Phase 3: Markdown 優化
- [ ] VirtualizedChat 組件
- [ ] Markdown cache hook
- [ ] 渲染測試通過

### Phase 4: 記憶體優化
- [ ] 圖片 URL cleanup
- [ ] Scroll debounce
- [ ] 訊息數量限制
- [ ] Memory profiler 通過

### Phase 5: Bundle 優化
- [ ] Settings 動態 import
- [ ] Bundle analyzer 報告
- [ ] Lighthouse score >90

---

## 📚 參考資料

1. [React Performance Optimization Guide](https://react.dev/learn/render-and-commit)
2. [react-window Documentation](https://react-window.vercel.app/)
3. [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
4. [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

## 🎯 下一步行動

1. **立即開始 Phase 1** - 輸入卡頓是最影響用戶體驗的問題
2. **設置性能測試基準** - 記錄現況數據
3. **建立分支** - `feature/performance-optimization`
4. **逐步實施並測試** - 每個 Phase 完成後 merge

---

*最後更新：2026-01-02*  
*預計完成：2026-01-30*
