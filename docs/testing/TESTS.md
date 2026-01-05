# QuizMate - 測試文檔

本專案目前包含約 **1,222 個測試**（以最近一次完整執行為準），涵蓋前端邏輯、React 組件、資料庫操作、UI 交互、DOM 渲染驗證和工具函數。（分類數量會隨功能演進略有變動）

## 測試框架
- **Vitest 1.6.1**: 單元測試與整合測試框架
- **React Testing Library 16.3.1**: React 組件測試（DOM 渲染、user interaction、ref forwarding）
- **@testing-library/jest-dom 6.9.1**: DOM 斷言（toBeInTheDocument, toHaveClass 等）
- **jsdom 27.4.0**: 瀏覽器環境模擬
- **Playwright 1.57.0**: E2E 測試（完整用戶流程）
- **測試總數**: 約 1,222 tests（最近一次完整執行）
- **整合測試覆蓋率**: 依最新覆蓋率報告為準
- **整體測試覆蓋率**: ~92%

---

## 📋 測試文件總覽

### 整合測試 - DOM 渲染與交互驗證 (95 tests) ⭐ NEW
1. **`src/__tests__/errorHandling.integration.test.tsx`** (19 tests) - 錯誤 UI 展開/收起/滾動
2. **`src/__tests__/scrollFeatures.integration.test.tsx`** (17 tests) - 滾動到問題、智慧按鈕、位置記憶
3. **`src/__tests__/sessionUI.integration.test.tsx`** (22 tests) - 標題編輯、hover 按鈕、時間格式
4. **`src/__tests__/messageInteraction.integration.test.tsx`** (18 tests) - 複製按鈕、分享選取、桌面分享
5. **`src/__tests__/inputAndUI.integration.test.tsx`** (14 tests) - 輸入框自動增長、主題切換、側邊欄動畫

### 核心頁面邏輯 (42 tests)
6. **`src/__tests__/page.test.ts`** - 前端主介面、Gemini API 整合、對話管理

### React 組件測試 (162 tests)
7. **`src/__tests__/messageBubbleRef.test.tsx`** (5 tests) ⭐ NEW - MessageBubble ref forwarding
8. **`src/components/__tests__/ApiKeySetup.test.tsx`** (33 tests) - API Key 管理介面
9. **`src/components/__tests__/Settings.test.tsx`** (41 tests) - Settings 模態視窗與 Tab
10. **`src/components/__tests__/PromptSettings.test.tsx`** (16 tests) - System Prompt 自訂
11. **`src/components/__tests__/PromptSettings.button.test.tsx`** (23 tests) - Prompt 按鈕邏輯
12. **`src/lib/__tests__/useAsyncState.test.ts`** (44 tests) - 非同步狀態管理 hook

### UI/UX 交互測試 (518 tests)
13. **`src/__tests__/copyMessage.test.ts`** (34 tests) - 訊息複製功能
14. **`src/__tests__/shareMessages.test.ts`** (31 tests) - 多則訊息選取與分享
15. **`src/__tests__/desktopShareButton.test.ts`** (21 tests) - 桌面端分享按鈕
16. **`src/__tests__/errorCloseButton.test.ts`** (22 tests) - 錯誤訊息關閉按鈕
17. **`src/__tests__/inputAutoGrow.test.ts`** (21 tests) - 輸入框自動高度
18. **`src/__tests__/scrollButtons.test.ts`** (31 tests) - 快速滾動按鈕
19. **`src/__tests__/smartScrollButtons.test.ts`** (23 tests) - 智慧滾動按鈕可見性
20. **`src/__tests__/scrollToQuestion.test.ts`** (16 tests) - 滾動到問題位置
21. **`src/__tests__/scrollAfterResponse.test.ts`** (23 tests) ⭐ NEW - AI 回應後滾動行為
22. **`src/__tests__/enterKeyBehavior.test.ts`** (125 tests) ⭐ NEW - Enter 鍵換行行為
23. **`src/__tests__/sessionTitleEdit.test.ts`** (24 tests) - 對話標題編輯
24. **`src/__tests__/sessionTimeFormat.test.ts`** (12 tests) - 對話時間格式
25. **`src/__tests__/sessionPersistence.test.ts`** (21 tests) - Session 持久化
26. **`src/__tests__/sessionHoverButtons.test.ts`** (22 tests) - Session hover 按鈕
27. **`src/__tests__/sidebarToggle.test.ts`** (30 tests) - 側邊欄開關
28. **`src/__tests__/sidebarPersistence.test.ts`** (10 tests) - 側邊欄狀態持久化
29. **`src/__tests__/scrollPositionMemory.test.ts`** (15 tests) - 滾動位置記憶
30. **`src/__tests__/cameraFeature.test.ts`** (37 tests) - 攝影機拍照功能

### 資料庫測試 (24 tests)
31. **`src/__tests__/db.test.ts`** (24 tests) - IndexedDB 對話儲存與 LRU

### Markdown 渲染測試 (205 tests)
32. **`src/__tests__/markdownRendering.test.ts`** (55 tests) - Markdown 基礎語法
33. **`src/__tests__/htmlSanitization.test.ts`** (72 tests) - HTML 安全過濾
34. **`src/__tests__/syntaxHighlighting.test.ts`** (78 tests) - 程式碼語法高亮

### Overflow 處理測試 (57 tests)
35. **`src/__tests__/tableOverflow.test.ts`** (33 tests) - 表格橫向滾動
36. **`src/__tests__/codeBlockOverflow.test.ts`** (24 tests) - 代碼區塊橫向滾動

### 圖片驗證測試 (10 tests) ⭐ NEW
37. **`src/__tests__/imageSize.test.tsx`** (10 tests) - 圖片大小限制與錯誤處理
   - 接受小於 10MB 的圖片
   - 拒絕大於 10MB 的圖片並顯示友善錯誤訊息
   - 顯示實際檔案大小（MB，兩位小數）
   - 提供壓縮建議（TinyPNG、Squoosh、調整解析度）
   - 清空 input 以允許重新選擇同一檔案
   - 邊界測試（10MB, 10MB+1 byte）
   - 相機拍照的圖片驗證
   - 錯誤關閉與重試流程

### 錯誤處理測試 (25 tests)
38. **`src/__tests__/errorHandling.test.ts`** (25 tests) - 友善錯誤訊息轉換

### 工具函數測試 (30 tests)
39. **`src/__tests__/utils.test.ts`** (15 tests) - 通用工具函數
40. **`src/__tests__/truncatePromptName.test.ts`** (15 tests) - Prompt 名稱智慧截斷

### 主題測試 (17 tests)
41. **`src/__tests__/theme.test.ts`** (17 tests) - Dark Mode 切換

---

## 📝 重點測試詳解

### ⭐ NEW: AI 回應後滾動行為 (23 tests)
**文件**: `src/__tests__/scrollAfterResponse.test.ts`

修復 AI 回應完成後畫面跳動問題，確保用戶滾動位置保持穩定。

**測試分類：**
- **Padding 管理** (2 tests)：載入時加入 80vh padding，完成後移除
- **Session 切換檢測** (5 tests)：區分真正的 session 切換與同 session 更新
- **滾動恢復邏輯** (2 tests)：只在 session 切換時恢復位置
- **邊緣案例** (3 tests)：快速更新、padding 移除、串流更新
- **AI 回應期間滾動** (2 tests)：允許用戶自然滾動，不強制改變位置
- **requestAnimationFrame 整合** (1 test)：平滑滾動到問題位置

**關鍵邏輯：**
```typescript
// 使用 prevSessionIdRef 檢測真正的 session 切換
const isSessionSwitch = prevSessionIdRef.current !== session.id;

// 只在切換 session 時恢復滾動位置
if (isSessionSwitch) {
  const savedScrollPos = localStorage.getItem(`scroll-pos-${session.id}`);
  if (savedScrollPos && chatContainerRef.current) {
    chatContainerRef.current.scrollTop = parseInt(savedScrollPos, 10);
  }
}
```

### ⭐ NEW: 多圖片上傳功能 (11 tests)
**文件**: `src/__tests__/multiImageUpload.test.tsx`

驗證同一個 chat session 可上傳多張圖片，不會自動建立新對話。

**測試分類：**
- **同 Session 上傳** (2 tests)：上傳多張圖片不重置對話、保留歷史訊息
- **File Input 清除** (1 test)：每次上傳後清空 input value、允許重選同檔案
- **圖片預覽顯示** (2 tests)：
  - 空對話時：只在中央上傳區顯示預覽
  - 有對話時：輸入框上方顯示縮圖預覽（80px 高）
  - 條件渲染：`{imageUrl && displayConversation.length > 0}`
- **圖片狀態管理** (4 tests)：
  - **Settings Modal 保留預覽**：開啟/關閉 Settings 不清除圖片（只是 overlay）
  - **Image Reference Pattern**：送出前保存引用 → 立即清空狀態 → 使用保存的引用
  - 預覽非持久化：頁面重載時清除（不儲存到 localStorage）
  - 切換 session 時清除預覽（`handleSwitchSession` 呼叫 `setImage(null)`）
- **錯誤恢復** (1 test)：API 失敗時恢復圖片到 input、允許重試
- **初始載入標記** (2 tests)：
  - `isInitialLoad.current` 防止頁面重載時錯誤恢復 session 圖片
  - 第一次 session 載入後標記為 false

**關鍵實作：**
```typescript
// 圖片引用保存模式（避免 race condition）
const currentImage = image;
const currentImageUrl = imageUrl;
setImage(null);  // 立即清空，允許下次上傳
setImageUrl("");

// API 使用保存的引用
if (currentImage) {
  const base64 = await fileToBase64(currentImage);
  // ... 送出到 Gemini API
}

// 失敗時恢復
if (error) {
  setImage(currentImage);
  setImageUrl(currentImageUrl);
}
```

**預覽 UI 邏輯：**
- 空對話（length === 0）：無預覽，只顯示中央上傳區
- 有對話（length > 0）：輸入框上方顯示 80px 縮圖
- 非持久化：React state only，不存 localStorage/IndexedDB
- 清除時機：重載、切換 session、送出成功後

### ⭐ NEW: Enter 鍵換行行為 (23 tests)
**文件**: `src/__tests__/enterKeyBehavior.test.ts`

驗證輸入框 Enter 鍵行為改為換行（不再送出訊息），提升多行輸入體驗。

**測試分類：**
- **Enter 鍵處理** (5 tests)：Enter 不阻止預設行為、創建新行、不觸發送出
- **Shift+Enter 行為** (2 tests)：與 Enter 相同（都是換行）
- **Textarea 高度調整** (3 tests)：自動增長、最大高度限制、滾動條
- **送出行為** (4 tests)：只能透過按鈕送出、保留換行、重置高度
- **鍵盤行為** (3 tests)：Enter 不關閉鍵盤、保持開啟、明確 blur 才關閉
- **邊緣案例** (4 tests)：空白 Enter、開頭 Enter、中間 Enter、快速連按
- **Focus 管理** (2 tests)：送出後不 auto-blur、維持 focus
- **載入狀態** (2 tests)：載入時允許換行、阻止按鈕送出

**關鍵變更：**
- 移除 `handleKeyPress` 和 `onKeyPress` handler
- Enter 鍵執行瀏覽器預設行為（換行）
- 送出訊息只能透過點擊送出按鈕
- 移除送出後的 `blur()` 呼叫（鍵盤保持開啟）

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
npm test              # 執行所有 1074 個單元測試
npm run test:watch    # 監視模式（檔案變更自動重跑）
npm run test -- --coverage  # 查看覆蓋率報告
```

### E2E 測試
```bash
npm run test:e2e      # 執行 Playwright E2E 測試（4 tests）

---

### 變更紀錄（2026-01-05）
- 更新統計：以最近一次測試執行結果為準（約 1,222 tests）
- 移除備份測試檔：`src/__tests__/multiImageUpload.test.tsx.backup`
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

- **執行時間**: ~6.5 秒
- **通過率**: 100% (1074/1074)
- **覆蓋率**: ~92% ✅  
- **維護性**: 模組化設計，每個功能獨立測試檔

---

## 🔗 相關文檔
- [README.md](./README.md) - 專案總覽
- [E2E_TESTING.md](./E2E_TESTING.md) - E2E 測試詳細文檔
- [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) - 覆蓋率報告

---

**最後更新**: 2026-01-03  
**測試總數**: 1,078 tests (977 unit + 95 integration + 2 regression + 4 E2E)  
**通過率**: 100%  
**覆蓋率**: ~92% ✅
