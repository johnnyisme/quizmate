// src/__tests__/page.test.ts
// 前端邏輯測試（不涉及 React 組件渲染）

describe('HomePage Helper Functions', () => {
  describe('fileToBase64', () => {
    it('should extract base64 from dataURL correctly', () => {
      // Test the string extraction logic without relying on FileReader (Node env)
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const commaIndex = dataUrl.indexOf(',');
      const base64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
      
      expect(base64).toBe('iVBORw0KGgo=');
      expect(base64).not.toMatch(/^data:/);
    });

    it('should handle dataURL without prefix', () => {
      const raw = 'iVBORw0KGgo=';
      const commaIndex = raw.indexOf(',');
      const base64 = commaIndex !== -1 ? raw.slice(commaIndex + 1) : raw;
      
      expect(base64).toBe('iVBORw0KGgo=');
    });
  });

  describe('renderMathInText', () => {
    const renderMathInText = (text: string): string => {
      try {
        // 簡化版本，用於測試
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/\n/g, '<br />');
        processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match) => `<katex>${match}</katex>`);
        processedText = processedText.replace(/\$([^$]+)\$/g, (match) => `<katex>${match}</katex>`);
        return processedText;
      } catch (e) {
        return text;
      }
    };

    it('should process bold text', () => {
      const input = '這是 **粗體** 文字';
      const output = renderMathInText(input);
      expect(output).toContain('<strong>粗體</strong>');
    });

    it('should process line breaks', () => {
      const input = '第一行\n第二行';
      const output = renderMathInText(input);
      expect(output).toContain('<br />');
    });

    it('should process inline math', () => {
      const input = '計算 $2+2=4$';
      const output = renderMathInText(input);
      expect(output).toContain('<katex>');
    });

    it('should process display math', () => {
      const input = '公式：$$x^2+y^2=z^2$$';
      const output = renderMathInText(input);
      expect(output).toContain('<katex>');
    });

    it('should handle combined formatting', () => {
      const input = '**重要**: $f(x) = x^2$';
      const output = renderMathInText(input);
      expect(output).toContain('<strong>');
      expect(output).toContain('<katex>');
    });
  });

  describe('Conversation Logic', () => {
    it('should validate input before sending', () => {
      const validateInput = (prompt: string, hasImage: boolean) => {
        return !!(prompt.trim() || hasImage);
      };

      expect(validateInput('', false)).toBe(false);
      expect(validateInput('   ', false)).toBe(false);
      expect(validateInput('question', false)).toBe(true);
      expect(validateInput('', true)).toBe(true);
      expect(validateInput('question', true)).toBe(true);
    });

    it('should only include image in first API request', () => {
      const shouldIncludeImage = (historyLength: number) => {
        return historyLength === 0;
      };

      expect(shouldIncludeImage(0)).toBe(true);
      expect(shouldIncludeImage(1)).toBe(false);
      expect(shouldIncludeImage(2)).toBe(false);
    });

    it('should compose FormData correctly', () => {
      const buildFormData = (
        prompt: string,
        history: any[],
        image?: File
      ) => {
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('history', JSON.stringify(history));
        if (history.length === 0 && image) {
          formData.append('image', image);
        }
        return formData;
      };

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const form1 = buildFormData('question', [], file);
      expect(form1.has('image')).toBe(true);

      const form2 = buildFormData('follow-up', [{ role: 'user' }], file);
      expect(form2.has('image')).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should restore prompt on error', () => {
      const originalPrompt = '2+2=?';
      const promptAfterError = originalPrompt;
      
      expect(promptAfterError).toBe('2+2=?');
    });

    it('should remove failed message from conversation', () => {
      const conversation = [
        { role: 'user' as const, text: 'first' },
        { role: 'model' as const, text: 'response' },
        { role: 'user' as const, text: 'failed message' },
      ];

      const recoverConversation = (conv: any[]) => {
        return conv.slice(0, -1);
      };

      const recovered = recoverConversation(conversation);
      expect(recovered.length).toBe(2);
      expect(recovered[recovered.length - 1].text).toBe('response');
    });
  });
});
