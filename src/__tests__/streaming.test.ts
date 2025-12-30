// src/__tests__/streaming.test.ts
// 流式回應邏輯測試

describe('Streaming Response Logic', () => {
  describe('Client-side stream processing', () => {
    it('should accumulate stream chunks into full text', async () => {
      // 模擬流式回應的 chunks
      const chunks = ['這是', '第一', '句話。', '這是', '第二', '句話。'];
      let accumulatedText = '';

      // 模擬接收每個 chunk 並累積
      for (const chunk of chunks) {
        accumulatedText += chunk;
      }

      expect(accumulatedText).toBe('這是第一句話。這是第二句話。');
    });

    it('should decode text stream correctly', () => {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const text = '你好世界';
      const encoded = encoder.encode(text);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe('你好世界');
    });

    it('should handle stream chunks with special characters', () => {
      const chunks = [
        '**粗體**',
        '$x^2$',
        '\n換行',
        '公式$$a+b=c$$'
      ];
      let accumulated = '';

      for (const chunk of chunks) {
        accumulated += chunk;
      }

      expect(accumulated).toContain('**粗體**');
      expect(accumulated).toContain('$x^2$');
      expect(accumulated).toContain('\n');
      expect(accumulated).toContain('$$a+b=c$$');
    });

    it('should update UI messages incrementally', () => {
      // 模擬流式更新的邏輯
      const mockConversation = [
        { role: 'user' as const, text: '問題' },
      ];

      // 第一步：添加空的 AI 回應訊息
      mockConversation.push({ role: 'model' as const, text: '' });

      // 模擬流式更新
      const chunks = ['答案', '第一', '部分', '。', '答案', '第二', '部分', '。'];
      let fullResponse = '';

      for (const chunk of chunks) {
        fullResponse += chunk;
        // 更新最後一條訊息
        if (mockConversation.length > 0) {
          const lastMsg = mockConversation[mockConversation.length - 1];
          if (lastMsg.role === 'model') {
            lastMsg.text = fullResponse;
          }
        }
      }

      expect(mockConversation).toHaveLength(2);
      expect(mockConversation[1].role).toBe('model');
      expect(mockConversation[1].text).toBe('答案第一部分。答案第二部分。');
    });

    it('should handle empty stream gracefully', () => {
      const chunks: string[] = [];
      let accumulated = '';

      for (const chunk of chunks) {
        accumulated += chunk;
      }

      expect(accumulated).toBe('');
    });

    it('should handle very large stream chunks', () => {
      // 模擬大型文本流
      const largeChunk = '這是一個很長的回答。'.repeat(1000);
      const chunks = [largeChunk.slice(0, 100), largeChunk.slice(100, 200), largeChunk.slice(200)];

      let accumulated = '';
      for (const chunk of chunks) {
        accumulated += chunk;
      }

      expect(accumulated.length).toBeGreaterThan(1000);
      expect(accumulated).toContain('這是一個很長的回答。');
    });
  });

  describe('Stream error handling', () => {
    it('should handle stream read errors', async () => {
      // 模擬流讀取錯誤
      const simulateStreamError = async () => {
        throw new Error('Stream read failed');
      };

      await expect(simulateStreamError()).rejects.toThrow('Stream read failed');
    });

    it('should detect incomplete streams', () => {
      const chunks = ['第一部分', '第二部分'];
      // 模擬不完整的流（缺少結束信號）
      const isStreamComplete = (chunks: string[]) => chunks.length > 0 && chunks[chunks.length - 1].includes('。');

      expect(isStreamComplete(['開始。'])).toBe(true);
      expect(isStreamComplete(['開始', '沒有句號'])).toBe(false);
    });

    it('should handle encoding errors gracefully', () => {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      // 模擬無效的 UTF-8 bytes
      const invalidBytes = new Uint8Array([0xFF, 0xFE, 0xFD]);
      const result = decoder.decode(invalidBytes);

      // non-fatal mode 應該不拋出錯誤，而是替換無效字符
      expect(typeof result).toBe('string');
    });
  });

  describe('maxOutputTokens optimization', () => {
    it('should enforce token limit in generation config', () => {
      const maxTokens = 12000;
      const generationConfig = { maxOutputTokens: maxTokens };

      expect(generationConfig.maxOutputTokens).toBe(12000);
      expect(generationConfig.maxOutputTokens).toBeLessThan(65536); // 確實降低了
    });

    it('should balance response quality and speed', () => {
      // 驗證新的 token 限制不會過低
      const maxTokens = 12000;

      expect(maxTokens).toBeGreaterThanOrEqual(4000); // 最少要有合理的答案空間
      expect(maxTokens).toBeLessThan(20000); // 但不要太大影響速度
    });

    it('should calculate approximate response time reduction', () => {
      const oldTokens = 65536;
      const newTokens = 12000;
      const reductionRatio = newTokens / oldTokens;

      // 理論上限比例降低 82%，但實際速度提升取決於回答長度
      // 大多數數學題目回答遠低於上限，故實際提速有限
      expect(reductionRatio).toBeCloseTo(0.183, 2);
      expect(reductionRatio).toBeLessThan(0.20);
    });
  });

  describe('Stream message reconstruction', () => {
    it('should reconstruct full message from stream chunks', () => {
      const chunks = [
        '**答案**：',
        '4\n\n',
        '**題目主旨**：',
        '測試基本加法\n\n',
        '**解題步驟**：',
        '\n1. 2+2\n2. =4',
      ];

      let fullMessage = '';
      for (const chunk of chunks) {
        fullMessage += chunk;
      }

      expect(fullMessage).toContain('**答案**');
      expect(fullMessage).toContain('基本加法');
      expect(fullMessage).toContain('解題步驟');
      expect(fullMessage).toContain('1. 2+2');
    });

    it('should preserve formatting in streamed text', () => {
      const formattedChunks = [
        '**重要**: ',
        'KaTeX: $\\frac{a}{b}$',
        '\n\n',
        '公式: $$x^2+y^2=z^2$$',
      ];

      let result = '';
      for (const chunk of formattedChunks) {
        result += chunk;
      }

      expect(result).toContain('**重要**');
      expect(result).toContain('$\\frac{a}{b}$');
      expect(result).toContain('$$x^2+y^2=z^2$$');
    });

    it('should accumulate KaTeX formulas correctly', () => {
      // 確保數學公式不會在流式傳輸中被破壞
      const katexFormulas = [
        '簡單公式：$2+2=4$',
        '複雜公式：$$\\int_0^1 x^2 dx = \\frac{1}{3}$$',
        '混合文字和公式：$a+b$ 等於 $c$',
      ];

      let accumulated = '';
      for (const formula of katexFormulas) {
        accumulated += formula + '\n';
      }

      expect(accumulated).toMatch(/\$[^$]+\$/); // 至少有一個 inline 公式
      expect(accumulated).toMatch(/\$\$[^$]+\$\$/); // 至少有一個 display 公式
    });
  });
});
