# QuizMate

一個針對學生拍題互動解題的 Next.js + Gemini **純前端**專案。支援：
- 上傳或拍攝題目圖片，維持圖片上下文，連續追問同張圖片的多個問題
- 文字/圖片任一即可送出
- KaTeX 數學公式渲染
- **IndexedDB 對話紀錄**：自動儲存對話到瀏覽器本機，可隨時切換歷史對話（最多 10 個）
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

## 部署（Vercel / Netlify / GitHub Pages）
1) 建立 GitHub 倉庫並推送程式碼
2) 連結到 Vercel/Netlify/任何靜態託管平台
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
4) **上傳題目**：拍攝或上傳題目圖片，輸入問題
5) **連續追問**：AI 回答後可繼續追問同張圖片的其他問題
6) **推理控制**（Gemini 3 限定）：
   - 快速：不使用深度推理，回答更快
   - 深度：啟用完整推理過程，回答更詳細
7) **對話紀錄**：
   - 所有對話自動儲存到瀏覽器 IndexedDB
   - 點擊左上角選單圖示開啟側邊欄，查看歷史對話
   - 最多保留 10 個對話，超過會自動刪除最舊的（LRU 策略）
8) **Dark Mode**：點擊右上角太陽/月亮圖示切換主題

## 常見問題
- **429 / Too Many Requests**：已內建多 Key 輪替和智慧錯誤提示；點擊展開建議查看解決方案（換 Key、換 agent、等待重置等）
- **403 / SERVICE_DISABLED**：錯誤訊息會引導您到 Google Cloud Console 啟用「Generative Language API」
- **API Key 安全性**：Key 儲存在瀏覽器 localStorage，僅限本機使用者可見；建議使用 API Key 限制功能（HTTP referrers）
- **對話紀錄不見了**：對話儲存在瀏覽器本機 IndexedDB，清除瀏覽器資料會一併刪除
- **Gemini 3 Pro 無法使用**：免費版 API 不支援 Gemini 3 Pro（配額為 0）
- **錯誤訊息看不懂**：所有錯誤都有中文友善說明，點擊展開箭頭查看建議；需要除錯可再展開查看原始錯誤

## 指令速查
```bash
npm run dev         # 本地開發
npm run build       # 生產建置（含測試）
npm run start       # 本地啟動生產版
npm test            # 執行單元測試（185+ tests）
npm run test:watch  # 監視模式執行測試
```

## 目錄摘要
- `src/app/page.tsx`：前端主介面、Gemini API 呼叫、對話管理、Dark Mode、KaTeX 渲染
- `src/components/ApiKeySetup.tsx`：API Key 管理介面（新增、編輯、刪除）
- `src/components/PromptSettings.tsx`：System Prompt 自訂介面（新增、編輯、刪除、設為預設）
- `src/components/Settings.tsx`：Settings 模態視窗（包含 Prompt 設定、API 金鑰、外觀主題三個 tab）
- `src/app/globals.css`：全域樣式、Tailwind v4 配置、Dark Mode 主題變數
- `src/lib/db.ts`：IndexedDB 核心操作，包含 CRUD、LRU 清理邏輯
- `src/lib/useSessionStorage.ts`：React hooks，管理當前對話與對話列表
- `src/__tests__/`：完整單元測試套件（包含錯誤處理、輸入框自動增長、Prompt 截斷、Settings 邏輯、按鈕狀態等）

## 技術架構

### 前端（100% Client-Side）
- **Next.js 16.1.1** (App Router + Turbopack)
- **React 18** + TypeScript
- **Tailwind CSS v4** (@tailwindcss/postcss)
- **KaTeX 0.16.27** (數學公式渲染)
- **IndexedDB (idb 8.0.3)** (本機對話持久化)
- **Google Generative AI SDK 0.24.1** (直接從瀏覽器呼叫)

### 模型支援
- **Gemini 3 Flash Preview** (最新，支援推理深度控制)
- **Gemini 2.5 Flash** (快速平衡)
- **Gemini 2.5 Pro** (高品質輸出)

### 測試
- **Vitest 1.6.1** (單元測試框架)
- **jsdom** (瀏覽器環境模擬)
- **185+ 個測試** (錯誤處理、輸入框自動增長、Prompt 截斷、Settings 邏輯、按鈕狀態、前端邏輯、資料庫、主題、工具函數)

## 功能特色

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
- LRU 策略管理儲存空間（最多 10 個對話）
- 側邊欄快速切換歷史對話
- 對話標題自動生成（取自首則問題）

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
- Vercel / Netlify / GitHub Pages / Cloudflare Pages 皆可
- 無需設定環境變數

## 安全提示
- API Key 儲存在瀏覽器 localStorage，僅限本機使用者可見
- 建議在 Google Cloud Console 設定 API Key 限制：
  - **Application restrictions**: HTTP referrers
  - **API restrictions**: Generative Language API only
- 不同裝置/瀏覽器需各自設定 API Key
- 清除瀏覽器資料會同時清除 API Key 與對話紀錄

## License
MIT
