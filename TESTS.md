# QuizMate - 單元測試文檔

本專案包含 **839 個單元測試**，涵蓋前端邏輯、資料庫操作、UI 組件和工具函數。

## 測試框架
- **Vitest 1.6.1**: 單元測試框架
- **jsdom**: 瀏覽器環境模擬
- **測試總數**: 839 tests
- **測試覆蓋率**: ~90% (目標達成)

## 測試文件概覽

### 1. `src/__tests__/truncatePromptName.test.ts`
Test suite for the smart prompt name truncation function added to `page.tsx`.

**測試分類：**
- **Chinese characters**: Names with Chinese characters truncate to 4 characters with ellipsis
- **English characters**: Pure English names truncate to 12 characters  
- **Mixed content**: Any name with Chinese characters uses the 4-character limit
- **Edge cases**: Empty strings, exact length boundaries, special characters, spaces
- **Real-world examples**: Chinese tutor names, English prompt names, product names

**關鍵測試案例：**
```typescript
// Chinese: "高中老師123456" → "高中..." (4 chars, ignores numbers)
// English: "EnglishTeacher" → "EnglishTeac..." (12 chars)
// Mixed: "中文English" → "中文..." (has Chinese, use 4-char limit)
```

### 2. `src/__tests__/errorHandling.test.ts` (25 tests)
測試錯誤處理功能的 `getFriendlyErrorMessage` 函數。

**測試分類：**
- **HTTP 狀態碼**: 429, 403, 401, 400, 503, 500
- **網路錯誤**: network, fetch 失敗
- **模型錯誤**: model not found
- **通用錯誤**: 未預期的錯誤情況
- **大小寫不敏感**: 錯誤訊息識別不區分大小寫
- **返回值結構**: message 和 suggestion 欄位驗證

**關鍵測試案例：**
```typescript
// 429 配額用完 → 提供 4 種建議（換 agent、新 Key、等待、付費）
// 403 權限不足 → 引導啟用 API、檢查限制
// Network 錯誤 → 檢查網路連線
```

### 2.5. `src/__tests__/copyMessage.test.ts` (78 tests)
測試訊息複製功能的完整實現。

**測試分類：**
- **Copy Logic (5 tests)**: 基本複製、長文字、特殊字元、換行、Markdown
- **State Management (3 tests)**: index 追蹤、清除狀態、多次操作
- **Visual Feedback (2 tests)**: 2秒 timeout、快速連續複製
- **Error Handling (2 tests)**: API 失敗、undefined API
- **Edge Cases (4 tests)**: 空字串、空白、負數 index、超大 index
- **Button State Logic (3 tests)**: 未複製顯示圖示、已複製顯示勾勾、其他訊息顯示圖示
- **Message Types (3 tests)**: 用戶訊息、AI 回覆、程式碼區塊
- **Integration (2 tests)**: 完整流程、不同訊息類型
- **Button Position and Style (4 tests)**: absolute 定位、圓形樣式、背景陰影、邊框
- **Responsive Behavior (3 tests)**: Mobile 常駐、Desktop hover、組合規則
- **Icon Display (3 tests)**: 僅圖示無文字、一致尺寸、複製時變色

**關鍵測試案例：**
```typescript
// 位置: 'absolute -bottom-2 -right-2' (泡泡外右下角)
// 樣式: 'rounded-full' (圓形按鈕)
// Mobile: 'opacity-100' (常駐顯示)
// Desktop: 'lg:opacity-0 lg:group-hover:opacity-100' (hover 顯示)
// 圖示: 'w-4 h-4' (固定尺寸)
// 複製顏色: 'text-green-500 dark:text-green-400' (綠色勾勾)
```

### 2.6. `src/__tests__/desktopShareButton.test.ts` (21 tests)
測試桌面端分享按鈕功能的完整實現。

**測試分類：**
- **Enter Share Mode (3 tests)**: 進入選取模式、預選訊息、允許多選
- **Button Visibility (4 tests)**: 桌面顯示/手機隱藏、hover 顯示、選取模式隱藏、正常模式顯示
- **Button Position (3 tests)**: 複製按鈕左側、泡泡右下角、flex gap 布局
- **Button Styling (4 tests)**: 圓形樣式、陰影邊框、padding、transition 動畫
- **Icon Display (3 tests)**: 分享圖示（連接節點）、一致尺寸、hover 變色
- **Tooltip (1 test)**: 提示文字「選取訊息以分享」
- **Mobile vs Desktop (3 tests)**: 移動端 touch 長按、桌面端無 mouse 長按、桌面用分享按鈕

**關鍵測試案例：**
```typescript
// 進入模式: enterShareMode(2) → isSelectMode=true, selectedMessages=[2]
// 可見性: 'hidden lg:block' (僅桌面), 'opacity-0 lg:group-hover:opacity-100' (hover)
// 位置: 'absolute -bottom-2 -right-2', 按鈕順序 ['share', 'copy']
// 樣式: 'rounded-full', 'shadow-md hover:shadow-lg', 'p-1.5'
// 圖示: 分享節點 SVG path, 'w-4 h-4', 'hover:text-gray-800'
// UX 差異: Mobile=touch events, Desktop=share button (no mouse long-press)
```

### 2.7. `src/__tests__/errorCloseButton.test.ts` (22 tests)
測試錯誤訊息關閉按鈕功能。

**測試分類：**
- **Button Functionality (2 tests)**: 點擊關閉、清除錯誤狀態
- **Button Position (3 tests)**: 右上角定位、relative 容器、內容避開 padding
- **Button Styling (5 tests)**: hover 效果、紅色配色、transition、padding、圓角
- **Icon Display (3 tests)**: X 圖示、一致尺寸、stroke 樣式
- **Tooltip (1 test)**: 提示文字「關閉」
- **Error Container (3 tests)**: 錯誤結構完整、錯誤圖示、展開功能不受影響
- **User Interaction (2 tests)**: 不影響展開狀態、支援所有錯誤類型
- **Accessibility (3 tests)**: hover 視覺反饋、對比度、螢幕閱讀器

**關鍵測試案例：**
```typescript
// 功能: onClick={() => setError(null)}
// 位置: 'absolute top-2 right-2', 容器 'relative', 內容 'pr-6'
// 樣式: 'hover:bg-red-100 dark:hover:bg-red-800/50', 'rounded', 'p-1'
// 顏色: 'text-red-600 dark:text-red-400'
// 圖示: X icon 'M6 18L18 6M6 6l12 12', 'w-4 h-4'
// 錯誤類型: 支援 message, suggestion, technicalDetails 三層結構
// 無障礙: title="關閉", 足夠對比度, hover 反饋
```

### 2.8. `src/__tests__/tableOverflow.test.ts` (53 tests)
測試 Markdown 表格橫向滾動功能的完整實現。

**測試分類：**
- **Table Wrapper Component (3 tests)**: 滾動容器、負 margin、padding 間距
- **Prose Container (3 tests)**: 備援 overflow-x-auto、max-w-none、dark mode
- **Scroll Behavior (3 tests)**: 橫向滾動、不影響縱向、自動隱藏滾動條
- **Margin and Padding Strategy (2 tests)**: 滾動區域計算、延伸到氣泡邊緣
- **Component Integration (3 tests)**: 僅包裝 table、保留 children、傳遞 props
- **Edge Cases (3 tests)**: 空表格、嵌套表格、超寬表格
- **Accessibility (2 tests)**: 鍵盤導航、視覺滾動指示器
- **Cross-browser Compatibility (2 tests)**: 標準 CSS 屬性、觸控滾動
- **Performance (2 tests)**: 無 layout reflow、GPU 加速

**關鍵測試案例：**
```typescript
// Wrapper: 'overflow-x-auto -mx-3 px-3'
// 負 margin: -mx-3 = -12px (每側) → 擴展滾動區域
// Padding: px-3 = 12px → 保持視覺間距
// 淨效果: marginOffset(-12) + paddingOffset(12) = 0 (滾動區域延伸到氣泡邊緣)
// 組件: table({ node, children, ...props }) → <div className="..."><table {...props}>{children}</table></div>
// 相容性: 標準 CSS 'overflow-x: auto', 支援觸控滾動
// 效能: 僅在溢出時啟動, GPU 加速
```

### 3. `src/__tests__/inputAutoGrow.test.ts` (21 tests)
測試智慧輸入框自動增長功能的邏輯計算。

**測試分類：**
- **高度計算**: 單行/雙行/三行高度正確性
- **行高一致性**: lineHeight 22px, maxHeight 66px
- **Focus/Blur 行為**: 聚焦展開、失焦縮回
- **按鈕可見性**: inputFocused 狀態控制 w-0/opacity-0
- **Enter 鍵行為**: Enter 送出 vs Shift+Enter 換行
- **尺寸限制**: minHeight 36px, maxHeight 66px
- **間距設定**: Mobile gap-1.5 vs Desktop gap-2

**關鍵測試案例：**
```typescript
// 單行: scrollHeight 30px → 30px (≤ maxHeight)
// 三行: scrollHeight 66px → 66px (= maxHeight)
// 超過: scrollHeight 100px → 66px (cap at max)
// Focus: inputFocused=true → buttons w-0/opacity-0
```

### 4. `src/components/__tests__/ApiKeySetup.test.tsx` (50 tests)
測試 ApiKeySetup 組件的業務邏輯。

**測試分類：**
- **Key Parsing**: 單一金鑰、多金鑰、逗號分隔、空白處理
- **Key Management**: 新增、刪除、編輯、順序保持
- **編輯驗證**: 空值拒絕、空白拒絕、有效值接受
- **LocalStorage**: JSON 序列化/反序列化、錯誤處理
- **錯誤訊息**: 空金鑰錯誤、編輯錯誤、清除錯誤
- **Key 顯示**: 遮罩邏輯（顯示前8後4字元）
- **狀態管理**: 編輯狀態、錯誤清除、輸入清除
- **邊界條件**: 長金鑰、特殊字元、Unicode、空陣列

**關鍵測試案例：**
```typescript
// 多金鑰解析: "key1, key2, key3" → ["key1", "key2", "key3"]
// 刪除中間金鑰: [0,1,2] delete(1) → [0,2]
// 金鑰遮罩: "AIzaSyTest123456789" → "AIzaSyTe...6789"
```

### 5. `src/lib/__tests__/useAsyncState.test.ts` (60 tests)
測試 useAsyncState hook 的狀態管理邏輯。

**測試分類：**
- **初始狀態**: 各種類型初始值（string, number, boolean, object, array, null）
- **值更新**: 單一更新、null 互轉、物件/陣列更新
- **Loading 狀態**: 初始值、設定、切換
- **Error 狀態**: 初始值、設定、清除、更新
- **Reset 邏輯**: 重置值、重置 loading、重置 error、批次重置
- **非同步模式**: 成功模式、失敗模式、重試模式
- **狀態組合**: loading+error、value+error、狀態衝突
- **泛型支援**: string, number, boolean, object, array, union 類型
- **邊界條件**: undefined, 空字串, zero, false, 空陣列/物件

### 6. `src/__tests__/sessionTimeFormat.test.ts` (12 tests)
測試 Session 更新時間的顯示格式邏輯。

**測試分類：**
- **格式驗證**: 年/月/日 時:分:秒 完整顯示
- **24 小時制**: 不顯示 AM/PM，正確顯示 00-23 小時
- **補零邏輯**: 單位數月日時分秒自動補零（2-digit）
- **特殊時間**: 午夜 00:00:00、一天結束 23:59:59
- **新舊格式對比**: toLocaleDateString vs toLocaleString
- **邊界情況**: 閏年日期、時區一致性
- **更新檢測**: Session 修改後時間戳變化
- **顯示長度**: 格式化字串長度限制與一致性

**關鍵測試案例：**
```typescript
// 完整格式: 2026/01/01 14:30:45
// 補零: 2026/01/05 08:09:07
// 午夜: 2026/12/31 00:00:00（不顯示 12）
// 傍晚: 2026/12/31 23:59:59（不顯示 11 PM）
```

### 7. `src/__tests__/sessionPersistence.test.ts` (51 tests)
測試頁面 reload 後恢復上次對話的功能（localStorage session ID 持久化）。

**測試分類：**
- **localStorage 操作**: 儲存、讀取、刪除 session ID
- **Session ID 格式**: UUID、timestamp、特殊字元驗證
- **狀態管理**: 切換 session、覆寫、新對話清除
- **初始化行為**: 有/無既有 session 的啟動邏輯
- **Session 生命週期**: 建立儲存、切換更新、刪除清除
- **並行操作**: 快速切換、連續儲存刪除
- **邊界條件**: 空字串、超長 ID、多鍵值共存
- **隔離性**: 刪除 session ID 不影響其他 localStorage 鍵值

**關鍵測試案例：**
```typescript
// 儲存: localStorage.setItem('current-session-id', 'session-123')
// 讀取: localStorage.getItem('current-session-id') → 'session-123'
// 切換: 'session-1' → 'session-2' (覆寫)
// 新對話: localStorage.removeItem('current-session-id')
// 初始化: 有 ID → 恢復對話 / 無 ID → 空白頁
// 隔離: 刪除 current-session-id，保留 theme, api-keys
```

### 8. `src/__tests__/copyMessage.test.ts` (60 tests)
測試訊息複製功能的邏輯與用戶體驗。

**測試分類：**
- **複製邏輯**: 基本複製、長文字、特殊字元、換行、Markdown
- **狀態管理**: 追蹤複製索引、清除狀態、多次操作
- **視覺反饋**: 2 秒自動清除、快速連續複製
- **錯誤處理**: clipboard API 失敗、API 不存在
- **邊界條件**: 空字串、純空白、負索引、超大索引
- **按鈕狀態**: 顯示複製/打勾圖示的邏輯判斷
- **訊息類型**: 用戶訊息、AI 回覆、程式碼區塊
- **整合場景**: 完整複製流程、不同角色訊息

**關鍵測試案例：**
```typescript
// 複製長文字: 'a'.repeat(1000)
// 複製特殊字元: '測試 🎉 !@#$%'
// 複製 Markdown: '# Heading\n\n**Bold**\n\n```js\ncode\n```'
// 狀態追蹤: copiedIndex = 5 → null (2秒後)
// 圖示邏輯: copiedIndex === currentIndex ? checkmark : copy
// 錯誤處理: Promise.reject → catch error
```

### 9. `src/__tests__/sessionHoverButtons.test.ts` (41 tests)
測試 Session 列表 hover 顯示按鈕功能。

**測試分類：**
- **按鈕可見性**: 移動端永遠顯示、桌面端 hover 顯示
- **Group Hover**: 父容器 group class 與子元素 group-hover 響應
- **按鈕狀態**: 編輯模式顯示儲存按鈕、正常模式顯示編輯/刪除按鈕
- **響應式行為**: lg breakpoint (1024px) 斷點邏輯
- **邊界情況**: 編輯不同 session、null sessionId
- **無障礙性**: 過渡動畫、按鈕標題、觸控目標尺寸
- **視覺一致性**: 統一樣式、hover 狀態、深色模式支援

**關鍵測試案例：**
```typescript
// Mobile: opacity-100 (永遠顯示)
// Desktop: opacity-100 lg:opacity-0 lg:group-hover:opacity-100
// Editing: opacity-100 (永遠顯示)

// Group hover 機制
// Parent: group class
// Child: group-hover:opacity-100
```

### 9. `src/components/__tests__/PromptSettings.test.tsx`
Logic tests for PromptSettings component changes.

**測試功能：**

#### Save Button State
- ✅ Disabled initially when no changes
- ✅ Enabled when prompt name is changed
- ✅ Enabled when prompt content is changed
- ✅ Ignores `isNew` property in change detection

#### "Use" Button (Set Default)
- ✅ Does NOT affect save button disabled state
- ✅ Calls `onPromptsUpdated` immediately
- ✅ Prevents setting unsaved prompts as default

#### Add New Prompt
- ✅ Creates new prompt with empty name (not "新 Prompt")
- ✅ Disables add button when max 5 custom prompts reached
- ✅ Disables add button when unsaved prompt exists

#### Save Validation
- ✅ Shows error if prompt name is empty
- ✅ Shows error if prompt content is empty
- ✅ Trims whitespace in validation
- ✅ Scrolls to error message on validation failure

#### Prompt Management
- ✅ Correctly counts custom vs default prompts
- ✅ Falls back to default when custom is deleted
- ✅ Prevents deletion of default prompt

#### Modal Behavior
- ✅ Shows close button in modal mode
- ✅ Shows cancel button in modal mode
- ✅ Hides cancel button in non-modal mode

## How to Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run specific test file
npx vitest run src/__tests__/truncatePromptName.test.ts
npx vitest run src/components/__tests__/PromptSettings.test.tsx
```

## 測試覆蓋率總覽

| 測試文件 | 測試數量 | 狀態 | 涵蓋功能 |
|---------|---------|------|---------|
| `truncatePromptName.test.ts` | 15 | ✅ | Prompt 名稱智慧截斷 |
| `errorHandling.test.ts` | 25 | ✅ | 錯誤訊息友善化 |
| `inputAutoGrow.test.ts` | 21 | ✅ | 輸入框自動增長邏輯 |
| `ApiKeySetup.test.tsx` | 50 | ✅ | API Key 管理邏輯 |
| `useAsyncState.test.ts` | 60 | ✅ | 非同步狀態管理 |
| `Settings.test.tsx` | 65 | ✅ | Settings Tab 切換 |
| `PromptSettings.test.tsx` | 16 | ✅ | Prompt 設定組件邏輯 |
| `PromptSettings.button.test.tsx` | 17 | ✅ | Prompt 按鈕狀態管理 |
| `page.test.ts` | 43 | ✅ | 主頁面前端邏輯（Gemini SDK） |
| `theme.test.ts` | 17 | ✅ | Dark Mode 主題切換 |
| `db.test.ts` | 25 | ✅ | IndexedDB 操作與 LRU |
| `utils.test.ts` | 16 | ✅ | API Key 輪替與邊界條件 |
| `sessionHoverButtons.test.ts` | 41 | ✅ | Session 列表 Hover 按鈕 |
| `sessionTitleEdit.test.ts` | 24 | ✅ | Session 標題編輯與驗證 |
| `sessionTimeFormat.test.ts` | 12 | ✅ | Session 時間格式顯示 |
| `scrollToQuestion.test.ts` | 16 | ✅ | Gemini-like 滾動到問題功能 |
| `markdownRendering.test.ts` | 55 | ✅ | Markdown 渲染（GFM、數學公式） |
| `htmlSanitization.test.ts` | 72 | ✅ | HTML 安全過濾 |
| `syntaxHighlighting.test.ts` | 78 | ✅ | 程式碼語法高亮 |
| `cameraFeature.test.ts` | 23 | ✅ | 相機拍照功能（平台偵測） |
| `sidebarToggle.test.ts` | 9 | ✅ | 側邊欄響應式切換 |
| `scrollButtons.test.ts` | 6 | ✅ | 滾動按鈕邏輯 |
| `sessionPersistence.test.ts` | 51 | ✅ | Session 持久化（reload 恢復） |
| `copyMessage.test.ts` | 60 | ✅ | 訊息複製功能 |
| **總計** | **817** | **✅** | **完整功能覆蓋** |

## 測試分類

### 前端邏輯 (60 tests)
- `page.test.ts`: 主頁面狀態管理、Gemini SDK 整合、對話流程
- `theme.test.ts`: 主題切換、localStorage 持久化

### UI 組件 (148+ tests)
- `PromptSettings.test.tsx`: Prompt CRUD、驗證、狀態管理
- `PromptSettings.button.test.tsx`: 按鈕狀態、禁用邏輯
- `ApiKeySetup.test.tsx`: API Key 管理、編輯、驗證
- `Settings.test.tsx`: Tab 切換、響應式設計、Props 傳遞

### 工具函數 (65 tests)
- `truncatePromptName.test.ts`: 中英文截斷邏輯
- `errorHandling.test.ts`: 錯誤訊息轉換
- `inputAutoGrow.test.ts`: 輸入框高度計算
- `utils.test.ts`: API Key 輪替邏輯

### 狀態管理 (60+ tests)
- `useAsyncState.test.ts`: 非同步狀態、loading、error 管理

### 資料庫 (25 tests)
- `db.test.ts`: IndexedDB CRUD、LRU 清理（MAX_SESSIONS=10）、session 管理

## 如何執行測試

```bash
# 執行全部測試
npm test

# Watch 模式（自動重新執行）
npm run test:watch

# 執行特定測試文件
npx vitest run src/__tests__/errorHandling.test.ts
npx vitest run src/__tests__/inputAutoGrow.test.ts

# 查看測試覆蓋率
npm run test -- --coverage
```

## 測試設計原則

1. **邏輯優先**: 專注於業務邏輯和狀態管理，而非 UI 渲染細節
2. **輕量化**: 使用純函數測試，避免過度依賴 React Testing Library
3. **真實場景**: 測試案例來自實際使用情境和邊界條件
4. **快速執行**: 所有測試應在 2 秒內完成（當前 < 1.5s）
5. **可維護性**: 清晰的測試名稱和分組，易於理解和擴展

### 最新測試功能 (v2.0)

#### 智慧錯誤處理
- ✅ 兩層展開設計測試
- ✅ 7 種常見錯誤識別
- ✅ 中文友善訊息轉換
- ✅ 自動滾動行為驗證

#### 智慧輸入框
- ✅ 1-3 行自動增長邏輯
- ✅ 按鈕智慧收起動畫
- ✅ Focus/Blur 高度管理
- ✅ Enter/Shift+Enter 行為
- ✅ Mobile 優化尺寸計算

#### Session 標題編輯 (新增)
- ✅ 點擊外部取消編輯
- ✅ Enter 保存、Escape 取消
- ✅ 圓形緊湊按鈕設計
- ✅ 響應式佈局（sidebar w-72）
- ✅ min-w-0 input 自適應
- ✅ 24+ 測試案例覆蓋所有互動

#### Session 時間顯示 (新增)
- ✅ 完整時間格式（年月日時分秒）
- ✅ 24 小時制顯示
- ✅ 自動補零（2-digit）
- ✅ 時間戳更新追蹤
- ✅ 12+ 測試案例驗證格式一致性

#### API Key 管理 (新增)
- ✅ 多金鑰解析與驗證
- ✅ 增刪改操作邏輯
- ✅ LocalStorage 持久化
- ✅ 金鑰遮罩顯示
- ✅ 錯誤訊息處理
- ✅ 50+ 測試案例覆蓋所有邊界條件

#### 非同步狀態管理 (新增)
- ✅ 泛型類型支援
- ✅ Loading/Error 狀態管理
- ✅ Reset 功能
- ✅ 非同步操作模式（成功/失敗/重試）
- ✅ 60+ 測試案例涵蓋所有類型和邊界

#### Settings Tab 系統 (新增)
- ✅ Tab 切換邏輯
- ✅ 響應式設計驗證
- ✅ CSS Classes 條件渲染
- ✅ Props 傳遞驗證
- ✅ 主題切換整合
- ✅ 65+ 測試案例完整覆蓋

## 測試品質指標

- **執行時間**: ~1.7s (優化後)
- **通過率**: 100% (817/817)
- **覆蓋率**: ~90% (達成目標)
- **覆蓋範圍**: 前端邏輯（Gemini SDK）、UI 組件、工具函數、資料庫（IndexedDB）、狀態管理、Session 管理 UI、訊息複製功能
- **維護性**: 模組化設計，每個功能獨立測試文件，反映純前端架構

## 覆蓋率詳細分析

### 完全覆蓋 (90%+)
- ✅ ApiKeySetup: Key 管理、驗證、編輯邏輯
- ✅ useAsyncState: 狀態管理、非同步模式
- ✅ Settings: Tab 切換、響應式設計
- ✅ PromptSettings: CRUD、驗證
- ✅ page.tsx: 核心業務邏輯（Gemini SDK 直接調用、API Key 輪替）
- ✅ db.ts: 完整 CRUD 操作、LRU 清理（MAX_SESSIONS=10）
- ✅ useTheme: 主題切換邏輯
- ✅ 所有工具函數（含 API Key 輪替邏輯）

### 部分覆蓋 (40-60%)
- ⚠️ useSessionStorage: 部分 hooks 邏輯未覆蓋（React hooks 測試較複雜）

### 不需覆蓋
- ⭕ layout.tsx: Next.js 配置文件
- ⭕ ThemeProvider.tsx: 簡單的 useEffect 包裝

## 實作細節

### 錯誤處理測試
- 測試所有 HTTP 狀態碼（429, 403, 401, 400, 503, 500）
- 驗證大小寫不敏感的錯誤識別
- 確保返回值包含 `message` 和 `suggestion` 欄位
- 測試 Network 和 Model 特殊錯誤情況

### 輸入框測試
- 數學計算驗證：22px * 3 = 66px
- 狀態邏輯測試：`inputFocused ? 0 : 9`
- 約束條件檢查：minHeight ≤ height ≤ maxHeight
- 按鈕可見性：w-0/opacity-0 當 focused

### Prompt 管理測試
- 新增/編輯/刪除/設為預設完整流程
- 驗證邏輯：空名稱、空內容檢查
- 狀態管理：hasChanges 檢測、按鈕禁用
- 邊界條件：最多 5 組、防呆邏輯

### API Key 管理測試 (新增)
- **解析邏輯**: 逗號分隔、空白修剪、空值過濾
- **管理操作**: 新增批次、刪除指定、更新索引
- **驗證規則**: 空值拒絕、字串長度檢查
- **遮罩顯示**: `slice(0,8) + "..." + slice(-4)`
- **LocalStorage**: JSON 序列化錯誤處理
- **邊界測試**: 長金鑰(100字元)、特殊字元、Unicode

### 非同步狀態測試 (新增)
- **泛型支援**: string, number, boolean, object, array, union
- **狀態轉換**: value, loading, error 獨立管理
- **非同步模式**:
  - 成功: `loading=true → value+success, loading=false`
  - 失敗: `loading=true → error, loading=false`
  - 重試: `error → error=null, loading=true → success`
- **Reset 邏輯**: 批次重置所有狀態到初始值
- **邊界條件**: undefined, 空字串, zero, false, 空容器

### Settings 測試 (新增)
- **Tab 切換**: 狀態管理、單一顯示邏輯
- **CSS 條件**: 啟用(藍色)/停用(灰色) 樣式切換
- **響應式**: `p-4 sm:p-6`, `text-xl sm:text-2xl`
- **Props 流**: isDark, onClose, isModal 正確傳遞
- **整合測試**: tab切換+主題切換、tab切換+關閉

## 持續改進

- [x] 提升測試覆蓋率到 90%+ ✅
- [x] API Key 管理測試 (50 tests) ✅
- [x] 非同步狀態管理測試 (60 tests) ✅
- [x] Settings Tab 系統測試 (65 tests) ✅
- [ ] useSessionStorage hooks 測試（React Testing Library）
- [ ] 增加 E2E 測試（Playwright/Cypress）
- [ ] 視覺回歸測試
- [ ] 性能基準測試

---

**最後更新**: 2026-01-02  
**測試總數**: 839 tests  
**通過率**: 100%  
**覆蓋率**: ~90% (達成目標)

