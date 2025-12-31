# QuizMate E2E 測試設定指南

## 🚀 快速開始

### 1. 建立測試環境變數檔案

```bash
cp .env.test.example .env.test
```

### 2. 填入你的 Gemini API Key

編輯 `.env.test`：

```bash
TEST_GEMINI_API_KEY=your-actual-api-key-here
```

💡 **如何取得 Gemini API Key**：
- 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
- 建立新的 API Key
- 複製並貼到 `.env.test`

### 3. 執行測試

```bash
# 執行所有 E2E 測試
npm run test:e2e

# UI 模式（可視化測試執行）
npm run test:e2e:ui

# Headed 模式（顯示瀏覽器視窗）
npm run test:e2e:headed
```

## 📊 測試內容

✅ **測試 1**：上傳圖片並獲得 AI 回答
- 上傳測試圖片（數學題）
- 輸入問題
- 驗證 AI 回答

✅ **測試 2**：連續追問同一張圖片
- 上傳圖片後多次提問
- 驗證對話紀錄累積

✅ **測試 3**：切換深色模式
- 點擊設定 → 外觀主題
- 驗證深色模式開關

✅ **測試 4**：無 API Key 錯誤處理
- 清除 API Key
- 驗證錯誤提示顯示

## 🔍 查看測試報告

測試完成後：

```bash
npx playwright show-report
```

會自動打開瀏覽器顯示詳細報告，包含：
- ✅ 測試通過/失敗狀態
- 📸 失敗測試的截圖
- 🎥 測試執行錄影
- ⏱️ 執行時間統計

## 📁 測試結果位置

- `test-results/` - 測試結果 JSON 和截圖
- `playwright-report/` - HTML 報告
- `test-results/*.png` - 各步驟截圖

## ⚠️ 注意事項

1. **API Key 安全**：
   - `.env.test` 已加入 `.gitignore`
   - 不會被提交到 Git
   - 請勿分享你的 API Key

2. **測試圖片**：
   - 已自動下載 `test-math.jpg`
   - 可自行新增其他測試圖片到 `e2e/fixtures/`

3. **開發伺服器**：
   - Playwright 會自動啟動 `npm run dev`
   - 測試完成後自動關閉

## 🐛 常見問題

**Q: 測試一直超時？**
- 檢查 API Key 是否有效
- 檢查網路連線
- 增加超時設定（`playwright.config.ts` 中的 `timeout`）

**Q: 找不到測試圖片？**
- 確認 `e2e/fixtures/test-math.jpg` 存在
- 重新執行圖片下載指令（見上方設定步驟）

**Q: API 配額用完？**
- 使用多把 API Key 輪替：`TEST_GEMINI_API_KEY=key1,key2,key3`
