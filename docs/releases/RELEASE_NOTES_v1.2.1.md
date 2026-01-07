# QuizMate v1.2.1 Release Notes

**發布日期**: 2026 年 1 月 7 日

---

## 🎯 使用者體驗改進版本

這是一個專注於**使用者體驗優化**的小版本更新，修復了三個關鍵的 UX 問題，讓學生在使用時更加順暢。

---

## ✨ 新功能

### 1. 🔧 IME 輸入法完整支援

**問題描述**：
- 使用注音、拼音、日文等輸入法時，按 Enter 鍵選字會誤觸發送訊息
- 導致學生無法正常完成中文輸入，體驗非常糟糕

**解決方案**：
- 新增 `isComposing` state 追蹤輸入法組字狀態
- 使用 `onCompositionStart` / `onCompositionEnd` 事件監聽
- 組字期間（`isComposing === true`）忽略 Enter 鍵按下事件
- 完成選字後（`isComposing === false`）才允許 Enter 送出

**影響範圍**：
- 所有中文、日文、韓文輸入法用戶
- 桌面端（Enter 送出）與行動端（Enter 換行）皆支援

**技術實作**：
- 檔案：`src/components/ChatInput.tsx`
- 核心邏輯：
  ```tsx
  const [isComposing, setIsComposing] = useState(false);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposing) {
        return; // 🚫 組字期間忽略 Enter
      }
      // ✅ 完成選字後才執行送出邏輯
    }
  };
  
  <textarea
    onCompositionStart={() => setIsComposing(true)}
    onCompositionEnd={() => setIsComposing(false)}
  />
  ```

**測試覆蓋** (8 tests)：
- 注音輸入法組字與選字行為
- 日文平假名/片假名輸入
- 中文拼音輸入
- Shift+Enter 換行（組字期間）
- 空白輸入與移動端行為
- IME 邊緣案例

---

### 2. 📜 側邊欄垂直滾動支援

**問題描述**：
- 對話歷史列表超過 30 個時，無法查看底部對話
- 側邊欄使用 `overflow-hidden`，導致內容被截斷

**解決方案**：
- 將側邊欄容器的 CSS 從 `overflow-hidden` 改為 `overflow-y-auto`
- 保持固定高度的 header 和「新對話」按鈕
- 對話列表容器使用 `flex-1` 填滿剩餘空間並支援垂直滾動

**影響範圍**：
- 所有擁有大量對話歷史的用戶（> 10 個對話）
- 桌面端與行動端均受益

**技術實作**：
- 檔案：`src/app/page.tsx`
- 變更：
  ```tsx
  // ❌ Before
  <div className="flex-1 overflow-hidden">
    <SessionList ... />
  </div>
  
  // ✅ After
  <div className="flex-1 overflow-y-auto">
    <SessionList ... />
  </div>
  ```

**測試覆蓋** (4 tests)：
- CSS class 驗證（`overflow-y-auto`）
- 滾動容器結構檢查
- 多個 session 渲染與滾動
- SessionList 組件整合測試

---

### 3. ✏️ 數學公式根號符號渲染修復

**問題描述**：
- 根號符號 `√` 無法正常顯示
- 例如 `$5+\sqrt{5}$` 顯示為純文字 "5+5 5"
- 分數、矩陣等複雜公式也受影響

**根本原因**：
- `rehype-katex` 和 `rehype-sanitize` 插件順序錯誤
- KaTeX 先生成 HTML，然後被 sanitize 過濾掉
- 導致數學公式的特殊 HTML 和 CSS class 被移除

**解決方案**：
- **調整插件順序**：先清理 Markdown（sanitize），再生成數學公式（katex）
- 簡化 `rehype-sanitize` 配置，只保留必要的標籤
- 設定 KaTeX `trust: true`，允許生成完整的 HTML+MathML

**技術實作**：
- 檔案：`src/components/MessageBubble.tsx`
- 關鍵變更：
  ```tsx
  // ❌ Before (錯誤順序)
  const rehypePlugins = [
    rehypeRaw,
    [rehypeKatex, {...}],        // 先生成 KaTeX HTML
    [rehypeSanitize, {...}],     // 再過濾掉 KaTeX HTML ❌
  ];
  
  // ✅ After (正確順序)
  const rehypePlugins = [
    rehypeRaw,
    [rehypeSanitize, {           // 先清理 Markdown ✅
      ...defaultSchema,
      attributes: {
        '*': ['className', 'style'],
      },
      tagNames: [...defaultSchema.tagNames, 'div', 'span', 'annotation', 'semantics'],
    }],
    [rehypeKatex, {              // 再生成數學公式（trusted）✅
      output: 'htmlAndMathml',
      strict: false,
      trust: true,
    }],
  ];
  ```

**影響範圍**：
- 所有包含數學公式的作業題目
- 根號 `√`、分數 `\frac{}`、積分 `\int`、矩陣 `\begin{matrix}`、上下標等

**測試覆蓋** (12 tests)：
- 根號符號渲染（`\sqrt{5}`、`\sqrt[3]{8}`）
- 分數渲染（`\frac{1}{2}`）
- 上下標（`x^2`、`x_1`）
- 積分符號（`\int`、`\sum`）
- 矩陣（`\begin{matrix}`）
- 複雜混合公式
- 插件順序驗證（確保 katex 在 sanitize 之後）
- 真實世界範例（用戶回報的 `$5+\sqrt{5}$`）

---

## 📦 架構更新

### 新增測試檔案
1. **`src/__tests__/imeInput.test.tsx`** (8 tests)
   - IME composition events 測試
   - 注音、拼音、日文輸入法覆蓋

2. **`src/__tests__/mathFormula.test.tsx`** (12 tests)
   - KaTeX 渲染完整性測試
   - 插件順序驗證測試

3. **`src/__tests__/sessionUI.integration.test.tsx`** (新增 4 tests)
   - 側邊欄滾動 CSS 驗證
   - SessionList 整合測試

### 測試統計
- **總測試數**: 1,327 tests (較 v1.2.0 增加 24 tests)
  - Unit tests: 1,222 (+24)
  - Integration tests: 99
  - Regression tests: 2
  - E2E tests: 4
- **測試覆蓋率**: ~92%
- **TypeScript**: ✅ 0 編譯錯誤
- **測試通過率**: ✅ 100% (1,327/1,327)

---

## 📚 文檔更新

### 1. `.github/copilot-instructions.md`
- **Input Behavior** 章節新增 IME 支援說明
  - `onCompositionStart` / `onCompositionEnd` 事件處理
  - `isComposing` state 追蹤組字狀態
  - Enter 鍵行為邏輯（桌面/移動端）

- **Sidebar Scrolling** 章節新增滾動功能說明
  - `overflow-y-auto` CSS 配置
  - `flex-1` 容器結構
  - 30+ sessions 瀏覽能力

- **Markdown Rendering** 章節更新 KaTeX 配置
  - 插件順序說明：`rehype-sanitize → rehype-katex`
  - 配置參數詳解：`output: 'htmlAndMathml'`, `strict: false`, `trust: true`
  - 根號符號修復原因分析

### 2. `README.md`
- 功能列表新增：
  - **IME 輸入法支援**：完整支援注音、拼音、日文等輸入法
  - **KaTeX 數學公式渲染**：完整支援根號、分數、積分、矩陣等數學符號

- 對話紀錄章節更新：
  - **側邊欄滾動支援**：30+ 個對話時支援垂直滾動瀏覽完整歷史

### 3. `TESTS.md`
- 測試總數更新：1,303 → 1,327 tests
- 新增章節：
  - **IME 輸入法測試** (8 tests)
  - **數學公式渲染測試** (12 tests)
  - **側邊欄滾動測試** (4 tests 併入 sessionUI.integration.test.tsx)

---

## 🔧 技術細節

### 修改的檔案
1. **`src/components/ChatInput.tsx`**
   - 新增 IME composition state 管理
   - 修改 Enter 鍵處理邏輯

2. **`src/app/page.tsx`**
   - 側邊欄容器 CSS 從 `overflow-hidden` → `overflow-y-auto`

3. **`src/components/MessageBubble.tsx`**
   - 調整 rehype 插件順序
   - 簡化 rehype-sanitize 配置
   - 優化 KaTeX 配置參數

4. **`.github/copilot-instructions.md`**
   - 更新 IME、滾動、KaTeX 技術文檔

5. **`README.md`**
   - 更新功能列表和使用說明

6. **`TESTS.md`**
   - 更新測試統計和新增測試項目

---

## 🚀 升級指南

### 從 v1.2.0 升級
此版本為**純前端改進**，無需額外設定。

**升級步驟**：
1. Pull 最新代碼：`git pull origin main`
2. 安裝依賴（無新依賴）：`npm install`
3. 運行測試確認：`npm test`
4. 啟動開發伺服器：`npm run dev`

**破壞性變更**：
- ❌ 無破壞性變更
- ✅ 完全向下相容

**使用者影響**：
- 使用 IME 輸入法的學生將立即受益
- 擁有大量對話歷史的用戶可以查看完整列表
- 所有數學公式題目將正確顯示

---

## 🐛 已知問題

目前無已知問題。

---

## 📈 下一步計劃

### v1.3.0 候選功能
- [ ] 對話匯出功能（Markdown / PDF）
- [ ] 圖片標註工具（圈選題目重點）
- [ ] 語音輸入支援
- [ ] 多語言界面（英文、日文）

### 技術債務
- [ ] E2E 測試覆蓋率提升（目前僅 4 tests）
- [ ] 性能監控與優化（Core Web Vitals）
- [ ] 無障礙功能改進（ARIA labels、鍵盤導航）

---

## 🙏 致謝

感謝所有回報問題的用戶：
- **IME 問題回報者**：注音輸入法誤觸發送的問題
- **側邊欄滾動需求者**：對話列表超過 30 個無法查看
- **數學公式渲染問題回報者**：根號符號無法顯示的範例

---

## 📝 完整變更記錄

```
feat: 完整支援 IME 輸入法、側邊欄滾動和數學公式渲染

🔧 IME 輸入法支援
- 修復注音輸入法按 Enter 選字時誤觸發送問題
- 新增 isComposing state 追蹤輸入法組字狀態
- 使用 onCompositionStart/End 事件監聽組字過程
- 組字期間忽略 Enter 鍵，避免誤送出訊息
- 完整支援注音、拼音、日文等需要選字的輸入法
- 測試覆蓋：8 個 IME 行為測試（注音、日文、拼音、邊緣案例）

📜 側邊欄滾動支援
- 修復對話歷史列表超過 30 個時無法查看底部對話問題
- 將側邊欄容器 CSS 從 overflow-hidden 改為 overflow-y-auto
- 保持固定 header 和「新對話」按鈕，對話列表支援垂直滾動
- 測試覆蓋：4 個整合測試（CSS 驗證、滾動容器、SessionList 整合）

✏️ 數學公式渲染修復
- 修復根號符號 √ 無法顯示的問題（顯示為純文字 "5+5 5"）
- 根本原因：rehype-katex 和 rehype-sanitize 插件順序錯誤
- 解決方案：調整順序為 sanitize → katex（先清理 Markdown，再生成數學公式）
- 簡化 rehype-sanitize 配置，信任 KaTeX 輸出（trust: true）
- 完整支援根號、分數、積分、矩陣等數學符號
- 測試覆蓋：12 個 KaTeX 渲染測試（根號、分數、積分、矩陣、插件順序）

📚 文檔更新
- 更新 copilot-instructions.md：IME 事件處理、側邊欄滾動、KaTeX 配置
- 更新 README.md：新增功能說明（IME、滾動、數學公式）
- 更新 TESTS.md：測試總數 1,303 → 1,327（+24 tests）

測試：1,327 個測試全部通過 ✅
```

---

**版本比較**: [v1.2.0...v1.2.1](https://github.com/johnnyisme/quizmate/compare/v1.2.0...v1.2.1)
