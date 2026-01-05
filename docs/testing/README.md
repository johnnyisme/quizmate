# 測試文件

QuizMate 測試相關文件索引

## 文件列表

### 測試覆蓋與統計
- [TESTS.md](./TESTS.md) - 完整測試文件清單與覆蓋率報告
- [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) - 測試覆蓋率詳細報告

### 測試類型
- [E2E_TESTING.md](./E2E_TESTING.md) - End-to-End 測試指南 (Playwright)
- [INTEGRATION_TEST_PLAN.md](./INTEGRATION_TEST_PLAN.md) - 整合測試計畫

## 測試指令

```bash
# 執行所有單元測試
npm test

# 測試 watch 模式
npm run test:watch

# E2E 測試
npm run test:e2e

# E2E UI 模式
npm run test:e2e:ui

# E2E Headed 模式
npm run test:e2e:headed
```

## 測試統計（截至 2026-01-05）

- **總測試數**: 1,222 tests
- **測試檔案**: 50+ files（見 src/__tests__、src/components/__tests__、src/lib/__tests__、e2e）
- **通過率**: 100%（最近一次完整執行）
- **覆蓋率**: ~92%（以 coverage 報告為準）

### 測試分類（概略）
- Unit tests: ~1,100
- Integration tests: ~95
- Regression tests: 2
- E2E tests: 4

> 說明：以上統計會隨功能演進而更新，請以最新一次 `npm test` 與 Coverage 報告為準。

### 變更紀錄
- 移除備份測試檔：`src/__tests__/multiImageUpload.test.tsx.backup`（避免混淆與重複）
