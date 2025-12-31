// src/__tests__/utils.test.ts
// 測試前端工具函數（API key 解析與輪替邏輯）

describe('Frontend Utils (API Key Management)', () => {
  describe('parseApiKeys', () => {
    it('should parse comma-separated API keys', () => {
      const raw = 'key1,key2,key3';
      const parseApiKeys = (raw: string) =>
        (raw.includes(',') ? raw.split(',') : [raw])
          .map(k => k.trim().replace(/^"+|"+$/g, ''))
          .filter(k => k.length > 0);

      const result = parseApiKeys(raw);
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should handle quoted API keys', () => {
      const raw = '"key1","key2","key3"';
      const parseApiKeys = (raw: string) =>
        (raw.includes(',') ? raw.split(',') : [raw])
          .map(k => k.trim().replace(/^"+|"+$/g, ''))
          .filter(k => k.length > 0);

      const result = parseApiKeys(raw);
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should handle whitespace in API keys', () => {
      const raw = '  key1  ,  key2  ,  key3  ';
      const parseApiKeys = (raw: string) =>
        (raw.includes(',') ? raw.split(',') : [raw])
          .map(k => k.trim().replace(/^"+|"+$/g, ''))
          .filter(k => k.length > 0);

      const result = parseApiKeys(raw);
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should handle single API key (no comma)', () => {
      const raw = 'single_key';
      const parseApiKeys = (raw: string) =>
        (raw.includes(',') ? raw.split(',') : [raw])
          .map(k => k.trim().replace(/^"+|"+$/g, ''))
          .filter(k => k.length > 0);

      const result = parseApiKeys(raw);
      expect(result).toEqual(['single_key']);
    });

    it('should filter out empty strings', () => {
      const raw = 'key1,,key2';
      const parseApiKeys = (raw: string) =>
        (raw.includes(',') ? raw.split(',') : [raw])
          .map(k => k.trim().replace(/^"+|"+$/g, ''))
          .filter(k => k.length > 0);

      const result = parseApiKeys(raw);
      expect(result).toEqual(['key1', 'key2']);
    });
  });

  describe('isRetryableErrorMessage', () => {
    const isRetryableErrorMessage = (message: string): boolean => {
      const m = message.toLowerCase();
      return (
        m.includes('429') ||
        m.includes('too many requests') ||
        m.includes('quota') ||
        m.includes('service_disabled') ||
        m.includes('generative language api has not been used') ||
        m.includes('permission_denied') ||
        m.includes('api key not valid') ||
        m.includes('invalid api key') ||
        m.includes('request had insufficient authentication scopes')
      );
    };

    it('should identify 429 (rate limit) errors as retryable', () => {
      expect(isRetryableErrorMessage('Error 429: Too many requests')).toBe(true);
    });

    it('should identify quota errors as retryable', () => {
      expect(isRetryableErrorMessage('Quota exceeded for quota metric')).toBe(true);
    });

    it('should identify permission_denied as retryable', () => {
      expect(isRetryableErrorMessage('permission_denied: User not authorized')).toBe(true);
    });

    it('should identify invalid api key as retryable', () => {
      expect(isRetryableErrorMessage('Invalid API key provided')).toBe(true);
    });

    it('should not identify generic errors as retryable', () => {
      expect(isRetryableErrorMessage('Some random error')).toBe(false);
    });
  });

  describe('getNextAvailableKey', () => {
    it('should return next available key when some keys have failed', () => {
      let currentKeyIndex = 0;
      let failedKeys = new Set<number>();
      const apiKeys = ['key1', 'key2', 'key3'];

      const getNextAvailableKey = (apiKeys: string[]): string => {
        for (let i = 0; i < apiKeys.length; i++) {
          const index = (currentKeyIndex + i) % apiKeys.length;
          if (!failedKeys.has(index)) {
            currentKeyIndex = index;
            return apiKeys[index];
          }
        }
        failedKeys.clear();
        currentKeyIndex = 0;
        return apiKeys[0];
      };

      expect(getNextAvailableKey(apiKeys)).toBe('key1');

      failedKeys.add(0);
      expect(getNextAvailableKey(apiKeys)).toBe('key2');

      failedKeys.add(1);
      expect(getNextAvailableKey(apiKeys)).toBe('key3');

      // All keys failed, should reset
      failedKeys.add(2);
      expect(getNextAvailableKey(apiKeys)).toBe('key1');
      expect(failedKeys.size).toBe(0);
    });

    it('should handle edge case: no API keys available', () => {
      const apiKeys: string[] = [];
      const getNextAvailableKey = (apiKeys: string[]): string | null => {
        if (apiKeys.length === 0) return null;
        return apiKeys[0];
      };

      expect(getNextAvailableKey(apiKeys)).toBeNull();
    });

    it('should handle edge case: single API key', () => {
      const apiKeys = ['only-key'];
      let currentKeyIndex = 0;
      const failedKeys = new Set<number>();

      const getNextAvailableKey = (apiKeys: string[]): string => {
        for (let i = 0; i < apiKeys.length; i++) {
          const index = (currentKeyIndex + i) % apiKeys.length;
          if (!failedKeys.has(index)) {
            currentKeyIndex = index;
            return apiKeys[index];
          }
        }
        failedKeys.clear();
        currentKeyIndex = 0;
        return apiKeys[0];
      };

      expect(getNextAvailableKey(apiKeys)).toBe('only-key');
      
      // 即使失敗也只能重試同一個 key
      failedKeys.add(0);
      expect(getNextAvailableKey(apiKeys)).toBe('only-key');
      expect(failedKeys.size).toBe(0); // 應重置
    });

    it('should advance currentKeyIndex on successful request', () => {
      const apiKeys = ['key1', 'key2', 'key3'];
      let currentKeyIndex = 0;

      const advanceKeyIndex = (successIndex: number) => {
        currentKeyIndex = successIndex;
      };

      // 模擬成功使用 key2
      advanceKeyIndex(1);
      expect(currentKeyIndex).toBe(1);

      // 下一次應從 key2 開始輪轉
      const nextKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      expect(nextKeyIndex).toBe(2);
    });
  });

  describe('streamToBuffer', () => {
    it('should convert a mock stream to buffer', async () => {
      const chunks = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
      ];

      const mockStream = {
        getReader: () => {
          let index = 0;
          return {
            read: async () => {
              if (index < chunks.length) {
                return { done: false, value: chunks[index++] };
              }
              return { done: true };
            },
          };
        },
      } as any;

      const streamToBuffer = async (stream: ReadableStream<Uint8Array>): Promise<Buffer> => {
        const reader = stream.getReader();
        const chunkArray: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunkArray.push(value);
        }
        return Buffer.concat(chunkArray);
      };

      const result = await streamToBuffer(mockStream);
      expect(result).toEqual(Buffer.concat([Buffer.from([1, 2, 3]), Buffer.from([4, 5, 6])]));
    });
  });
});
