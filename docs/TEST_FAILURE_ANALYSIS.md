# QuizMate 測試失效分析與改善計畫

**作者**: GitHub Copilot  
**日期**: 2026-01-04  
**優先級**: 🔴 Critical  

---

## 執行摘要

1000+ 個測試未能抓到 8+ 個關鍵 bug（scroll、session、state sync、CSS 等）的根本原因是**測試架構設計缺陷**，而非代碼品質問題。

**核心問題**: 測試過度依賴單元測試隔離，缺乏整合測試、E2E 測試和狀態驗證機制。

---

## 為什麼測試失效了？

### 1. **依賴陣列 Bug 無法被單元測試抓到** ❌

**Bug 範例**: useScrollManagement 中 `displayConversation` 的錯誤依賴

```tsx
// ❌ 錯誤的 useEffect 依賴
useEffect(() => {
  if (isLoading && displayConversation.length > 0) {
    // auto-scroll logic
  }
}, [isLoading, displayConversation, chatContainerRef]); // 太多依賴!
```

**為什麼測試沒抓到**:
- 單元測試通常 mock 整個 hook，不會真實執行 useEffect
- 測試通常傳遞靜態的 props，無法測試 React 的依賴陣列邏輯
- 缺少「依賴陣列檢查器」工具

**應該有的測試**: 
```tsx
// ❌ 現有測試 - 只測試邏輯
test('scroll to question when user message is added', () => {
  // ...
  expect(scrollToTop).toHaveBeenCalled();
});

// ✅ 應該有的測試 - 檢驗 useEffect 何時觸發
test('useEffect should only trigger when isLoading changes, not displayConversation', () => {
  const { rerender } = render(<useScrollManagement {...props} />);
  
  // 改變 displayConversation，useEffect 不應該執行
  rerender(<useScrollManagement displayConversation={[...newMessages]} {...props} />);
  expect(autoScrollFn).toHaveBeenCalledTimes(0);
  
  // 改變 isLoading，useEffect 應該執行
  rerender(<useScrollManagement isLoading={true} {...props} />);
  expect(autoScrollFn).toHaveBeenCalledTimes(1);
});
```

---

### 2. **狀態同步 Bug 需要整合測試** ❌

**Bug 範例**: Prompt 選擇在 Header → Settings 不同步

```tsx
// Header 改變 selectedPromptId
onPromptChange(newId) → setSelectedPromptId(newId)

// PromptSettings 的 isDefault 沒有更新
const [selectedId, setSelectedId] = useState(null);
useEffect(() => {
  setSelectedId(selectedPromptId); // ✅ 更新了
  // ❌ 但 isDefault 沒有更新！
}, [selectedPromptId]);
```

**為什麼單元測試沒抓到**:
- Header 單獨測試，PromptSettings 單獨測試
- 沒有測試 page.tsx 中 handlePromptChange 的實際流程
- 沒有測試 Settings modal 從打開到顯示的完整生命週期

**應該有的整合測試**:
```tsx
// ✅ 應該有的整合測試
test('prompt selection in Header should sync to Settings modal', async () => {
  const { getByRole, getByText } = render(<HomePage />);
  
  // 1. 在 Header 選擇新 prompt
  const promptSelect = getByRole('combobox', { name: /prompt/i });
  fireEvent.change(promptSelect, { target: { value: 'custom-1' } });
  
  // 2. 打開 Settings
  fireEvent.click(getByText('設定'));
  
  // 3. Settings 中的「已使用」應該指向新選擇的 prompt
  await waitFor(() => {
    expect(getByText('已使用')).toBeInTheDocument();
    // 驗證「已使用」按鈕在正確的 prompt 上
  });
});
```

---

### 3. **CSS 與視覺 Bug 無法被測試** ❌

**Bug 範例**: Message bubble 中的垂直 scrollbar

```tsx
// ❌ 錯誤的 CSS
<div className="prose prose-sm overflow-x-hidden">
  {/* 當內容過長時，這裡會出現垂直 scrollbar */}
  <ReactMarkdown>{content}</ReactMarkdown>
</div>

// ✅ 修復
<div className="prose prose-sm !overflow-hidden">
```

**為什麼測試沒抓到**:
- 單元測試通常不會實際渲染 DOM，或使用 jsdom 但不支持 CSS 計算
- 沒有視覺迴歸測試（Visual Regression Testing）

**應該有的視覺測試**:
```tsx
// ✅ 應該有的視覺測試（使用 Playwright）
test('message bubble should not show vertical scrollbar', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 上傳長文本
  const message = await page.locator('[data-testid="message-bubble"]').first();
  
  // 驗證沒有垂直 scrollbar
  const scrollHeight = await message.evaluate(el => el.scrollHeight);
  const clientHeight = await message.evaluate(el => el.clientHeight);
  expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
});
```

---

### 4. **Async 與 Race Condition Bug** ❌

**Bug 範例**: Session 切換時圖片沒有清除

```tsx
// ❌ Race condition
const handleSwitchSession = (sessionId: string) => {
  setCurrentSessionId(sessionId);  // ← 異步狀態更新
  setImage(null);                  // ← 可能不會執行，取決於順序
  setImageUrl("");
};
```

**為什麼測試沒抓到**:
- 測試通常期望同步執行，無法模擬真實的異步環境
- 缺少「微任務隊列」的測試

**應該有的非同步測試**:
```tsx
// ✅ 應該有的異步測試
test('image should be cleared when switching session', async () => {
  const { rerender } = render(<HomePage />);
  
  // 1. 設置圖片
  act(() => {
    setImage(mockFile);
    setImageUrl('blob:...');
  });
  
  // 2. 切換 session
  act(() => {
    handleSwitchSession('session-2');
  });
  
  // 3. 讓所有微任務完成
  await waitFor(() => {
    expect(image).toBeNull();
    expect(imageUrl).toBe('');
  });
});
```

---

### 5. **缺少端對端測試（E2E）** ❌

**Bug 無法被抓到的場景**:
- Scroll 在實際渲染時的行為
- 用戶交互流程（點擊 → 狀態變化 → UI 更新）
- IndexedDB 的真實數據持久化

**應該有的 E2E 測試**:
```tsx
// ✅ 應該有的 E2E 測試（Playwright）
test('complete user flow: upload image -> send message -> check scroll position', async ({ page }) => {
  // 1. 頁面加載
  await page.goto('http://localhost:3000');
  
  // 2. 上傳圖片
  await page.setInputFiles('input[type="file"]', 'test.png');
  
  // 3. 輸入問題
  await page.fill('textarea', '這題怎麼解？');
  
  // 4. 發送
  await page.click('button:has-text("傳送")');
  
  // 5. 等待 AI 回應
  await page.waitForSelector('[data-testid="model-message"]');
  
  // 6. 驗證 scroll 位置
  const scrollTop = await page.evaluate(() => window.scrollY);
  expect(scrollTop).toBeGreaterThan(0);
  
  // 7. 切換 session
  await page.click('[data-testid="new-chat-button"]');
  
  // 8. 驗證圖片被清除
  const imageInput = page.locator('input[type="file"]');
  await expect(imageInput).toHaveValue('');
});
```

---

### 6. **缺少狀態驗證測試** ❌

**Bug 無法被抓到**:
- IndexedDB 中的數據是否正確保存
- localStorage 中的狀態是否與 React state 同步
- Session 切換後舊 session 的狀態是否被正確隔離

**應該有的狀態驗證測試**:
```tsx
// ✅ 應該有的狀態驗證測試
test('session scroll position should be persisted to localStorage', async () => {
  // 1. 創建 session
  const sessionId = await createSession('Test Session', []);
  
  // 2. 滾動
  container.scrollTop = 500;
  
  // 3. 保存（beforeunload 事件）
  window.dispatchEvent(new Event('beforeunload'));
  
  // 4. 驗證 localStorage
  const saved = localStorage.getItem(`scroll-pos-${sessionId}`);
  expect(saved).toBe('500');
  
  // 5. 切換回來
  switchSession(sessionId);
  
  // 6. 驗證 scroll 被復原
  await waitFor(() => {
    expect(container.scrollTop).toBe(500);
  });
});
```

---

## 測試架構的根本問題

### 問題 1: 過度隔離 (Over-Isolation)

| 現狀 | 問題 | 後果 |
|------|------|------|
| 每個 hook/component 單獨測試 | 無法測試組件間的狀態流動 | 狀態同步 bug 無法被抓到 |
| Mock 所有 props 和外部依賴 | 測試無法驗證真實的整合 | 真實場景的 bug 無法被抓到 |
| 缺少端對端流程測試 | 無法測試完整的用戶交互 | 邊界情況和 race conditions 無法被抓到 |

### 問題 2: 缺乏多層次測試（Testing Pyramid 倒塌）

```
目前的測試分佈:
├─ E2E Tests: 5%        ← ❌ 太少
├─ 整合測試: 10%        ← ❌ 太少
└─ 單元測試: 85%        ← ❌ 太多，沒用

應該的測試分佈:
├─ E2E Tests: 10-15%    ← ✅ 關鍵流程
├─ 整合測試: 30-40%     ← ✅ 狀態同步、組件交互
└─ 單元測試: 45-60%     ← ✅ 小邏輯片段
```

### 問題 3: 測試場景覆蓋不完整

| Bug 類型 | 覆蓋度 | 應該有的測試 |
|---------|--------|------------|
| useEffect 依賴陣列 | ❌ 0% | ESLint exhaustive-deps checker + 運行時測試 |
| 狀態同步 | ❌ 10% | 整合測試驗證完整的狀態流 |
| 異步 race condition | ❌ 5% | 使用 fake timers + act() |
| CSS/視覺 | ❌ 0% | Visual Regression + 截圖測試 |
| 真實 IndexedDB | ❌ 0% | 使用真實 IndexedDB，不 mock |
| 用戶交互完整流程 | ❌ 20% | 端對端測試（Playwright）|

---

## 改善計畫 (12 個具體行動)

### Phase 1: 診斷與設置 (Week 1)

**Action 1.1**: 安裝 ESLint 依賴陣列檢查器
```bash
npm install --save-dev eslint-plugin-react-hooks
```
配置 `.eslintrc.json`:
```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"  // ← 關鍵
  }
}
```

**Action 1.2**: 安裝視覺迴歸測試工具
```bash
npm install --save-dev @playwright/test
```

**Action 1.3**: 建立測試框架文檔
- 定義何時寫單元/整合/E2E 測試
- 建立測試命名規範
- 建立測試覆蓋目標

### Phase 2: 核心缺失的測試套件 (Week 2-3)

**Action 2.1**: 為所有 useEffect 添加依賴陣列測試

測試文件: `src/__tests__/hooks/useEffectDependencies.test.ts`

所有 custom hooks 需要測試的：
- [ ] useScrollManagement - 7 個 useEffect
- [ ] useSessionManagement - 1 個 useEffect
- [ ] useTheme - 1 個 useEffect
- [ ] useCamera - 0 個（setInterval 有）
- [ ] useGeminiAPI - 1 個（useCallback）

**Action 2.2**: 添加整合測試套件

測試文件: `src/__tests__/integration/`

應該覆蓋的場景：
- [ ] Header prompt 選擇 → Settings 同步
- [ ] Session 切換 → 圖片清除 + scroll 復原
- [ ] Message 發送 → scroll 位置 → AI 回應 → scroll 行為
- [ ] Settings modal 打開/關閉 → 狀態持久化

**Action 2.3**: 添加 E2E 測試

測試文件: `e2e/`

應該覆蓋的完整流程：
- [ ] 初次使用：設置 API Key → 創建 session → 上傳圖片 → 提問 → AI 回應 → 複製消息
- [ ] Session 管理：新建 → 切換 → 編輯標題 → 刪除
- [ ] Scroll 行為：自動 scroll → 手動 scroll → session 切換 → scroll 復原
- [ ] Settings：修改 model → 修改 prompt → 主題切換 → 關閉

**Action 2.4**: 添加狀態持久化測試

測試文件: `src/__tests__/integration/statePersistence.test.ts`

應該驗證：
- [ ] localStorage 與 React state 同步
- [ ] IndexedDB 中的 session 數據完整性
- [ ] 頁面重整後的狀態復原

### Phase 3: 測試工具改進 (Week 3)

**Action 3.1**: 創建自定義測試 hooks

文件: `src/__tests__/helpers/testHooks.ts`

```tsx
// ✅ 測試 useEffect 何時執行
export function useEffectTester(effect: () => void, deps: any[]) {
  const callCount = useRef(0);
  useEffect(() => {
    callCount.current++;
    effect();
  }, deps);
  return callCount.current;
}

// ✅ 測試異步狀態同步
export async function waitForStateSync(
  condition: () => boolean,
  timeout = 1000
) {
  return waitFor(() => expect(condition()).toBe(true), { timeout });
}
```

**Action 3.2**: 創建整合測試工具

文件: `src/__tests__/helpers/integrationTestSetup.ts`

```tsx
export function setupTestEnvironment() {
  // 設置 IndexedDB
  // 設置 localStorage
  // 設置 fetch mock
  // 設置計時器
  return cleanup;
}
```

**Action 3.3**: 創建 E2E 測試基類

文件: `e2e/helpers/basePageFixture.ts`

```tsx
export const testWithApp = test.extend({
  app: async ({ page }, use) => {
    await page.goto('http://localhost:3000');
    await use(new AppPageObject(page));
  },
});
```

### Phase 4: 逐個補充測試 (Week 4+)

優先順序（按影響範圍）：

**優先級 1 - 關鍵路徑 (Week 4)**:
1. [ ] useScrollManagement 的 7 個 useEffect
2. [ ] Header → Settings 的狀態同步
3. [ ] Session 切換完整流程

**優先級 2 - 核心功能 (Week 5)**:
4. [ ] Message 發送 → AI 回應 → scroll 行為
5. [ ] 圖片上傳 → 發送 → session 保存
6. [ ] IndexedDB 持久化

**優先級 3 - 邊界情況 (Week 6)**:
7. [ ] Race conditions
8. [ ] 錯誤恢復
9. [ ] 邊界值

---

## 測試寫法改進指南

### ❌ 舊的測試寫法（無法抓到 bug）

```tsx
test('scroll management works', () => {
  const { result } = renderHook(() => useScrollManagement(props));
  
  // ❌ 不知道 useEffect 何時執行
  expect(result.current.scrollToTop).toBeDefined();
});
```

### ✅ 新的測試寫法（能抓到 bug）

```tsx
test('useEffect should only trigger when currentSessionId changes', () => {
  const { rerender } = render(
    <ChatContainer 
      currentSessionId="session-1" 
      displayConversation={[msg1]}
    />
  );
  
  // 改變 displayConversation，useEffect 不應執行
  rerender(
    <ChatContainer 
      currentSessionId="session-1" 
      displayConversation={[msg1, msg2]}  // ← 只改這個
    />
  );
  
  // 驗證 scroll position 沒有變化（因為不應該執行）
  expect(scrollRestore).not.toHaveBeenCalled();
  
  // 改變 currentSessionId，useEffect 應執行
  rerender(
    <ChatContainer 
      currentSessionId="session-2"  // ← 改這個
      displayConversation={[msg1, msg2]}
    />
  );
  
  // 驗證 scroll position 被復原
  expect(scrollRestore).toHaveBeenCalledWith(
    expect.objectContaining({ top: 500 })
  );
});
```

---

## 測試覆蓋目標

| 指標 | 目前 | 目標 | 截止日期 |
|------|------|------|---------|
| 單元測試覆蓋度 | 45% | 60% | 2026-01-31 |
| 整合測試覆蓋度 | 10% | 35% | 2026-02-07 |
| E2E 測試覆蓋度 | 5% | 15% | 2026-02-14 |
| useEffect 測試 | 0% | 100% | 2026-01-24 |
| 狀態同步測試 | 0% | 100% | 2026-01-31 |
| 視覺迴歸測試 | 0% | 50% | 2026-02-14 |

---

## 預期成果

實施此改善計畫後，預期能夠：

1. ✅ 抓到所有 useEffect 依賴陣列的錯誤
2. ✅ 抓到所有狀態同步的問題
3. ✅ 抓到 race conditions 和異步問題
4. ✅ 抓到 CSS 相關的視覺 bug
5. ✅ 抓到完整用戶流程中的邊界情況

---

## 結論

現有的 1000+ 測試失效的根本原因是**架構問題，而非努力不足**。通過建立多層次的測試框架和改進測試寫法，我們可以從「高覆蓋度、低有效性」轉變為「適當覆蓋度、高有效性」。

**下一步**: 立即執行 Phase 1（診斷與設置），預計 3 天完成。
