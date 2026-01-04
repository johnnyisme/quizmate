# QuizMate 測試改善計畫 - 執行清單

**版本**: v1.0  
**開始日期**: 2026-01-04  
**目標完成**: 2026-02-14 (6 週)

---

## Phase 1: 診斷與設置 ✅ (已完成)

### Week 1 (2026-01-04 ~ 2026-01-10)

- [x] **Action 1.1**: 安裝 ESLint 依賴陣列檢查器
  - [x] npm install eslint-plugin-react-hooks
  - [x] 更新 eslint.config.mjs
  - 現有警告數: TBD (待執行 lint)

- [ ] **Action 1.2**: 安裝視覺迴歸測試工具
  - [ ] npm install @playwright/test
  - [ ] 建立 Playwright config

- [ ] **Action 1.3**: 建立測試框架文檔
  - [ ] 測試寫法指南
  - [ ] 測試命名規範
  - [ ] 覆蓋目標定義

---

## Phase 2: 核心缺失的測試套件 (進行中)

### Week 2-3 (2026-01-11 ~ 2026-01-24)

#### Action 2.1: useEffect 依賴陣列測試

優先級排序（按 bug 嚴重性）：

- [ ] **Hook 1**: useScrollManagement
  - [ ] Scroll restore (依賴: currentSessionId, chatContainerRef)
  - [ ] Auto-scroll during loading (依賴: isLoading, chatContainerRef)
  - [ ] Scroll button visibility (依賴: displayConversation, chatContainerRef)
  - [ ] User manual scroll detection (依賴: isLoading, chatContainerRef)
  - [ ] Re-enable scroll on AI message (依賴: displayConversation, isLoading)
  - [ ] Save scroll position on unload (依賴: currentSessionId, chatContainerRef)
  - **測試文件**: `src/__tests__/hooks/useScrollManagement.dependencies.test.ts`
  - **預期**: 6 個測試用例，各測試單一依賴的觸發條件

- [ ] **Hook 2**: useSessionManagement
  - [ ] Click-outside detection for title editing
  - **測試文件**: `src/__tests__/hooks/useSessionManagement.dependencies.test.ts`

- [ ] **Hook 3**: useTheme
  - [ ] localStorage persistence
  - **測試文件**: `src/__tests__/hooks/useTheme.dependencies.test.ts`

- [ ] **Hook 4**: useMessageActions
  - [ ] Long-press timer cleanup
  - **測試文件**: `src/__tests__/hooks/useMessageActions.dependencies.test.ts`

- [ ] **Hook 5**: useCamera
  - [ ] Media stream cleanup
  - **測試文件**: `src/__tests__/hooks/useCamera.dependencies.test.ts`

#### Action 2.2: 整合測試套件

- [ ] **Scenario 1**: Header prompt 選擇 → Settings 同步
  - **文件**: `src/__tests__/integration/promptSyncIntegration.test.tsx`
  - **步驟**:
    1. 在 Header 選擇新 prompt
    2. 驗證 useSettingsState 更新
    3. 打開 Settings modal
    4. 驗證 PromptSettings 接收新的 selectedPromptId
    5. 驗證「已使用」標籤指向新 prompt
  - **預期**: 通過此測試應該能抓到像「isDefault 沒有更新」這樣的 bug

- [ ] **Scenario 2**: Session 切換 → 完整清除
  - **文件**: `src/__tests__/integration/sessionSwitchIntegration.test.tsx`
  - **步驟**:
    1. 上傳圖片到 Session 1
    2. 切換到 Session 2
    3. 驗證圖片被清除
    4. 驗證 scroll 位置被復原
    5. 驗證 input 被清空
  - **預期**: 能抓到 state sync 問題

- [ ] **Scenario 3**: Message 發送完整流程
  - **文件**: `src/__tests__/integration/messageSendIntegration.test.tsx`
  - **步驟**:
    1. 輸入問題
    2. 點擊發送
    3. 驗證 scroll 到 user message
    4. 驗證 AI 回應時自動 scroll
    5. 驗證 padding 被正確移除
    6. 驗證最終 scroll 位置正確
  - **預期**: 能抓到像「padding 沒有移除」這樣的 bug

#### Action 2.3: E2E 測試

- [ ] **Test 1**: 完整首次使用流程
  - **文件**: `e2e/complete-flow.spec.ts`
  - **場景**: API Key 設置 → 上傳圖片 → 提問 → AI 回應 → 複製 → 刪除 session

- [ ] **Test 2**: Scroll 行為驗證
  - **文件**: `e2e/scroll-behavior.spec.ts`
  - **場景**: 自動 scroll → 手動 scroll → session 切換 → scroll 復原

- [ ] **Test 3**: Session 持久化
  - **文件**: `e2e/session-persistence.spec.ts`
  - **場景**: 創建 session → 刷新頁面 → 驗證 session 復原

#### Action 2.4: 狀態持久化測試

- [ ] **Test 1**: localStorage 同步
  - **文件**: `src/__tests__/integration/localStorageSyncTest.ts`
  - **驗證**: sidebar-open, theme, selected-model, selected-prompt-id
  
- [ ] **Test 2**: IndexedDB 數據完整性
  - **文件**: `src/__tests__/integration/indexedDBIntegrity.test.ts`
  - **驗證**: 圖片 base64、消息內容、session metadata

---

## Phase 3: 測試工具改進 (待開始)

### Week 3 (2026-01-18 ~ 2026-01-24)

- [ ] **Action 3.1**: 建立測試 helpers
  - [ ] `src/__tests__/helpers/testHooks.ts`
  - [ ] `src/__tests__/helpers/integrationSetup.ts`
  - [ ] `src/__tests__/helpers/renderWithProviders.tsx`

- [ ] **Action 3.2**: 建立 mock 工廠
  - [ ] `src/__tests__/factories/messageFactory.ts`
  - [ ] `src/__tests__/factories/sessionFactory.ts`
  - [ ] `src/__tests__/factories/promptFactory.ts`

- [ ] **Action 3.3**: E2E 基類設置
  - [ ] `e2e/helpers/appPageObject.ts`
  - [ ] `e2e/helpers/testFixtures.ts`

---

## Phase 4: 逐個補充測試 (進行中)

### 優先級 1 - 關鍵路徑 (2026-01-25 ~ 2026-02-07)

我們現在應該重點補充以下測試，因為這些會直接防止過去發生的 bug：

#### Bug 1: useScrollManagement 依賴陣列錯誤
- **根因**: displayConversation 不應該在 auto-scroll useEffect 中
- **測試**: 
```tsx
test('auto-scroll useEffect should NOT trigger when displayConversation changes without isLoading', () => {
  // 當 displayConversation 改變但 isLoading === false 時，auto-scroll 不應執行
})
```
- **狀態**: ⏳ 待補充

#### Bug 2: Prompt 選擇不同步
- **根因**: PromptSettings 的 isDefault 沒有隨著 selectedPromptId 更新
- **測試**:
```tsx
test('PromptSettings should update isDefault when selectedPromptId prop changes', () => {
  // 驗證完整的 Header → Settings 狀態流
})
```
- **狀態**: ⏳ 待補充

#### Bug 3: Message bubble 垂直 scrollbar
- **根因**: CSS overflow 設置不正確
- **測試**:
```tsx
test('message bubble should not show vertical scrollbar', async ({ page }) => {
  // 使用 Playwright visual regression 檢查
})
```
- **狀態**: ⏳ 待補充

### 優先級 2 - 核心功能 (2026-02-08 ~ 2026-02-14)

- [ ] Session 切換時的圖片清除
- [ ] IndexedDB 數據保存/復原
- [ ] API Key 輪替機制
- [ ] Error 恢復邏輯

### 優先級 3 - 邊界情況 (2026-02-15+)

- [ ] Race conditions
- [ ] 網路超時
- [ ] IndexedDB 滿載
- [ ] 記憶體洩漏

---

## 測試覆蓋進度追蹤

### useEffect 依賴陣列覆蓋

| Hook | useEffect 數量 | 已測試 | 進度 |
|------|---|---|---|
| useScrollManagement | 7 | 0 | 0% |
| useSessionManagement | 1 | 0 | 0% |
| useTheme | 1 | 0 | 0% |
| useCamera | 0 | 0 | 0% |
| useMessageActions | 1 | 0 | 0% |
| useGeminiAPI | 1 | 0 | 0% |
| **總計** | **11** | **0** | **0%** |

### 整合測試覆蓋

| 場景 | 已完成 |
|------|------|
| Prompt 選擇同步 | ❌ |
| Session 切換流程 | ❌ |
| Message 發送流程 | ❌ |
| 狀態持久化 | ❌ |
| **總計** | 0/4 |

### E2E 測試覆蓋

| 用例 | 已完成 |
|------|------|
| 完整首次使用 | ❌ |
| Scroll 行為 | ❌ |
| Session 持久化 | ❌ |
| **總計** | 0/3 |

---

## 週報範本

### Week X Report (YYYY-MM-DD)

**完成項目**:
- [ ] Action X.X: 描述

**當週測試新增**:
- [ ] Test name: X 個測試用例

**遇到的問題**:
1. 問題描述
   - 解決方案

**下週計畫**:
- [ ] 下一個 action

**覆蓋度指標**:
- 單元測試: X%
- 整合測試: Y%
- E2E 測試: Z%

---

## 預期成果

**按里程碑**:

**2026-01-24 (Phase 1 結束)**:
- ✅ ESLint 設置完成
- ✅ 依賴陣列問題被標記出來
- ✅ 測試框架文檔完成

**2026-02-07 (Phase 2 完成)**:
- ✅ 所有關鍵路徑都有整合測試
- ✅ 1000+ bug 中的 80% 能被抓到
- ✅ 測試覆蓋度提升到 50%+

**2026-02-14 (Phase 3-4 完成)**:
- ✅ 1000+ bug 中的 95% 能被抓到
- ✅ 測試覆蓋度達到 70%+
- ✅ 完整的多層次測試金字塔

---

## 如何驗證改善成效

1. **ESLint 檢查**:
   ```bash
   npm run lint
   ```
   應該看到依賴陣列的警告被正確報告

2. **測試運行**:
   ```bash
   npm run test
   ```
   新的整合測試應該發現潛在的 bug

3. **E2E 運行**:
   ```bash
   npm run test:e2e
   ```
   完整的用戶流程應該被驗證

4. **覆蓋度報告**:
   ```bash
   npm run test:coverage
   ```
   覆蓋度指標應該提升

---

## 相關文檔

- [測試失效分析完整版](TEST_FAILURE_ANALYSIS.md)
- [已應用修復清單](FIXES_APPLIED.md)
- [規格合規性審計](SPEC_COMPLIANCE_AUDIT.md)
