import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileToBase64, isMobile, generateTitle, truncatePromptName } from '@/utils/fileUtils';

describe('fileUtils', () => {
  describe('fileToBase64', () => {
    it('should convert File to base64 string', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = await fileToBase64(file);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Base64 should not contain the data: prefix
      expect(result).not.toContain('data:');
    });

    it('should handle image files', async () => {
      const blob = new Blob(['fake image data'], { type: 'image/png' });
      const file = new File([blob], 'test.png', { type: 'image/png' });
      const result = await fileToBase64(file);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should reject on error', async () => {
      const invalidFile = new File([], 'test.txt');
      
      // Create a mock FileReader that fails
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'));
            }
          }, 0);
        }
      } as any;

      try {
        await fileToBase64(invalidFile);
        expect.fail('Should have thrown error');
      } catch (e) {
        expect(e).toBeTruthy();
      } finally {
        global.FileReader = originalFileReader;
      }
    });
  });

  describe('isMobile', () => {
    beforeEach(() => {
      // Reset navigator
      Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        configurable: true,
      });
    });

    it('should return true for Android devices', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        configurable: true,
      });
      
      expect(isMobile()).toBe(true);
    });

    it('should return true for iPhone', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });
      
      expect(isMobile()).toBe(true);
    });

    it('should return true for iPad', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        configurable: true,
      });
      
      expect(isMobile()).toBe(true);
    });

    it('should return false for desktop', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      
      expect(isMobile()).toBe(false);
    });

    it('should return false for Mac', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      
      expect(isMobile()).toBe(false);
    });
  });

  describe('generateTitle', () => {
    it('should clean and return short text', () => {
      const text = '簡單問題';
      const result = generateTitle(text);
      
      expect(result).toBe('簡單問題');
    });

    it('should truncate long text', () => {
      const longText = '這是一個非常長的問題，包含很多字元，需要被截斷以符合標題長度限制';
      const result = generateTitle(longText);
      
      expect(result.length).toBe(33); // 30 + "..."
      expect(result.endsWith('...')).toBe(true);
    });

    it('should remove special characters', () => {
      const text = '問題*包含$特殊\n字符';
      const result = generateTitle(text);
      
      expect(result).toBe('問題 包含 特殊 字符');
      expect(result).not.toContain('*');
      expect(result).not.toContain('$');
      expect(result).not.toContain('\n');
    });

    it('should handle empty string', () => {
      const result = generateTitle('');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const text = '  問題前後有空格  ';
      const result = generateTitle(text);
      
      expect(result).toBe('問題前後有空格');
    });
  });

  describe('truncatePromptName', () => {
    it('should not truncate short Chinese names', () => {
      const name = '預設';
      const result = truncatePromptName(name);
      
      expect(result).toBe('預設');
    });

    it('should truncate long Chinese names', () => {
      const name = '這是很長的中文名稱';
      const result = truncatePromptName(name);
      
      expect(result).toBe('這是很長...');
    });

    it('should not truncate short English names', () => {
      const name = 'Default';
      const result = truncatePromptName(name);
      
      expect(result).toBe('Default');
    });

    it('should truncate long English names', () => {
      const name = 'VeryLongEnglishPromptNameHere';
      const result = truncatePromptName(name);
      
      expect(result).toBe('VeryLongEngl...');
    });

    it('should handle mixed Chinese and English', () => {
      const name = 'Math數學Tutor';
      const result = truncatePromptName(name);
      
      // Has Chinese, so max 4 characters
      expect(result).toBe('Math...');
    });

    it('should handle exactly 4 Chinese characters', () => {
      const name = '預設提示';
      const result = truncatePromptName(name);
      
      expect(result).toBe('預設提示');
    });

    it('should handle exactly 12 English characters', () => {
      const name = 'DefaultPromp';
      const result = truncatePromptName(name);
      
      expect(result).toBe('DefaultPromp');
    });
  });
});
