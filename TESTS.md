# QuizMate - 測試文檔

本專案包含 **926 個單元測試** + **4 個 E2E 測試**，涵蓋前端邏輯、React 組件、資料庫操作、UI 交互和工具函數。

## 測試框架
- **Vitest 1.6.1**: 單元測試框架
- **React Testing Library 16.3.1**: React 組件測試（DOM 渲染、ref forwarding 驗證）
- **jsdom 27.4.0**: 瀏覽器環境模擬
- **Playwright 1.57.0**: E2E 測試（完整用戶流程）
- **測試總數**: 930 tests (926 unit + 4 E2E)
- **測試覆蓋率**: ~90%

---

## 📋 測試文件總覽

### 核心頁面邏輯 (42 tests)
1. **`src/__tests__/page.test.ts`** - 前端主介面、Gemini API 整合、對話管理

### React 組件測試 (162 tests)
2. **`src/__tests__/messageBubbleRef.test.tsx`** (5 tests) ⭐ NEW - MessageBubble ref forwarding
3. **`src/components/__tests__/ApiKeySetup.test.tsx`** (33 tests) - API Key 管理介面
4. **`src/components/__tests__/Settings.test.tsx`** (41 tests) - Settings 模態視窗與 Tab
5. **`src/components/__tests__/PromptSettings.test.tsx`** (16 tests) - System Prompt 自訂
6. **`src/components/__tests__/PromptSettings.button.test.tsx`** (23 tests) - Prompt 按鈕邏輯
7. **`src/lib/__tests__/useAsyncState.test.ts`** (44 tests) - 非同步狀態管理 hook

### UI/UX 交互測試 (370 tests)
8. **`src/__tests__/copyMessage.test.ts`** (34 tests) - 訊息複製功能
9. **`src/__tests__/shareMessages.test.ts`** (31 tests) - 多則訊息選取與分享
10. **`src/__tests__/desktopShareButton.test.ts`** (21 tests) - 桌面端分享按鈕
11. **`src/__tests__/errorCloseButton.test.ts`** (22 tests) - 錯誤訊息關閉按鈕
12. **`src/__tests__/inputAutoGrow.test.ts`** (21 tests) - 輸入框自動高度
13. **`src/__tests__/scrollButtons.test.ts`** (31 tests) - 快速滾動按鈕
14. **`src/__tests__/smartScrollButtons.test.ts`** (23 tests) - 智慧滾動按鈕可見性
15. **`src/__tests__/scrollToQuestion.test.ts`** (16 tests) - 滾動到問題位置
16. **`src/__tests__/sessionTitleEdit.test.ts`** (24 tests) - 對話標題編輯
17. **`src/__tests__/sessionTimeFormat.test.ts`** (12 tests) - 對話時間格式
18. **`src/__tests__/sessionPersistence.test.ts`** (21 tests) - Session 持久化
19. **`src/__tests__/sessionHoverButtons.test.ts`** (22 tests) - Session hover 按鈕
20. **`src/__tests__/sidebarToggle.test.ts`** (30 tests) - 側邊欄開關
21. **`src/__tests__/sidebarPersistence.test.ts`** (10 tests) - 側邊欄狀態持久化
22. **`src/__tests__/scrollPositionMemory.test.ts`** (15 tests) - 滾動位置記憶
23. **`src/__tests__/cameraFeature.test.ts`** (37 tests) - 攝影機拍照功能

### 資料庫測試 (24 tests)
24. **`src/__tests__/db.test.ts`** (24 tests) - IndexedDB 對話儲存與 LRU

### Markdown 渲染測試 (205 tests)
25. **`src/__tests__/markdownRendering.test.ts`** (55 tests) - Markdown 基礎語法
26. **`src/__tests__/htmlSanitization.test.ts`** (72 tests) - HTML 安全過濾
27. **`src/__tests__/syntaxHighlighting.test.ts`** (78 tests) - 程式碼語法高亮

### Overflow 處理測試 (57 tests)
28. **`src/__tests__/tableOverflow.test.ts`** (33 tests) - 表格橫向滾動
29. **`src/__tests__/codeBlockOverflow.test.ts`** (24 tests) - 代碼區塊橫向滾動

### 錯誤處理測試 (25 tests)
30. **`src/__tests__/errorHandling.test.ts`** (25 tests) - 友善錯誤訊息轉換

### 工具函數測試 (30 tests)
31. **`src/__tests__/utils.test.ts`** (15 tests) - 通用工具函數
32. **`src/__tests__/truncatePromptName.test.ts`** (15 tests) - Prompt 名稱智慧截斷

### 主題測試 (17 tests)
33. **`src/__tests__/theme.test.ts`** (17 tests) - Dark Mode 切換

---

## 📝 重點測試詳解

### ⭐ NEW: MessageBubble Ref Forwarding (5 tests)
**文件**: `src/__tests__/messageBubbleRef.test.tsx`

修復 React.memo 重構時破壞的滾動功能，驗證 ref 在組件邊界正確傳遞。

**測試分類：**
- Ref 正確傳遞到 DOM 元素（當 `isLastUserMessage=true`）
- Ref 為 null（當 `isLastUserMessage=false`）  
- scrollIntoView 等滾動操作可用
- React.memo 包裝不影響 ref 傳遞
- 多個實例的 ref 正確隔離

**關鍵實作：**
```typescript
const MessageBubble = React.memo(
  React.forwardRef<HTMLDivElement, Props>(({ ... }, ref) => {
    return <div ref={isLastUserMessage ? ref : null}>...</div>;
  })
);
```

### 訊息複製功能 (34 tests)
**文件**: `src/__tests__/copyMessage.test.ts`

測試一鍵複製訊息內容的完整流程。

**測試分類：**
- Copy Logic: 基本複製、長文字、特殊字元、Markdown
- State Management: copiedMessageIndex 追蹤、2秒自動清除
- Visual Feedback: 圖示切換（複製 → 綠勾）
- Button Positioning: `absolute -bottom-2 -right-2`（泡泡外右下角）
- Responsive: Mobile 常駐、Desktop hover 顯示
- Error Handling: Clipboard API 失敗降級

### 訊息分享功能 (52 tests)
**文件**: `src/__tests__/shareMessages.test.ts` (31) + `desktopShareButton.test.ts` (21)

多則訊息選取與分享，支援 Web Share API。

**Mobile 長按手勢：**
- 500ms touch 進入選取模式（僅 touch events）
- 勾選框顯示、多選、全選、清除
- Web Share API → 剪貼簿 fallback

**Desktop 分享按鈕：**
- 點擊進入選取模式（預選訊息）
- `hidden lg:block opacity-0 lg:group-hover:opacity-100`
- 位置：複製按鈕左側、flex gap 布局

**分享格式：**
```
與 QuizMate AI 老師的討論
──────────────────────────────
👤 用戶：[question]
🤖 AI：[answer]
```

### 錯誤訊息關閉按鈕 (22 tests)
**文件**: `src/__tests__/errorCloseButton.test.ts`

讓用戶可主動關閉錯誤提示。

**測試重點：**
- 功能: `onClick={() => setError(null)}`
- 位置: `absolute top-2 right-2`、內容 `pr-6` 避開
- 樣式: hover 效果、紅色配色、X 圖示
- 支援：message、suggestion、technicalDetails 三層結構

### Overflow 處理 (57 tests)
**文件**: `tableOverflow.test.ts` (33) + `codeBlockOverflow.test.ts` (24)

處理寬表格和長代碼行的橫向滾動。

**表格 Wrapper：**
```typescript
<div className="overflow-x-scroll -mx-3 px-3 my-2" 
     style={{ maxWidth: 'calc(100vw - 4rem)', wordBreak: 'normal' }}>
  <table>...</table>
</div>
```

**Code Block Wrapper：**
```typescript
<div className="overflow-x-auto -mx-3 px-3 my-2" 
     style={{ maxWidth: 'calc(100vw - 4rem)' }}>
  <SyntaxHighlighter>...</SyntaxHighlighter>
</div>
```

**關鍵技術：**
- 負 margin (`-mx-3`) 擴展滾動區域到氣泡邊緣
- Padding (`px-3`) 維持視覺間距一致
- `calc(100vw - 4rem)` 防止 mobile overflow
- Table cells `whiteSpace: nowrap` 自適應寬度

---

## 🚀 測試執行

### 本地開發
```bash
npm test              # 執行所有 926 個單元測試
npm run test:watch    # 監視模式（檔案變更自動重跑）
npm run test -- --coverage  # 查看覆蓋率報告
```

### E2E 測試
```bash
npm run test:e2e      # 執行 Playwright E2E 測試（4 tests）
```

### CI/CD
- 每次 `git push` 自動執行
- GitHub Actions: `.github/workflows/test.yml`
- 測試失敗會阻擋 build

---

## 📊 測試策略

### 單元測試（Vitest + React Testing Library）
- **目標**: 隔離測試函數/組件
- **範圍**: 純邏輯、狀態管理、React 組件整合
- **特點**: 快速（~2秒）、精確、易 debug

### E2E 測試（Playwright）
- **目標**: 完整用戶流程驗證  
- **範圍**: API Key 設定、圖片上傳、連續追問
- **詳見**: `E2E_TESTING.md`

---

## 💡 測試最佳實踐

### 1. 測試命名
```typescript
// ✅ 好：描述行為和預期
it('should forward ref to DOM when isLastUserMessage is true', () => {});

// ❌ 壞：只描述實作
it('test ref', () => {});
```

### 2. 測試隔離
```typescript
// ✅ 每個測試獨立
beforeEach(() => {
  localStorage.clear();
});

// ❌ 測試間共享狀態
let sharedState = {}; // 危險！
```

### 3. Mock 使用
```typescript
// Mock 外部依賴
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(),
}));

// Mock 瀏覽器 API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn() },
});
```

---

## 🎯 覆蓋率分析

### 完全覆蓋 (90%+)
- ✅ `page.tsx` - Gemini SDK 整合、對話管理
- ✅ `db.ts` - IndexedDB CRUD、LRU 清理
- ✅ `ApiKeySetup` - Key 管理、驗證
- ✅ `Settings` - Tab 切換、響應式
- ✅ `PromptSettings` - CRUD、狀態管理
- ✅ `MessageBubble` - Ref forwarding、渲染
- ✅ 所有工具函數

### 部分覆蓋 (40-60%)
- ⚠️ `useSessionStorage` - 部分 hooks 邏輯

### 不需覆蓋
- ⭕ `layout.tsx` - Next.js 配置
- ⭕ `ThemeProvider.tsx` - 簡單包裝

---

## 🔧 測試失敗排查

### 常見問題

**1. Import 路徑錯誤**
```
Error: Failed to resolve import "@/components/..."
```
✅ 檢查 `vitest.config.ts` 路徑別名：`'@': path.resolve(__dirname, './src')`

**2. DOM API 不存在**
```
Error: navigator.clipboard is undefined
```
✅ 在測試中 mock 瀏覽器 API

**3. 非同步 timeout**
```
Error: Timeout - Async callback was not invoked
```
✅ 增加 timeout 或檢查非同步邏輯

**4. localStorage 衝突**
```
Error: Cannot read properties of undefined
```
✅ 使用 `beforeEach(() => localStorage.clear())`

---

## 📈 測試品質指標

- **執行時間**: ~2 秒（優化後）
- **通過率**: 100% (926/926)
- **覆蓋率**: ~90% ✅  
- **維護性**: 模組化設計，每個功能獨立測試檔

---

## 🔗 相關文檔
- [README.md](./README.md) - 專案總覽
- [E2E_TESTING.md](./E2E_TESTING.md) - E2E 測試詳細文檔
- [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) - 覆蓋率報告

---

**最後更新**: 2026-01-02  
**測試總數**: 930 tests (926 unit + 4 E2E)  
**通過率**: 100%  
**覆蓋率**: ~90% ✅
