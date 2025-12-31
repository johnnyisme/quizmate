# GitHub Actions CI/CD 設定指南

## 🚀 快速設定

### 步驟 1：設定 GitHub Secret

1. 前往你的 GitHub 倉庫
2. 點擊 **Settings** → **Secrets and variables** → **Actions**
3. 點擊 **New repository secret**
4. 新增以下 secret：
   - **Name**: `TEST_GEMINI_API_KEY`
   - **Secret**: 貼上你的 Gemini API Key

### 步驟 2：推送程式碼

```bash
git add .
git commit -m "ci: add GitHub Actions E2E testing workflow"
git push
```

### 步驟 3：查看執行結果

1. 前往 GitHub 倉庫的 **Actions** 頁籤
2. 查看最新的 workflow 執行狀態
3. 點擊進入可查看詳細日誌

## 📊 Workflow 內容

### 觸發條件
- **Push** 到 `main` 或 `develop` 分支
- **Pull Request** 合併到 `main` 或 `develop`

### 執行步驟
1. ✅ Checkout 程式碼
2. ✅ 安裝 Node.js 20
3. ✅ 安裝相依套件
4. ✅ 安裝 Playwright Chromium 瀏覽器
5. ✅ 執行單元測試（Vitest）
6. ✅ 執行 E2E 測試（Playwright）
7. ✅ 上傳測試報告（保留 7 天）

### 測試報告
- **Playwright HTML 報告**：`playwright-report/`
- **測試結果 JSON**：`test-results/`
- 執行失敗時會自動上傳截圖和錄影

## 🔒 安全性

- API Key 儲存在 GitHub Secrets（加密）
- 不會出現在日誌中
- 只有倉庫管理員可以查看/編輯

## 🎯 最佳實作

### Branch Protection Rules
建議在 `main` 分支設定保護規則：

1. Settings → Branches → Add branch protection rule
2. 勾選：
   - ✅ **Require status checks to pass**
   - ✅ 選擇 `test` workflow
   - ✅ **Require branches to be up to date**

這樣確保所有 PR 必須通過測試才能合併。

### 本地測試
PR 前先在本地執行完整測試：

```bash
npm test              # 單元測試
npm run test:e2e      # E2E 測試
```

## 🐛 常見問題

**Q: Workflow 一直顯示黃色（執行中）？**
- 檢查是否正確設定 `TEST_GEMINI_API_KEY` secret
- 查看 Actions 日誌的詳細錯誤訊息

**Q: 如何下載測試報告？**
1. 進入失敗的 workflow 執行頁面
2. 下方 **Artifacts** 區塊點擊 `playwright-report`
3. 解壓縮後用瀏覽器打開 `index.html`

**Q: 測試超時怎麼辦？**
- 預設 10 分鐘超時
- 可在 `.github/workflows/e2e-tests.yml` 調整 `timeout-minutes`

**Q: 想要測試其他瀏覽器？**
修改 `playwright.config.ts`，新增 Firefox 或 WebKit：
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

## 📈 Badge 狀態顯示

在 README.md 加入測試狀態徽章：

```markdown
![E2E Tests](https://github.com/你的用戶名/quizmate/actions/workflows/e2e-tests.yml/badge.svg)
```

## 🔄 進階配置

### 排程執行（每日測試）
在 workflow 加入：
```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00
```

### Matrix 測試（多版本 Node.js）
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```
