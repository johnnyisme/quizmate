# QuizMate

![E2E Tests](https://github.com/johnnyisme/quizmate/actions/workflows/e2e-tests.yml/badge.svg)

一個針對學生拍題互動解題的 Next.js + Gemini **純前端**專案。支援：
- 上傳或拍攝題目圖片，維持圖片上下文，連續追問同張圖片的多個問題
- **即時攝影機**：桌面版開啟即時攝影機預覽，行動版使用原生相機
- 文字/圖片任一即可送出
- **完整 Markdown 支援**：標題、粗體、斜體、列表、程式碼區塊、表格、引用等
- **程式碼語法高亮**：支援多種程式語言，深色/淺色主題自動切換
- KaTeX 數學公式渲染
- **IndexedDB 對話紀錄**：自動儲存對話到瀏覽器本機，可隨時切換歷史對話（最多 30 個，圖片限制 10MB）
- **對話狀態持久化**：頁面重新載入後自動恢復上次的對話
- **訊息複製功能**：每個問題或回答都可一鍵複製，方便保存或分享內容
- **訊息分享功能**：長按訊息進入選取模式，可選擇多則訊息分享到 LINE、Messenger、WhatsApp 等 App
- **Dark Mode 深色模式**：支援淺色/深色主題切換，自動記憶偏好設定
- **多模型選擇**：Gemini 3 Flash、Gemini 2.5 Flash、Gemini 2.5 Pro
- **推理深度控制**：Gemini 3 Flash 支援快速/深度兩種推理模式
- **API Key 管理**：瀏覽器端 CRUD 管理，支援多把 Key 輪替
- **系統 Prompt 自訂**：內建預設老師 Prompt，支援新增最多 5 組自訂 Prompt，靈活切換
- 首則系統提示：用條列、繁體中文詳細解題

## 環境需求
- Node.js 18+（Next.js App Router）
- Google Gemini API Key（可多把）

## 快速開始（本地）
```bash
npm install
npm run dev
# 打開 http://localhost:3000
# 首次使用：點擊右上角設定圖示，輸入 Gemini API Key
```

### API Key 設定
- **無需 `.env.local`**：所有 API Key 都在瀏覽器端管理
- 點擊右上角設定圖示 → 輸入 API Key → 儲存到 localStorage
- 支援多把 Key（逗號分隔），自動輪替避免配額限制
- 可隨時編輯、刪除已儲存的 Key

## 部署（Vercel / GitHub Pages）
1) 建立 GitHub 倉庫並推送程式碼
2) 連結到 Vercel 或任何靜態託管平台
3) **無需設定環境變數**（純前端架構）
4) 使用者首次訪問時自行輸入 API Key

## 使用方式
1) **設定 API Key**：點擊右上角設定圖示，開啟 Settings → API 金鑰 tab，輸入 Gemini API Key
2) **自訂 System Prompt**：
   - 點擊右上角設定圖示，開啟 Settings → Prompt 設定 tab
   - 內建「QuizMate」預設老師 Prompt
   - 支援新增最多 5 組自訂 Prompt（點擊「新增」按鈕）
   - 編輯完後點「儲存」，使用按鈕可切換 Prompt（已使用的會呈現禁用狀態）
3) **選擇模型**：從下拉選單選擇 AI 模型
   - Gemini 3 Flash（最新，支援推理深度控制）
   - Gemini 2.5 Flash（快速平衡）
   - Gemini 2.5 Pro（高品質）
4) **上傳題目**：
   - 點擊上傳按鈕：從相簿選擇或拖曳圖片
   - 點擊攝影機按鈕：
     * 桌面：開啟即時攝影機預覽，拍照
     * 行動：開啟原生相機介面
5) **連續追問**：AI 回答後可繼續追問同張圖片的其他問題
6) **推理控制**（Gemini 3 限定）：
   - 快速：不使用深度推理，回答更快
   - 深度：啟用完整推理過程，回答更詳細
7) **對話紀錄**：
   - 所有對話自動儲存到瀏覽器 IndexedDB
   - 點擊左上角選單圖示開啟側邊欄，查看歷史對話
   - 最多保留 30 個對話，超過會自動刪除最舊的（LRU 策略）
   - **頁面重載恢復**：重新整理頁面後自動載入上次開啟的對話，無需重新選擇
   - **編輯標題**：點擊對話旁的編輯圖示 ✏️ 可重新命名（最多 30 字元）
     - 點擊打勾 ✓ 或按 `Enter` 儲存
     - 按 `Escape` 或點擊外部（編輯框外任何地方）取消
     - 桌面端：編輯/刪除按鈕滑鼠懸停才顯示，保持介面簡潔
     - 移動端：按鈕始終顯示，方便觸控操作
   - **時間顯示**：顯示完整更新時間（精確到秒，24 小時制）
8) **Dark Mode**：點擊右上角設定圖示 → Settings → 外觀主題 tab 切換淺色/深色主題
9) **分享對話**：
   - 長按任一訊息（500ms）進入選取模式
   - 選取一則或多則要分享的訊息（勾選框會出現）
   - 點擊底部工具列的「分享」按鈕
   - 系統會自動偵測可用的分享方式：
     * 支援 Web Share API：開啟原生分享選單（LINE、Messenger、WhatsApp、Mail、Notes 等）
     * 不支援時：自動複製到剪貼簿，可手動貼上到任何 App
   - **分享格式**：自動格式化為 Markdown，附上對話標題和 emoji 標記
   - **快速操作**：
     * 全選：選取對話中所有訊息
     * 取消：退出選取模式
     * 已選 N 則：顯示目前選取數量

## 常見問題
- **429 / Too Many Requests**：已內建多 Key 輪替和智慧錯誤提示；點擊展開建議查看解決方案（換 Key、換 agent、等待重置等）
- **403 / SERVICE_DISABLED**：錯誤訊息會引導您到 Google Cloud Console 啟用「Generative Language API」
- **API Key 安全性**：Key 儲存在瀏覽器 localStorage，僅限本機使用者可見；建議使用 API Key 限制功能（HTTP referrers）
- **對話紀錄不見了**：對話儲存在瀏覽器本機 IndexedDB，清除瀏覽器資料會一併刪除
- **Gemini 3 Pro 無法使用**：免費版 API 不支援 Gemini 3 Pro（配額為 0）
- **錯誤訊息看不懂**：所有錯誤都有中文友善說明，點擊展開箭頭查看建議；需要除錯可再展開查看原始錯誤

## 指令速查
```bash
npm run dev            # 本地開發
npm run build          # 生產建置（含單元測試）
npm run start          # 本地啟動生產版
npm test               # 執行單元測試(1033 tests)
npm run test:watch     # 監視模式執行測試
npm run test:e2e       # 執行 E2E 測試（Playwright）
npm run test:e2e:ui    # Playwright UI 模式
npm run test:e2e:headed # 開啟瀏覽器視窗執行測試
```

## 目錄摘要
- `src/app/page.tsx`：前端主介面、Gemini API 呼叫、對話管理、Dark Mode、KaTeX 渲染
- `src/components/MessageBubble.tsx`：訊息氣泡組件（React.memo 優化，封裝 Markdown 渲染邏輯）
- `src/components/ApiKeySetup.tsx`：API Key 管理介面（新增、編輯、刪除）
- `src/components/PromptSettings.tsx`：System Prompt 自訂介面（新增、編輯、刪除、設為預設）
- `src/components/Settings.tsx`：Settings 模態視窗（包含 Prompt 設定、API 金鑰、外觀主題三個 tab）
- `src/app/globals.css`：全域樣式、Tailwind v4 配置、Dark Mode 主題變數
- `src/lib/db.ts`：IndexedDB 核心操作，包含 CRUD、LRU 清理邏輯
- `src/lib/useSessionStorage.ts`：React hooks，管理當前對話與對話列表
- `src/__tests__/`：完整單元測試套件(1033 tests, ~92% 覆蓋率：前端邏輯、Gemini SDK 整合、API Key 輪替、錯誤處理、資料庫 LRU、主題切換、對話管理、側邊欄響應式行為、側邊欄持久化 (10 tests)、滾動位置記憶 (15 tests)、智慧滾動按鈕 (23 tests)、Session Hover 按鈕、訊息氣泡渲染優化、MessageBubble Ref Forwarding (5 tests)、Markdown 渲染 (55 tests)、HTML 安全性 (72 tests)、語法高亮 (78 tests)、表格橫向滾動 (33 tests)、代碼區塊橫向滾動 (24 tests)、圖片大小驗證 (10 tests)、滾動 bug 回歸測試 (2 tests)、工具函數）
- `e2e/`：Playwright E2E 測試套件（4 tests：API Key 設定、上傳圖片、連續追問、無 Key 場景）
- `playwright.config.ts`：Playwright 配置（自動啟動 dev server、截圖/影片記錄）
- `.env.test.example`：E2E 測試環境變數範本

## 技術架構

### 前端（100% Client-Side）
- **Next.js 16.1.1** (App Router + Turbopack)
- **React 18** + TypeScript
- **Tailwind CSS v4** (@tailwindcss/postcss)
- **Markdown 渲染**：react-markdown + remark-gfm + remark-math + rehype-katex
- **程式碼高亮**：react-syntax-highlighter (支援深色/淺色主題)
- **KaTeX 0.16.27** (數學公式渲染)
- **IndexedDB (idb 8.0.3)** (本機對話持久化)
- **Google Generative AI SDK 0.24.1** (直接從瀏覽器呼叫)

### 模型支援
- **Gemini 3 Flash Preview** (最新，支援推理深度控制)
- **Gemini 2.5 Flash** (快速平衡)
- **Gemini 2.5 Pro** (高品質輸出)

### 測試
- **Vitest 1.6.1** (單元測試框架)
- **React Testing Library 16.3.1** (React 組件測試)
- **Playwright 1.57.0** (E2E 測試框架)
- **jsdom** (瀏覽器環境模擬)
- **1033 個單元測試** (前端邏輯、Gemini SDK 整合、API Key 輪替、錯誤處理、Settings Tab、Prompt 管理、IndexedDB LRU 清理、主題切換、對話標題編輯、側邊欄響應式行為、側邊欄持久化 (10 tests)、滾動位置記憶 (15 tests)、智慧滾動按鈕 (23 tests)、Session Hover 按鈕、訊息複製、訊息分享、訊息氣泡渲染優化、MessageBubble Ref Forwarding (5 tests)、Markdown 渲染 (55 tests)、HTML 安全性 (72 tests)、語法高亮 (78 tests)、表格橫向滾動 (33 tests)、代碼區塊橫向滾動 (24 tests)、圖片大小驗證 (10 tests)、滾動 bug 回歸測試 (2 tests)、工具函數)
- **4 個 E2E 測試** (API Key 設定流程、圖片上傳與詢問、連續追問、無 Key 顯示設定頁)
- **單元測試覆蓋率**: ~92%
- **E2E 測試環境**: .env.test (需設定 TEST_GEMINI_API_KEY)

## 功能特色

### 📝 完整 Markdown 支援
- **標題**：`# H1`, `## H2`, `### H3` 等多級標題
- **文字格式**：
  - 粗體：`**文字**`
  - 斜體：`*文字*`
  - 刪除線：`~~文字~~`
- **程式碼**：
  - 行內程式碼：`` `code` ``
  - 程式碼區塊：`` ```language\ncode\n``` ``
  - 語法高亮：支援 JavaScript, Python, Java, TypeScript, CSS, HTML 等
  - 主題切換：深色模式使用 oneDark，淺色模式使用 oneLight
- **清單**：
  - 無序：`- item` 或 `* item`
  - 有序：`1. item`
  - 巢狀清單支援
- **引用**：`> 引用文字`
- **連結**：`[文字](URL)`
- **圖片**：`![替代文字](URL)`
- **表格**：GitHub Flavored Markdown (GFM) 表格語法
- **水平線**：`---` 或 `***`
- **數學公式**：整合 KaTeX，支援 `$...$` (行內) 和 `$$...$$` (區塊)
- **HTML 支援**：安全地允許常用 HTML 標籤 (`<div>`, `<span>`, `<br>`, `<hr>` 等)
  - 自動過濾危險標籤（`<script>`, `<iframe>`, `<object>` 等）
  - 支援 `className` 和 `style` 屬性用於樣式客製化

### 👨‍💻 程式碼語法高亮支援語言
- JavaScript / TypeScript
- Python
- Java / Kotlin
- C / C++ / C#
- HTML / CSS / SCSS
- SQL
- Bash / Shell
- JSON / YAML
- Markdown
- 和更多… (Prism.js 支援的所有語言)

### 🎨 Dark Mode 深色模式
- 支援淺色/深色主題無縫切換
- 主題偏好自動儲存到 localStorage
- 首次訪問根據系統偏好自動設定
- 載入時過渡畫面避免主題閃爍

### � 系統 Prompt 自訂
- 內建「QuizMate」預設老師 Prompt（專為解題優化）
- 支援新增最多 5 組自訂 Prompt，滿足多種教學風格
- Prompt 名稱智慧截斷（中文 4 字、英文 12 字）
- 新增/編輯/刪除/設為預設等完整 CRUD 操作
- 自動儲存到 localStorage，跨工作階段持久化
- 所有操作皆需儲存才生效，避免誤操作

### �💬 對話管理
- IndexedDB 自動持久化對話紀錄
- LRU 策略管理儲存空間（最多 30 個對話）
- 側邊欄快速切換歷史對話
- 對話標題自動生成（取自首則問題）
- **標題編輯功能**：
  - 點擊編輯圖示 ✏️ 進入編輯模式
  - 自動切換到該對話並載入內容
  - 30 字元長度限制，緊湊圓形按鈕設計（節省空間）
  - **多種儲存方式**：
    - 點擊綠色打勾 ✓ 儲存
    - 按 `Enter` 鍵儲存
  - **多種取消方式**：
    - 點擊灰色叉號 ✗ 取消
    - 按 `Escape` 鍵取消
    - 點擊編輯框外任何地方取消
  - **響應式按鈕顯示**：
    - 桌面端 (≥1024px)：編輯/刪除按鈕滑鼠懸停才顯示，保持介面簡潔
    - 移動端 (<1024px)：按鈕始終顯示，方便觸控操作
  - 即時更新到 IndexedDB
- **完整時間顯示**：
  - 顯示精確到秒的更新時間（格式：2026/01/01 14:30:45）
  - 使用 24 小時制（不顯示 AM/PM）
  - 自動補零（2-digit 格式）確保顯示一致性

### � 訊息複製功能
- **一鍵複製**：每個對話泡泡右下角外側都有圓形複製按鈕
  - 統一位置：所有訊息（用戶/AI）的按鈕都在泡泡外右下方
  - 浮動設計：白色圓形按鈕 + 陰影效果，懸停時陰影加深
- **視覺反饋**：
  - 預設：灰色複製圖示
  - 複製成功：綠色打勾圖示 ✓
  - 2 秒後自動恢復原狀
- **響應式顯示**：
  - 移動端：按鈕常駐顯示，方便觸控操作
  - 桌面端：滑鼠移到訊息上才顯示按鈕，保持介面簡潔
- **完整內容**：複製原始 Markdown 格式文字，包含所有格式標記
- **跨平台支援**：
  - HTTPS/現代瀏覽器：使用 Clipboard API
  - HTTP/舊瀏覽器：自動使用 execCommand 降級方案

### �📱 響應式佈局優化
- **側邊欄切換**（全螢幕支援）：
  - 行動版與桌面版皆可收起/展開側邊欄
  - 狀態圖示（開啟：雙箭頭向左 ≪ / 關閉：漢堡選單 ☰）
  - 300ms 平滑過渡動畫
  - **響應式自動關閉**：
    - 行動版 (<1024px)：切換對話/新對話後自動關閉側邊欄，最大化顯示空間
    - 桌面版 (≥1024px)：切換對話後保持側邊欄開啟，同時顯示歷史與對話
- **桌面版佈局放大**（≥1024px lg: breakpoint）：
  - 主內容區域：672px → **1024px** (+52%)
  - 對話泡泡寬度：512px → **768px** (+50%)
  - 行動版維持原尺寸，確保最佳閱讀體驗
- **快速滾動按鈕**：
  - 回到頂部按鈕 ⬆️⬆️：快速跳轉至對話開頭
  - 跳到最新按鈕 ⬇️⬇️：快速跳轉至最新訊息
  - 固定在右下角，輸入框上方
  - 半透明背景 + 模糊效果
  - 行動版：48px / 桌面版：56px
### 🤖 多模型選擇
- 三種 Gemini 模型可選：
   - **Gemini 3 Flash Preview**（預設，可切換「快速/推理」：推理時送 `thinkingLevel=high` + `includeThoughts=false`，若 API 不支援會自動回退）
   - **Gemini 2.5 Flash**（官方尚未標示 Thinking，當前不啟用 Thinking）
   - **Gemini 2.5 Pro**（官方尚未標示 Thinking，當前不啟用 Thinking）

### 🔑 API Key 管理
- 瀏覽器端完整 CRUD 介面
- 支援多把 Key 輪替（自動容錯）
- 遇到 429/quota 錯誤自動切換下一把 Key
- localStorage 持久化儲存

### �️ 智慧錯誤處理
- **用戶友善錯誤訊息**：將技術性錯誤轉換為易懂的中文說明
- **兩層展開設計**：
  - 第一層：顯示問題摘要和解決建議（點擊箭頭展開）
  - 第二層：顯示原始技術錯誤（供進階除錯）
- **自動滾動**：展開錯誤詳情時自動滾動至內容區
- **Mobile 優化**：錯誤訊息自動換行，避免破圖
- **常見錯誤識別**：
  - 429 配額用完 → 提供多 Key 輪替、換 agent 等建議
  - 403 權限不足 → 引導啟用 API
  - 401 認證失敗 → 檢查 Key 有效性
  - 400 請求錯誤 → 圖片格式/大小建議
  - 503/500 服務錯誤 → 暫時性問題說明
  - Network 錯誤 → 網路連線檢查
  - Model 不可用 → 建議切換模型
### ⚡ 性能優化
- **React.memo 訊息渲染**：每個訊息氣泡使用 `React.memo` 包裝，避免輸入時重新渲染所有歷史訊息
  - 大幅提升打字流暢度（80-90% CPU 使用率降低）
  - 獨立的 MessageBubble 組件封裝所有渲染邏輯
  - 僅當訊息內容或相關狀態變化時才重新渲染
- **訊息數量管理**：IndexedDB LRU 策略限制最多 30 個對話（圖片限 10MB），優化瀏覽器儲存空間

### 📝 智慧輸入框
- **自動高度調整**：輸入框隨文字內容自動增長（最多 3 行）
  - 最小高度：36px（單行）
  - 最大高度：66px（3 行）
  - 行高：22px，確保一致的視覺韻律
- **按鈕智慧收起**：
  - 點擊輸入框時：上傳/拍照按鈕自動收起（寬度縮為 0，透明度變 0）
  - 離開輸入框時：按鈕恢復正常顯示，輸入框縮回單行高度
  - 平滑過渡動畫：duration-200 確保流暢體驗
- **鍵盤快捷鍵**：
  - `Enter` → 送出訊息
  - `Shift + Enter` → 換行（最多 3 行）
- **Mobile 優化**：
  - 按鈕尺寸：h-9 (36px)，適合觸控操作
  - 間距縮減：gap-1.5 (6px) 避免過於擁擠
  - 字體大小：text-sm 確保可讀性
  - 滾動條：超過 3 行時自動顯示垂直滾動條
  - **鍵盤固定定位**：使用 `sticky bottom-0` 確保輸入框在移動端鍵盤顯示時固定在鍵盤上方，滾動對話時保持可見
- **視覺反饋**：
  - focus 狀態：ring-2 ring-blue-500 明確聚焦指示
  - 載入狀態：按鈕禁用，避免重複送出
### �📐 數學公式支援
- KaTeX 自動渲染行內（`$...$`）與區塊（`$$...$$`）公式
- 錯誤容忍處理，不影響其他內容顯示

### ⚙️ Settings 中心化管理
- **Prompt 設定 Tab**：管理系統 Prompt，支援最多 5 組自訂 Prompt
- **API 金鑰 Tab**：完整的 API Key 管理介面
- **外觀主題 Tab**：淺色/深色主題切換
- 統一的模態介面，易於操作和維護

## 架構優勢

### ✅ 純前端架構
- 無需後端伺服器
- 部署簡單（靜態託管即可）
- 無伺服器成本
- 即時互動，無額外延遲

### ✅ 隱私保護
- API Key 僅存在使用者瀏覽器
- 對話紀錄不上傳到任何伺服器
- 完全本機化運作

### ✅ 彈性部署
- 支援任何靜態託管平台
- Vercel / GitHub Pages / Cloudflare Pages 皆可
- 無需設定環境變數

## 安全提示
- API Key 儲存在瀏覽器 localStorage，僅限本機使用者可見
- 建議在 Google Cloud Console 設定 API Key 限制：
  - **Application restrictions**: HTTP referrers
  - **API restrictions**: Generative Language API only
- 不同裝置/瀏覽器需各自設定 API Key
- 清除瀏覽器資料會同時清除 API Key 與對話紀錄

## E2E 測試設定

### 初次設定
```bash
# 1. 安裝 Playwright 瀏覽器
npx playwright install chromium

# 2. 複製環境變數範本
cp .env.test.example .env.test

# 3. 編輯 .env.test，填入真實的 Gemini API Key
# TEST_GEMINI_API_KEY=your_actual_api_key_here
```

### 執行測試
```bash
npm run test:e2e          # Headless 模式（CI 友善）
npm run test:e2e:headed   # 開啟瀏覽器視窗觀看執行過程
npm run test:e2e:ui       # Playwright UI 模式（可暫停、單步執行）
npx playwright show-report # 查看最後一次測試的 HTML 報告
```

### 測試涵蓋範圍
- ✅ **API Key 設定流程**：透過 UI 輸入 Key 並驗證儲存成功
- ✅ **圖片上傳與詢問**：上傳測試圖片並發送問題
- ✅ **連續追問**：驗證多輪對話功能
- ✅ **無 Key 場景**：清除 localStorage 後驗證顯示設定頁面

### 截圖與影片
- 所有測試失敗會自動截圖並錄製影片
- 儲存位置：`test-results/` 目錄
- HTML 報告包含完整的執行軌跡

## GitHub Actions CI/CD

### 自動化測試
每次 push 或 PR 都會自動執行：
- ✅ 單元測試（Vitest）
- ✅ E2E 測試（Playwright）

### 設定 GitHub Secret
1. 前往 **Settings** → **Secrets and variables** → **Actions**
2. 新增 `TEST_GEMINI_API_KEY`
3. 推送程式碼後自動觸發測試

詳細說明請參考 [.github/workflows/README.md](.github/workflows/README.md)

## License
MIT
