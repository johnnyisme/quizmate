// src/__tests__/errorHandling.test.ts
// 測試錯誤處理功能：getFriendlyErrorMessage 函數

import { describe, it, expect } from 'vitest';

// 複製 getFriendlyErrorMessage 函數邏輯用於測試
const getFriendlyErrorMessage = (error: any): { message: string; suggestion: string } => {
  const errorStr = error?.message || JSON.stringify(error) || '';
  
  // 429 - 配額用完
  if (errorStr.includes("429") || errorStr.toLowerCase().includes("quota") || errorStr.toLowerCase().includes("resource_exhausted")) {
    return {
      message: "API 配額已用完",
      suggestion: "免費額度已經用完。建議：\n1. 等待配額重置（通常每天或每月重置）\n2. 用不同 Google 帳號申請新的 API Key 並加入輪替\n3. 嘗試換不同的 Gemini agent\n4. 升級到付費方案以獲得更高配額"
    };
  }
  
  // 403 - 權限問題
  if (errorStr.includes("403") || errorStr.toLowerCase().includes("permission_denied")) {
    return {
      message: "API 權限不足",
      suggestion: "可能原因：\n1. API Key 沒有存取權限\n2. 需要在 Google Cloud Console 啟用 'Generative Language API'\n3. API Key 可能有 IP 或 HTTP referrer 限制\n\n請到 Google Cloud Console 檢查設定"
    };
  }
  
  // 401 - 認證失敗
  if (errorStr.includes("401") || errorStr.toLowerCase().includes("unauthorized") || errorStr.toLowerCase().includes("invalid_api_key")) {
    return {
      message: "API Key 無效",
      suggestion: "請檢查：\n1. API Key 是否正確複製（沒有多餘空格）\n2. API Key 是否已過期或被刪除\n3. 到 Google AI Studio 重新生成新的 API Key"
    };
  }
  
  // 400 - 請求錯誤
  if (errorStr.includes("400") || errorStr.toLowerCase().includes("invalid_argument")) {
    return {
      message: "請求格式錯誤",
      suggestion: "可能原因：\n1. 圖片格式不支援（請使用 JPG、PNG、GIF、WebP）\n2. 圖片太大（建議小於 4MB）\n3. 問題內容包含不支援的字元\n\n請嘗試重新上傳圖片或修改問題"
    };
  }
  
  // 503 - 服務暫時無法使用
  if (errorStr.includes("503") || errorStr.toLowerCase().includes("unavailable")) {
    return {
      message: "服務暫時無法使用",
      suggestion: "Google AI 服務目前負載過高或維護中。\n請稍後再試，通常幾分鐘內就會恢復"
    };
  }
  
  // 500 - 伺服器錯誤
  if (errorStr.includes("500") || errorStr.toLowerCase().includes("internal")) {
    return {
      message: "伺服器發生錯誤",
      suggestion: "Google AI 服務發生內部錯誤。\n這通常是暫時性問題，請稍後再試"
    };
  }
  
  // Network errors
  if (errorStr.toLowerCase().includes("network") || errorStr.toLowerCase().includes("fetch")) {
    return {
      message: "網路連線問題",
      suggestion: "請檢查：\n1. 網路連線是否正常\n2. 是否有防火牆或代理伺服器阻擋\n3. 嘗試重新整理頁面"
    };
  }
  
  // 模型不支援
  if (errorStr.toLowerCase().includes("model") && errorStr.toLowerCase().includes("not found")) {
    return {
      message: "模型不可用",
      suggestion: "選擇的 AI 模型可能：\n1. 尚未開放使用\n2. 需要付費方案\n3. 已被停用\n\n建議切換到其他模型（如 Gemini 2.5 Flash）"
    };
  }
  
  // 預設錯誤訊息
  return {
    message: "發生未預期的錯誤",
    suggestion: "請嘗試：\n1. 重新整理頁面\n2. 清除瀏覽器快取\n3. 檢查 API Key 是否正確\n4. 點擊下方箭頭查看詳細錯誤訊息\n\n如問題持續，請回報給開發者"
  };
};

describe('Error Handling - getFriendlyErrorMessage', () => {
  describe('HTTP Status Codes', () => {
    it('should handle 429 quota exhausted error', () => {
      const error = { message: 'Error 429: Quota exceeded' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API 配額已用完");
      expect(result.suggestion).toContain("免費額度已經用完");
      expect(result.suggestion).toContain("等待配額重置");
      expect(result.suggestion).toContain("嘗試換不同的 Gemini agent");
    });

    it('should handle resource_exhausted error', () => {
      const error = { message: 'RESOURCE_EXHAUSTED: Quota limit reached' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API 配額已用完");
      expect(result.suggestion).toContain("用不同 Google 帳號申請");
    });

    it('should handle 403 permission denied error', () => {
      const error = { message: 'Error 403: Permission denied' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API 權限不足");
      expect(result.suggestion).toContain("Google Cloud Console");
      expect(result.suggestion).toContain("Generative Language API");
    });

    it('should handle permission_denied error string', () => {
      const error = { message: 'PERMISSION_DENIED: API not enabled' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API 權限不足");
      expect(result.suggestion).toContain("HTTP referrer 限制");
    });

    it('should handle 401 unauthorized error', () => {
      const error = { message: 'Error 401: Unauthorized' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API Key 無效");
      expect(result.suggestion).toContain("API Key 是否正確複製");
      expect(result.suggestion).toContain("Google AI Studio");
    });

    it('should handle invalid_api_key error', () => {
      const error = { message: 'INVALID_API_KEY: The provided API key is invalid' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API Key 無效");
      expect(result.suggestion).toContain("已過期或被刪除");
    });

    it('should handle 400 bad request error', () => {
      const error = { message: 'Error 400: Bad request' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("請求格式錯誤");
      expect(result.suggestion).toContain("圖片格式不支援");
      expect(result.suggestion).toContain("JPG、PNG、GIF、WebP");
    });

    it('should handle invalid_argument error', () => {
      const error = { message: 'INVALID_ARGUMENT: Invalid image format' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("請求格式錯誤");
      expect(result.suggestion).toContain("圖片太大");
    });

    it('should handle 503 service unavailable error', () => {
      const error = { message: 'Error 503: Service unavailable' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("服務暫時無法使用");
      expect(result.suggestion).toContain("負載過高或維護中");
    });

    it('should handle unavailable error string', () => {
      const error = { message: 'UNAVAILABLE: Google AI service is temporarily down' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("服務暫時無法使用");
      expect(result.suggestion).toContain("稍後再試");
    });

    it('should handle 500 internal server error', () => {
      const error = { message: 'Error 500: Internal server error' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("伺服器發生錯誤");
      expect(result.suggestion).toContain("內部錯誤");
      expect(result.suggestion).toContain("暫時性問題");
    });

    it('should handle internal error string', () => {
      const error = { message: 'INTERNAL: Something went wrong' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("伺服器發生錯誤");
    });
  });

  describe('Network Errors', () => {
    it('should handle network connection error', () => {
      const error = { message: 'Network error: Failed to fetch' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("網路連線問題");
      expect(result.suggestion).toContain("網路連線是否正常");
      expect(result.suggestion).toContain("防火牆或代理伺服器");
    });

    it('should handle fetch error', () => {
      const error = { message: 'fetch failed due to timeout' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("網路連線問題");
      expect(result.suggestion).toContain("重新整理頁面");
    });
  });

  describe('Model Errors', () => {
    it('should handle model not found error', () => {
      const error = { message: 'Model gemini-pro-3 not found' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("模型不可用");
      expect(result.suggestion).toContain("尚未開放使用");
      expect(result.suggestion).toContain("Gemini 2.5 Flash");
    });

    it('should handle case-insensitive model error', () => {
      const error = { message: 'MODEL NOT FOUND: Invalid model name' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("模型不可用");
      expect(result.suggestion).toContain("需要付費方案");
    });
  });

  describe('Generic Errors', () => {
    it('should handle unknown error with message property', () => {
      const error = { message: 'Something unexpected happened' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("發生未預期的錯誤");
      expect(result.suggestion).toContain("重新整理頁面");
      expect(result.suggestion).toContain("清除瀏覽器快取");
      expect(result.suggestion).toContain("回報給開發者");
    });

    it('should handle error object without message property', () => {
      const error = { code: 'UNKNOWN_ERROR', details: 'No details' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("發生未預期的錯誤");
      expect(result.suggestion).toContain("檢查 API Key 是否正確");
    });

    it('should handle null error', () => {
      const result = getFriendlyErrorMessage(null);
      
      expect(result.message).toBe("發生未預期的錯誤");
      expect(result.suggestion).toBeDefined();
    });

    it('should handle undefined error', () => {
      const result = getFriendlyErrorMessage(undefined);
      
      expect(result.message).toBe("發生未預期的錯誤");
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle lowercase error keywords', () => {
      const error = { message: 'quota exceeded for this api key' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API 配額已用完");
    });

    it('should handle uppercase error keywords', () => {
      const error = { message: 'NETWORK ERROR OCCURRED' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("網路連線問題");
    });

    it('should handle mixed case error keywords', () => {
      const error = { message: 'Permission_Denied: Access not allowed' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe("API 權限不足");
    });
  });

  describe('Return Value Structure', () => {
    it('should always return object with message and suggestion properties', () => {
      const error = { message: 'Random error' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('suggestion');
      expect(typeof result.message).toBe('string');
      expect(typeof result.suggestion).toBe('string');
    });

    it('should have non-empty message and suggestion', () => {
      const error = { message: '429 error' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.suggestion.length).toBeGreaterThan(0);
    });
  });
});
