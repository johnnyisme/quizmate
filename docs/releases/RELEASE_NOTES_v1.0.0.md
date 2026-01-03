# 🎉 QuizMate v1.0.0 - 首個穩定版本

**發布日期**: 2025 年 12 月

一個專為學生設計的 **純前端 AI 解題助手**，無需後端伺服器，支援圖片上傳題目、連續追問、對話管理，讓學習更輕鬆！

---

## ✨ 核心功能

### 📝 智慧解題
- **圖片上傳題目**：支援拍照或從相簿選擇，維持圖片上下文連續追問
- **即時攝影機**：桌面版開啟即時預覽，行動版使用原生相機
- **多模型支援**：Gemini 3 Flash（推理模式）、Gemini 2.5 Flash、Gemini 2.5 Pro
- **自訂 System Prompt**：支援最多 5 組自訂 Prompt，靈活切換教學風格

### 🎨 使用者體驗
- **完整 Markdown 支援**：表格、程式碼語法高亮（78 種語言）、數學公式（KaTeX）、GFM
- **Dark Mode 深色模式**：淺色/深色主題無縫切換，自動記憶偏好
- **智慧輸入框**：自動高度調整（最多 3 行）、Enter 換行、按鈕送出
- **訊息管理**：一鍵複製、多選分享到 LINE/Messenger、長按進入選取模式

### 💾 對話管理
- **IndexedDB 持久化**：自動儲存對話到瀏覽器本機（最多 30 個，LRU 策略）
- **完整時間顯示**：精確到秒的更新時間（格式：2026/01/01 14:30:45）
- **標題編輯功能**：點擊編輯圖示即時更新對話標題
- **滾動位置記憶**：切換對話自動恢復閱讀位置

### 🔒 隱私保護
- **100% 純前端架構**：API Key 僅存在使用者瀏覽器
- **多 Key 輪替**：自動容錯，遇到配額限制自動切換
- **智慧錯誤提示**：友善的中文錯誤訊息，兩層展開式詳細說明

---

## 🛠️ 技術亮點

### 前端技術棧
- **Next.js 16.1.1** (App Router + Turbopack)
- **React 18 + TypeScript** (strict mode)
- **Tailwind CSS v4** (@tailwindcss/postcss)
- **Google Generative AI SDK 0.24.1** (直接從瀏覽器呼叫)
- **IndexedDB (idb 8.0.3)** (本機對話持久化)

### 測試覆蓋
- ✅ **1,074 個測試** (977 unit + 95 integration + 2 regression + 4 E2E)
- ✅ **100% 通過率** (Test Files 41/41, Tests 1074/1074)
- ✅ **~92% 覆蓋率** (前端邏輯、React 組件、資料庫操作、UI 交互)
- ✅ **E2E 測試** (Playwright 1.57.0)

### 效能優化
- **React.memo 訊息渲染**：80-90% CPU 使用率降低
- **動態載入 Settings**：Code splitting 減少初始載入時間
- **KaTeX 動態載入**：只在需要時載入數學公式渲染庫
- **Grouped State**：減少不必要的 re-render

---

## 🐛 Bug 修復 (v1.0.0)

### 滾動位置穩定性
- ✅ 修復 AI 回應完成後畫面跳動問題
- ✅ 使用 `prevSessionIdRef` 偵測真正的 session 切換
- ✅ 只在切換 session 時恢復滾動位置
- ✅ 防止同 session 更新時的滾動干擾

### Enter 鍵 UX 改進
- ✅ Enter 鍵改為換行（符合多數使用者習慣）
- ✅ 移除自動 blur（鍵盤保持開啟）
- ✅ 只能透過按鈕送出訊息（防止誤觸）

---

## 📦 部署方式

### Vercel (推薦)
1. Fork 本專案到你的 GitHub
2. 連結到 Vercel
3. 無需設定環境變數（純前端架構）
4. 使用者首次訪問時自行輸入 API Key

### 本地開發
```bash
npm install
npm run dev
# 打開 http://localhost:3000
```

---

## 📚 文件與測試

- 📖 **README.md** - 完整功能說明與快速開始
- 🧪 **TESTS.md** - 1,074 個測試詳細文件
- 🚀 **E2E_TESTING.md** - Playwright E2E 測試指南
- 📝 **.github/copilot-instructions.md** - AI Agent 開發指南

---

## 🎯 適用場景

- ✅ 國中、高中學生作業解題
- ✅ 大學生學習輔助（數學、程式碼、文科）
- ✅ 自學者概念理解與追問
- ✅ 家長陪伴孩子學習
- ✅ 老師快速生成解題思路

---

## 🔐 安全提示

- API Key 儲存在瀏覽器 localStorage，僅限本機使用者可見
- 建議在 Google Cloud Console 設定 API Key 限制（HTTP referrers）
- 不同裝置/瀏覽器需各自設定 API Key
- 清除瀏覽器資料會同時清除 API Key 與對話紀錄

---

## 🙏 致謝

感謝 Google Gemini API 提供強大的 AI 能力！

---

## 📝 完整變更日誌

### 功能新增
- 圖片上傳與即時攝影機
- 多模型選擇（Gemini 3/2.5）
- 推理深度控制（快速/推理模式）
- 自訂 System Prompt（最多 5 組）
- 完整 Markdown 渲染（GFM、KaTeX、語法高亮）
- Dark Mode 深色模式
- IndexedDB 對話持久化（LRU 策略）
- 訊息複製與多選分享
- 側邊欄對話管理
- 滾動位置記憶
- 智慧滾動按鈕（回到頂部/跳到最新）
- 圖片大小限制（10MB）與友善錯誤提示
- API Key 多把輪替與管理

### 測試與品質
- 1,074 個測試（100% 通過率）
- ~92% 測試覆蓋率
- E2E 測試（Playwright）
- 完整的錯誤處理與友善提示

### 效能優化
- React.memo 訊息渲染
- 動態載入與 Code splitting
- Grouped state 管理
- 響應式佈局優化

---

## 📊 專案規格

- **Minimum Requirements**:
  - Node.js 18+
  - Modern Browser (Chrome 90+, Safari 14+, Firefox 88+)
  - Google Gemini API Key (免費版即可)
- **License**: MIT
- **Language**: TypeScript + React
- **Test Coverage**: ~92%
- **Bundle Size**: ~500KB (gzipped)

---

**完整原始碼**: [GitHub Repository](https://github.com/johnnyisme/quizmate)

**立即體驗**: [部署到 Vercel 開始使用！](https://vercel.com)
