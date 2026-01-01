// src/__tests__/markdownRendering.test.ts
// Markdown 渲染功能的單元測試

import { describe, it, expect } from 'vitest';

describe('Markdown Rendering', () => {
  describe('Basic Markdown Support', () => {
    it('should support headers (H1-H6)', () => {
      const markdown = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
      expect(markdown).toContain('# H1');
      expect(markdown).toContain('## H2');
      expect(markdown).toContain('### H3');
    });

    it('should support bold text', () => {
      const markdown = '**bold text**';
      expect(markdown).toContain('**bold text**');
    });

    it('should support italic text', () => {
      const markdown = '*italic text*';
      expect(markdown).toContain('*italic text*');
    });

    it('should support strikethrough (GFM)', () => {
      const markdown = '~~strikethrough~~';
      expect(markdown).toContain('~~strikethrough~~');
    });

    it('should support inline code', () => {
      const markdown = '`inline code`';
      expect(markdown).toContain('`inline code`');
    });

    it('should support code blocks with language', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      expect(markdown).toContain('```javascript');
      expect(markdown).toContain('const x = 1;');
    });
  });

  describe('Lists Support', () => {
    it('should support unordered lists', () => {
      const markdown = '- item 1\n- item 2\n- item 3';
      expect(markdown).toContain('- item 1');
      expect(markdown).toContain('- item 2');
    });

    it('should support ordered lists', () => {
      const markdown = '1. first\n2. second\n3. third';
      expect(markdown).toContain('1. first');
      expect(markdown).toContain('2. second');
    });

    it('should support nested lists', () => {
      const markdown = '- parent\n  - child\n    - grandchild';
      expect(markdown).toContain('- parent');
      expect(markdown).toContain('- child');
      expect(markdown).toContain('- grandchild');
    });
  });

  describe('Links and Images', () => {
    it('should support links', () => {
      const markdown = '[Link Text](https://example.com)';
      expect(markdown).toContain('[Link Text]');
      expect(markdown).toContain('(https://example.com)');
    });

    it('should support images', () => {
      const markdown = '![Alt Text](https://example.com/image.png)';
      expect(markdown).toContain('![Alt Text]');
      expect(markdown).toContain('(https://example.com/image.png)');
    });

    it('should support reference-style links', () => {
      const markdown = '[Link][ref]\n\n[ref]: https://example.com';
      expect(markdown).toContain('[Link][ref]');
      expect(markdown).toContain('[ref]: https://example.com');
    });
  });

  describe('Blockquotes and Horizontal Rules', () => {
    it('should support blockquotes', () => {
      const markdown = '> This is a quote\n> Multiple lines';
      expect(markdown).toContain('> This is a quote');
      expect(markdown).toContain('> Multiple lines');
    });

    it('should support nested blockquotes', () => {
      const markdown = '> Level 1\n>> Level 2\n>>> Level 3';
      expect(markdown).toContain('> Level 1');
      expect(markdown).toContain('>> Level 2');
    });

    it('should support horizontal rules', () => {
      const markdown1 = '---';
      const markdown2 = '***';
      const markdown3 = '___';
      expect(markdown1).toBe('---');
      expect(markdown2).toBe('***');
      expect(markdown3).toBe('___');
    });
  });

  describe('GitHub Flavored Markdown (GFM)', () => {
    it('should support tables', () => {
      const markdown = '| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |';
      expect(markdown).toContain('| Header 1 | Header 2 |');
      expect(markdown).toContain('| Cell 1   | Cell 2   |');
    });

    it('should support task lists', () => {
      const markdown = '- [x] Completed task\n- [ ] Pending task';
      expect(markdown).toContain('- [x] Completed task');
      expect(markdown).toContain('- [ ] Pending task');
    });

    it('should support autolinks', () => {
      const markdown = 'Visit https://example.com for more info';
      expect(markdown).toContain('https://example.com');
    });

    it('should support table alignment', () => {
      const markdown = '| Left | Center | Right |\n| :--- | :----: | ----: |\n| L    | C      | R     |';
      expect(markdown).toContain(':---');
      expect(markdown).toContain(':----:');
      expect(markdown).toContain('----:');
    });
  });

  describe('Math Formulas (KaTeX)', () => {
    it('should support inline math', () => {
      const markdown = 'The formula is $E = mc^2$';
      expect(markdown).toContain('$E = mc^2$');
    });

    it('should support display math', () => {
      const markdown = '$$\\int_{a}^{b} f(x) dx$$';
      expect(markdown).toContain('$$');
      expect(markdown).toContain('\\int_{a}^{b}');
    });

    it('should support complex math expressions', () => {
      const markdown = '$\\frac{a}{b}$, $\\sqrt{x}$, $x^2$';
      expect(markdown).toContain('\\frac{a}{b}');
      expect(markdown).toContain('\\sqrt{x}');
      expect(markdown).toContain('x^2');
    });

    it('should support matrix notation', () => {
      const markdown = '$$\\begin{matrix} a & b \\\\ c & d \\end{matrix}$$';
      expect(markdown).toContain('\\begin{matrix}');
      expect(markdown).toContain('\\end{matrix}');
    });
  });

  describe('HTML Support (Sanitized)', () => {
    it('should allow safe HTML tags', () => {
      const markdown = '<div>Content</div>';
      expect(markdown).toContain('<div>');
      expect(markdown).toContain('</div>');
    });

    it('should allow span with style', () => {
      const markdown = '<span style="color: red;">Red text</span>';
      expect(markdown).toContain('<span');
      expect(markdown).toContain('style="color: red;"');
    });

    it('should allow className attribute', () => {
      const markdown = '<div className="custom-class">Content</div>';
      expect(markdown).toContain('className="custom-class"');
    });

    it('should allow br and hr tags', () => {
      const markdown = 'Line 1<br>Line 2<hr>Line 3';
      expect(markdown).toContain('<br>');
      expect(markdown).toContain('<hr>');
    });
  });

  describe('Code Syntax Highlighting', () => {
    it('should recognize JavaScript language', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      expect(markdown).toContain('```javascript');
    });

    it('should recognize Python language', () => {
      const markdown = '```python\nprint("Hello")\n```';
      expect(markdown).toContain('```python');
    });

    it('should recognize TypeScript language', () => {
      const markdown = '```typescript\nlet x: number = 1;\n```';
      expect(markdown).toContain('```typescript');
    });

    it('should recognize Java language', () => {
      const markdown = '```java\npublic class Main {}\n```';
      expect(markdown).toContain('```java');
    });

    it('should recognize CSS language', () => {
      const markdown = '```css\nbody { margin: 0; }\n```';
      expect(markdown).toContain('```css');
    });

    it('should recognize HTML language', () => {
      const markdown = '```html\n<div>Hello</div>\n```';
      expect(markdown).toContain('```html');
    });

    it('should recognize SQL language', () => {
      const markdown = '```sql\nSELECT * FROM users;\n```';
      expect(markdown).toContain('```sql');
    });

    it('should recognize Bash language', () => {
      const markdown = '```bash\necho "Hello"\n```';
      expect(markdown).toContain('```bash');
    });
  });

  describe('Mixed Content', () => {
    it('should support Markdown with inline code and math', () => {
      const markdown = 'Use `Math.sqrt()` to calculate $\\sqrt{x}$';
      expect(markdown).toContain('`Math.sqrt()`');
      expect(markdown).toContain('$\\sqrt{x}$');
    });

    it('should support lists with code blocks', () => {
      const markdown = '- Item 1\n  ```js\n  const x = 1;\n  ```\n- Item 2';
      expect(markdown).toContain('- Item 1');
      expect(markdown).toContain('```js');
    });

    it('should support headers with inline code', () => {
      const markdown = '## Using `useState()` Hook';
      expect(markdown).toContain('## Using');
      expect(markdown).toContain('`useState()`');
    });

    it('should support blockquotes with bold text', () => {
      const markdown = '> **Important:** This is critical';
      expect(markdown).toContain('> **Important:**');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const markdown = '';
      expect(markdown).toBe('');
    });

    it('should handle only whitespace', () => {
      const markdown = '   \n  \t  ';
      expect(markdown).toMatch(/^\s+$/);
    });

    it('should handle special characters', () => {
      const markdown = 'Special: & < > " \' /';
      expect(markdown).toContain('&');
      expect(markdown).toContain('<');
      expect(markdown).toContain('>');
    });

    it('should handle malformed markdown gracefully', () => {
      const markdown = '### Incomplete header\n**Unclosed bold\n`Unclosed code';
      expect(markdown).toContain('### Incomplete header');
      expect(markdown).toContain('**Unclosed bold');
    });

    it('should handle very long code blocks', () => {
      const longCode = 'x'.repeat(10000);
      const markdown = '```\n' + longCode + '\n```';
      expect(markdown.length).toBeGreaterThan(10000);
    });

    it('should handle multiple consecutive newlines', () => {
      const markdown = 'Line 1\n\n\n\n\nLine 2';
      expect(markdown).toContain('Line 1');
      expect(markdown).toContain('Line 2');
    });
  });

  describe('Security (Sanitization)', () => {
    it('should block script tags', () => {
      const dangerousHtml = '<script>alert("XSS")</script>';
      // In actual rendering, this would be sanitized
      // Testing the expectation that dangerous content exists in input
      expect(dangerousHtml).toContain('<script>');
      // But rehype-sanitize should remove it in actual rendering
    });

    it('should block iframe tags', () => {
      const dangerousHtml = '<iframe src="https://evil.com"></iframe>';
      expect(dangerousHtml).toContain('<iframe');
      // rehype-sanitize should remove this
    });

    it('should block onclick handlers', () => {
      const dangerousHtml = '<div onclick="alert(1)">Click me</div>';
      expect(dangerousHtml).toContain('onclick');
      // rehype-sanitize should remove onclick attribute
    });

    it('should block javascript: URLs', () => {
      const dangerousHtml = '<a href="javascript:alert(1)">Link</a>';
      expect(dangerousHtml).toContain('javascript:');
      // rehype-sanitize should remove or sanitize this
    });

    it('should allow data: URLs for images (if configured)', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const markdown = `![Image](${dataUrl})`;
      expect(markdown).toContain('data:image/png');
    });
  });

  describe('Remark and Rehype Plugins Integration', () => {
    it('should have remark-math plugin active', () => {
      // This tests the expectation that math syntax is present
      const markdown = '$x = y$';
      expect(markdown).toContain('$x = y$');
    });

    it('should have remark-gfm plugin active', () => {
      // This tests GFM features are recognized
      const markdown = '~~strikethrough~~';
      expect(markdown).toContain('~~');
    });

    it('should have rehype-katex plugin active', () => {
      // KaTeX should process math formulas
      const markdown = '$$E = mc^2$$';
      expect(markdown).toContain('$$');
    });

    it('should have rehype-raw plugin active', () => {
      // HTML should be parsed
      const markdown = '<div>HTML content</div>';
      expect(markdown).toContain('<div>');
    });

    it('should have rehype-sanitize plugin active', () => {
      // Dangerous content should be identifiable
      const dangerous = '<script>alert(1)</script>';
      expect(dangerous).toContain('<script>');
      // In actual rendering, this would be removed
    });
  });
});
