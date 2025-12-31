import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * QuizMate E2E 測試
 * 策略：用 test.use() 來控制 storageState
 */

const apiKey = process.env.TEST_GEMINI_API_KEY;

test.describe('QuizMate E2E Tests', () => {
  test('【Precondition】設定 API Key', async ({ page }) => {
    if (!apiKey) {
      test.skip(true, '未設定 TEST_GEMINI_API_KEY');
      return;
    }
    
    // 這個測試不預設 localStorage，要透過 UI 設定
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 應該看到 API Key 設定頁面
    await expect(page.getByRole('heading', { name: '設定 API 金鑰' })).toBeVisible({ timeout: 5000 });
    
    // 輸入 API Key
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill(apiKey);
    
    // 儲存
    const btn = page.getByRole('button', { name: /儲存|新增/ });
    await btn.click();
    
    // 等待進入主畫面
    await expect(page.locator('textarea#prompt-input')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/00-api-key-set.png' });
  });

  test('上傳圖片並詢問', async ({ page }) => {
    if (!apiKey) {
      test.skip(true, '未設定 TEST_GEMINI_API_KEY');
      return;
    }

    // 手動設定 API Key 到 localStorage
    await page.addInitScript((key) => {
      localStorage.setItem('gemini-api-keys', JSON.stringify([key]));
    }, apiKey);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 驗證在主畫面
    await expect(page.locator('textarea#prompt-input')).toBeVisible({ timeout: 5000 });
    
    // 上傳圖片（使用主要的 dropzone file input）
    const imagePath = path.join(__dirname, 'fixtures', 'test-math.jpg');
    await page.locator('#dropzone-file').setInputFiles(imagePath);
    await page.waitForTimeout(1000);
    
    // 輸入問題
    await page.locator('textarea#prompt-input').fill('這是什麼？');
    await page.locator('button:has-text("傳送")').click();
    
    // 等待回答
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/01-question.png', fullPage: true });
  });

  test('連續追問', async ({ page }) => {
    if (!apiKey) {
      test.skip(true, '未設定 TEST_GEMINI_API_KEY');
      return;
    }

    // 手動設定 API Key 到 localStorage
    await page.addInitScript((key) => {
      localStorage.setItem('gemini-api-keys', JSON.stringify([key]));
    }, apiKey);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('textarea#prompt-input');
    const send = page.locator('button:has-text("傳送")');
    
    // 第一問
    await input.fill('問題 1？');
    await send.click();
    await page.waitForTimeout(1000);
    
    // 第二問
    await input.fill('問題 2？');
    await send.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/02-multiple.png', fullPage: true });
  });

  test('無 API Key 時顯示設定', async ({ page }) => {
    // 先導航到頁面，再清除 localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('heading', { name: '設定 API 金鑰' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'test-results/03-no-key.png' });
  });
});