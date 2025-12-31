import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// 載入測試環境變數
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright E2E 測試配置
 * 針對 QuizMate 專案優化，支援 AI 友善的報告格式
 */
export default defineConfig({
  // 測試目錄
  testDir: './e2e',
  
  // 完整測試追蹤（截圖、錄影）
  use: {
    // 基礎 URL（本地開發伺服器）
    baseURL: 'http://localhost:3000',
    
    // 測試追蹤（失敗時保留）
    trace: 'on-first-retry',
    
    // 截圖（失敗時保留）
    screenshot: 'only-on-failure',
    
    // 錄影（失敗時保留）
    video: 'retain-on-failure',
  },

  // 在測試前啟動開發伺服器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 分鐘
  },

  // 測試項目（瀏覽器配置）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 報告格式（AI 友善）
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'], // 終端機友善輸出
  ],

  // 測試超時
  timeout: 30 * 1000, // 30 秒
  
  // 預期超時
  expect: {
    timeout: 5 * 1000, // 5 秒
  },

  // 重試次數（CI 環境）
  retries: process.env.CI ? 2 : 0,
  
  // 平行執行
  workers: process.env.CI ? 1 : undefined,
});
