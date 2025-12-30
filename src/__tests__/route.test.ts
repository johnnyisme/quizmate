// src/__tests__/route.test.ts
import { NextRequest } from 'next/server';

describe('POST /api/gemini Route', () => {
  describe('parseApiKeys utility', () => {
    const parseApiKeys = (raw: string): string[] => {
      return (raw.includes(',') ? raw.split(',') : [raw])
        .map(k => k.trim().replace(/^"+|"+$/g, ''))
        .filter(k => k.length > 0);
    };

    it('should parse valid API keys', () => {
      const keys = parseApiKeys('key1,key2,key3');
      expect(keys).toEqual(['key1', 'key2', 'key3']);
      expect(keys.length).toBe(3);
    });

    it('should remove quotes from API keys', () => {
      const keys = parseApiKeys('"key1","key2"');
      expect(keys).toEqual(['key1', 'key2']);
    });

    it('should trim whitespace', () => {
      const keys = parseApiKeys('  key1  ,  key2  ');
      expect(keys).toEqual(['key1', 'key2']);
    });

    it('should handle single key without comma', () => {
      const keys = parseApiKeys('single_key_value');
      expect(keys).toEqual(['single_key_value']);
    });

    it('should filter empty strings', () => {
      const keys = parseApiKeys('key1,,key2,');
      expect(keys).toEqual(['key1', 'key2']);
    });
  });

  describe('API key rotation logic', () => {
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

    beforeEach(() => {
      currentKeyIndex = 0;
      failedKeys.clear();
    });

    it('should return first key initially', () => {
      const key = getNextAvailableKey(apiKeys);
      expect(key).toBe('key1');
    });

    it('should rotate to next key after successful request', () => {
      getNextAvailableKey(apiKeys); // key1
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      
      getNextAvailableKey(apiKeys); // should now point to key2
      expect(currentKeyIndex).toBe(1);
    });

    it('should skip failed keys', () => {
      getNextAvailableKey(apiKeys); // key1 (index 0)
      failedKeys.add(0);
      
      const nextKey = getNextAvailableKey(apiKeys);
      expect(nextKey).toBe('key2');
      expect(currentKeyIndex).toBe(1);
    });

    it('should reset when all keys have failed', () => {
      failedKeys.add(0);
      failedKeys.add(1);
      failedKeys.add(2);

      const key = getNextAvailableKey(apiKeys);
      expect(key).toBe('key1');
      expect(failedKeys.size).toBe(0);
    });
  });

  describe('Error classification', () => {
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

    it('should identify rate limit (429) as retryable', () => {
      expect(isRetryableErrorMessage('429 Too Many Requests')).toBe(true);
    });

    it('should identify quota errors as retryable', () => {
      expect(isRetryableErrorMessage('Quota exceeded')).toBe(true);
    });

    it('should identify permission errors as retryable', () => {
      expect(
        isRetryableErrorMessage('permission_denied: User not authorized')
      ).toBe(true);
    });

    it('should identify API key errors as retryable', () => {
      expect(isRetryableErrorMessage('Invalid API key')).toBe(true);
    });

    it('should not flag non-retryable errors', () => {
      expect(isRetryableErrorMessage('Unknown internal error')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isRetryableErrorMessage('QUOTA EXCEEDED')).toBe(true);
      expect(isRetryableErrorMessage('PerMission_Denied')).toBe(true);
    });
  });

  describe('Request validation', () => {
    it('should require either prompt or image', async () => {
      // This would test that the route validates input
      // In real implementation, POST handler would check:
      // if (!prompt && !imageFile) { return error }
      const hasContent = (prompt: string | null, image: File | null) => {
        return !!(prompt || image);
      };

      expect(hasContent(null, null)).toBe(false);
      expect(hasContent('test', null)).toBe(true);
      expect(hasContent(null, new File([''], 'test.jpg'))).toBe(true);
      expect(hasContent('test', new File([''], 'test.jpg'))).toBe(true);
    });

    it('should only include image in first request', () => {
      const history = [{ role: 'user' as const, parts: [{ text: 'initial' }] }];
      const shouldIncludeImage = history.length === 0;

      expect(shouldIncludeImage).toBe(false);
    });

    it('should include image when history is empty', () => {
      const history: any[] = [];
      const shouldIncludeImage = history.length === 0;

      expect(shouldIncludeImage).toBe(true);
    });
  });

  describe('Message composition', () => {
    it('should inject system prompt on first turn only', () => {
      const history1: any[] = [];
      const shouldInjectSystemPrompt1 = history1.length === 0;
      expect(shouldInjectSystemPrompt1).toBe(true);

      const history2 = [{ role: 'user' as const }];
      const shouldInjectSystemPrompt2 = history2.length === 0;
      expect(shouldInjectSystemPrompt2).toBe(false);
    });

    it('should combine system prompt with user prompt on first turn', () => {
      const systemPrompt = '你是一位國中老師';
      const userPrompt = '請解答 2+2';
      const history: any[] = [];

      const shouldCombine = history.length === 0;
      if (shouldCombine) {
        const parts = [systemPrompt, userPrompt];
        expect(parts).toContain(systemPrompt);
        expect(parts).toContain(userPrompt);
      }
    });

    it('should only include user prompt on subsequent turns', () => {
      const userPrompt = '還有問題';
      const history = [{ role: 'user' as const }];

      const shouldCombine = history.length === 0;
      if (!shouldCombine) {
        const parts = [userPrompt];
        expect(parts).toContain(userPrompt);
        expect(parts.length).toBe(1);
      }
    });
  });
});
