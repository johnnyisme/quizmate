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

## 測試統計

- **總測試數**: 1,085 tests
- **測試檔案**: 42 files
- **通過率**: 100% (1085/1085)
- **覆蓋率**: ~92%

### 測試分類
- Unit tests: 984
- Integration tests: 95
- Regression tests: 2
- E2E tests: 4
