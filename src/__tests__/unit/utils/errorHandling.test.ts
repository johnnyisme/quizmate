import { describe, it, expect } from 'vitest';
import { getFriendlyErrorMessage } from '@/utils/errorHandling';

describe('errorHandling', () => {
  describe('getFriendlyErrorMessage', () => {
    it('should handle 429 quota errors', () => {
      const error = { message: 'Error 429: Quota exceeded' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('API 配額已用完');
      expect(result.suggestion).toContain('免費額度已經用完');
      expect(result.suggestion).toContain('換不同的 Gemini agent');
    });

    it('should handle quota exceeded errors', () => {
      const error = { message: 'RESOURCE_EXHAUSTED quota exceeded' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('API 配額已用完');
      expect(result.suggestion).toContain('配額重置');
    });

    it('should handle 403 permission denied', () => {
      const error = { message: 'Error 403: Permission denied' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('API 權限不足');
      expect(result.suggestion).toContain('Google Cloud Console');
      expect(result.suggestion).toContain('Generative Language API');
    });

    it('should handle permission_denied errors', () => {
      const error = { message: 'PERMISSION_DENIED: Access denied' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('API 權限不足');
    });

    it('should handle 401 unauthorized', () => {
      const error = { message: 'Error 401: Unauthorized' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('API Key 無效');
      expect(result.suggestion).toContain('API Key 是否正確複製');
      expect(result.suggestion).toContain('Google AI Studio');
    });

    it('should handle invalid_api_key errors', () => {
      const error = { message: 'INVALID_API_KEY: The key is invalid' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('API Key 無效');
    });

    it('should handle 400 bad request', () => {
      const error = { message: 'Error 400: Bad request' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('請求格式錯誤');
      expect(result.suggestion).toContain('圖片格式不支援');
    });

    it('should handle invalid_argument errors', () => {
      const error = { message: 'INVALID_ARGUMENT: Invalid input' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('請求格式錯誤');
    });

    it('should handle 503 service unavailable', () => {
      const error = { message: 'Error 503: Service unavailable' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('服務暫時無法使用');
      expect(result.suggestion).toContain('負載過高或維護中');
    });

    it('should handle unavailable errors', () => {
      const error = { message: 'UNAVAILABLE: Service temporarily down' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('服務暫時無法使用');
    });

    it('should handle 500 internal server error', () => {
      const error = { message: 'Error 500: Internal server error' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('伺服器發生錯誤');
      expect(result.suggestion).toContain('內部錯誤');
    });

    it('should handle internal errors', () => {
      const error = { message: 'INTERNAL: Something went wrong' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('伺服器發生錯誤');
    });

    it('should handle network errors', () => {
      const error = { message: 'NetworkError: Connection failed' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('網路連線問題');
      expect(result.suggestion).toContain('網路連線是否正常');
    });

    it('should handle fetch errors', () => {
      const error = { message: 'FetchError: Failed to fetch' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('網路連線問題');
    });

    it('should handle model not found', () => {
      const error = { message: 'Model gemini-pro-2 not found' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('模型不可用');
      expect(result.suggestion).toContain('切換到其他模型');
    });

    it('should handle unknown errors', () => {
      const error = { message: 'Something completely unexpected' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('發生未預期的錯誤');
      expect(result.suggestion).toContain('重新整理頁面');
      expect(result.suggestion).toContain('清除瀏覽器快取');
    });

    it('should handle error objects without message', () => {
      const error = { code: 'UNKNOWN' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('發生未預期的錯誤');
    });

    it('should handle null/undefined errors', () => {
      const result1 = getFriendlyErrorMessage(null);
      const result2 = getFriendlyErrorMessage(undefined);
      
      expect(result1.message).toBe('發生未預期的錯誤');
      expect(result2.message).toBe('發生未預期的錯誤');
    });

    it('should be case insensitive', () => {
      const error1 = { message: 'ERROR 429: QUOTA EXCEEDED' };
      const error2 = { message: 'error 429: quota exceeded' };
      
      const result1 = getFriendlyErrorMessage(error1);
      const result2 = getFriendlyErrorMessage(error2);
      
      expect(result1.message).toBe('API 配額已用完');
      expect(result2.message).toBe('API 配額已用完');
    });

    it('should handle combined error patterns', () => {
      const error = { message: '429 RESOURCE_EXHAUSTED: quota exceeded' };
      const result = getFriendlyErrorMessage(error);
      
      expect(result.message).toBe('API 配額已用完');
    });
  });
});
