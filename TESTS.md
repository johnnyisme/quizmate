# QuizMate - 單元測試文檔

本專案包含 **429 個單元測試**，涵蓋前端邏輯、資料庫操作、UI 組件和工具函數。

## 測試框架
- **Vitest 1.6.1**: 單元測試框架
- **jsdom**: 瀏覽器環境模擬
- **測試總數**: 429 tests
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

**關鍵測試案例：**
```typescript
// 成功模式: loading=true → value="result", loading=false, error=null
// 失敗模式: loading=true → loading=false, error="failed"
// 重試模式: error → error=null, loading=true → success
```

### 6. `src/components/__tests__/Settings.test.tsx` (65 tests)
測試 Settings 組件的 Tab 切換和狀態管理邏輯。

**測試分類：**
- **Tab 狀態**: 初始化、切換、多次切換
- **CSS Classes**: 啟用/停用樣式、藍色高亮、灰色懸停
- **內容渲染**: 三個 tab 內容顯示邏輯、單一顯示
- **Tab Labels**: Prompt 設定、API 金鑰、外觀主題
- **主題切換**: light↔dark 切換、字串儲存
- **Modal Header**: 標題、截斷、關閉按鈕
- **Props 傳遞**: isDark, onClose, isModal
- **邊框布局**: border-bottom, flex 布局, 置中
- **響應式設計**: 手機/桌面 padding, 文字大小, 按鈕位置
- **Tab 驗證**: 有效值檢查、3 個 tab
- **整合場景**: tab 切換+關閉, 主題切換+tab 保持

**關鍵測試案例：**
```typescript
// Tab 切換: prompt → apikey → theme → prompt
// 啟用樣式: "text-blue-600 border-b-2 bg-blue-50"
// 停用樣式: "text-gray-600 hover:text-gray-900"
```

### 7. `src/__tests__/sessionHoverButtons.test.ts` (41 tests)
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

### 8. `src/components/__tests__/PromptSettings.test.tsx`
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
| **總計** | **429** | **✅** | **完整功能覆蓋** |

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

- **執行時間**: ~1.6s (優化後)
- **通過率**: 100% (429/429)
- **覆蓋率**: ~90% (達成目標)
- **覆蓋範圍**: 前端邏輯（Gemini SDK）、UI 組件、工具函數、資料庫（IndexedDB）、狀態管理、Session 管理 UI
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

**最後更新**: 2026-01-01  
**測試總數**: 429 tests  
**通過率**: 100%  
**覆蓋率**: ~90% (達成目標)

