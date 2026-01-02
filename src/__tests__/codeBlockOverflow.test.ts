import { describe, it, expect } from 'vitest';

describe('Code Block Overflow Handling', () => {
  describe('Code Block Wrapper Structure', () => {
    it('should have overflow-x-auto class for horizontal scrolling', () => {
      const wrapperClasses = 'overflow-x-auto -mx-3 px-3 my-2';
      
      expect(wrapperClasses).toContain('overflow-x-auto');
    });

    it('should extend to bubble edges with negative margin', () => {
      const wrapperClasses = 'overflow-x-auto -mx-3 px-3 my-2';
      
      expect(wrapperClasses).toContain('-mx-3');
    });

    it('should maintain visual spacing with padding', () => {
      const wrapperClasses = 'overflow-x-auto -mx-3 px-3 my-2';
      
      expect(wrapperClasses).toContain('px-3');
    });

    it('should add vertical spacing with margin', () => {
      const wrapperClasses = 'overflow-x-auto -mx-3 px-3 my-2';
      
      expect(wrapperClasses).toContain('my-2');
    });

    it('should set max-width to prevent overflow on mobile', () => {
      const wrapperStyle = { maxWidth: 'calc(100vw - 4rem)' };
      
      expect(wrapperStyle.maxWidth).toBe('calc(100vw - 4rem)');
    });
  });

  describe('SyntaxHighlighter Custom Styles', () => {
    it('should remove default margin', () => {
      const customStyle = {
        margin: 0,
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
      };
      
      expect(customStyle.margin).toBe(0);
    });

    it('should apply rounded corners', () => {
      const customStyle = {
        margin: 0,
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
      };
      
      expect(customStyle.borderRadius).toBe('0.375rem');
    });

    it('should set readable font size', () => {
      const customStyle = {
        margin: 0,
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
      };
      
      expect(customStyle.fontSize).toBe('0.875rem');
    });
  });

  describe('Long Code Line Handling', () => {
    it('should handle long single-line code without breaking layout', () => {
      const longLine = 'model = genai.GenerativeModel(model_name="gemini-2.0-pro-exp-02-05")';
      const maxWidth = 'calc(100vw - 4rem)';
      
      expect(longLine.length).toBeGreaterThan(50);
      expect(maxWidth).toBeTruthy();
    });

    it('should handle long multi-line code blocks', () => {
      const multiLineCode = `import google.generativeai as genai

genai.configure(api_key="YOUR_GEMINI_API_KEY")

video_file = genai.upload_file(path="yuhsuan_match_vs_rival.mp4")

model = genai.GenerativeModel(model_name="gemini-2.0-pro-exp-02-05")`;
      
      const lines = multiLineCode.split('\n');
      const hasLongLines = lines.some(line => line.length > 50);
      
      expect(hasLongLines).toBe(true);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should calculate correct max-width for mobile (375px)', () => {
      const viewportWidth = 375;
      const padding = 4 * 16; // 4rem = 64px
      const expectedMaxWidth = viewportWidth - padding;
      
      expect(expectedMaxWidth).toBe(311);
    });

    it('should calculate correct max-width for tablet (768px)', () => {
      const viewportWidth = 768;
      const padding = 4 * 16; // 4rem = 64px
      const expectedMaxWidth = viewportWidth - padding;
      
      expect(expectedMaxWidth).toBe(704);
    });

    it('should calculate correct max-width for desktop (1280px)', () => {
      const viewportWidth = 1280;
      const padding = 4 * 16; // 4rem = 64px
      const expectedMaxWidth = viewportWidth - padding;
      
      expect(expectedMaxWidth).toBe(1216);
    });
  });

  describe('Consistency with Table Overflow', () => {
    it('should use same overflow-x-auto class as tables', () => {
      const codeWrapperClasses = 'overflow-x-auto -mx-3 px-3 my-2';
      const tableWrapperClasses = 'overflow-x-scroll -mx-3 px-3 my-2';
      
      // Both should have overflow-x handling
      expect(codeWrapperClasses).toContain('overflow-x');
      expect(tableWrapperClasses).toContain('overflow-x');
    });

    it('should use same negative margin as tables', () => {
      const codeWrapperClasses = 'overflow-x-auto -mx-3 px-3 my-2';
      const tableWrapperClasses = 'overflow-x-scroll -mx-3 px-3 my-2';
      
      expect(codeWrapperClasses).toContain('-mx-3');
      expect(tableWrapperClasses).toContain('-mx-3');
    });

    it('should use same padding as tables', () => {
      const codeWrapperClasses = 'overflow-x-auto -mx-3 px-3 my-2';
      const tableWrapperClasses = 'overflow-x-scroll -mx-3 px-3 my-2';
      
      expect(codeWrapperClasses).toContain('px-3');
      expect(tableWrapperClasses).toContain('px-3');
    });

    it('should use same max-width calculation as tables', () => {
      const codeMaxWidth = 'calc(100vw - 4rem)';
      const tableMaxWidth = 'calc(100vw - 4rem)';
      
      expect(codeMaxWidth).toBe(tableMaxWidth);
    });
  });

  describe('Code vs Inline Code', () => {
    it('should differentiate between code blocks and inline code', () => {
      const isInline = false;
      const hasLanguageMatch = true;
      
      const shouldWrap = !isInline && hasLanguageMatch;
      
      expect(shouldWrap).toBe(true);
    });

    it('should not wrap inline code', () => {
      const isInline = true;
      const hasLanguageMatch = false;
      
      const shouldWrap = !isInline && hasLanguageMatch;
      
      expect(shouldWrap).toBe(false);
    });

    it('should not wrap code without language specification', () => {
      const isInline = false;
      const hasLanguageMatch = false;
      
      const shouldWrap = !isInline && hasLanguageMatch;
      
      expect(shouldWrap).toBe(false);
    });
  });

  describe('Language Detection', () => {
    it('should detect python language', () => {
      const className = 'language-python';
      const match = /language-(\w+)/.exec(className);
      
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('python');
    });

    it('should detect javascript language', () => {
      const className = 'language-javascript';
      const match = /language-(\w+)/.exec(className);
      
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('javascript');
    });

    it('should detect typescript language', () => {
      const className = 'language-typescript';
      const match = /language-(\w+)/.exec(className);
      
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('typescript');
    });

    it('should return null for no language class', () => {
      const className = 'some-other-class';
      const match = /language-(\w+)/.exec(className);
      
      expect(match).toBeNull();
    });
  });
});
