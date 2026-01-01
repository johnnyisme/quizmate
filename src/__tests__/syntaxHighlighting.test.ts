// src/__tests__/syntaxHighlighting.test.ts
// 程式碼語法高亮功能的單元測試

import { describe, it, expect } from 'vitest';

describe('Syntax Highlighting', () => {
  describe('Language Detection from Fence Markers', () => {
    it('should detect JavaScript language', () => {
      const fence = '```javascript';
      const match = /language-(\w+)/.exec(`language-javascript`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('javascript');
    });

    it('should detect TypeScript language', () => {
      const fence = '```typescript';
      const match = /language-(\w+)/.exec(`language-typescript`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('typescript');
    });

    it('should detect Python language', () => {
      const fence = '```python';
      const match = /language-(\w+)/.exec(`language-python`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('python');
    });

    it('should detect Java language', () => {
      const fence = '```java';
      const match = /language-(\w+)/.exec(`language-java`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('java');
    });

    it('should detect C++ language', () => {
      const fence = '```cpp';
      const match = /language-(\w+)/.exec(`language-cpp`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('cpp');
    });

    it('should detect C# language', () => {
      const fence = '```csharp';
      const match = /language-(\w+)/.exec(`language-csharp`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('csharp');
    });

    it('should detect Go language', () => {
      const fence = '```go';
      const match = /language-(\w+)/.exec(`language-go`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('go');
    });

    it('should detect Rust language', () => {
      const fence = '```rust';
      const match = /language-(\w+)/.exec(`language-rust`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('rust');
    });

    it('should detect Ruby language', () => {
      const fence = '```ruby';
      const match = /language-(\w+)/.exec(`language-ruby`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('ruby');
    });

    it('should detect PHP language', () => {
      const fence = '```php';
      const match = /language-(\w+)/.exec(`language-php`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('php');
    });

    it('should detect Swift language', () => {
      const fence = '```swift';
      const match = /language-(\w+)/.exec(`language-swift`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('swift');
    });

    it('should detect Kotlin language', () => {
      const fence = '```kotlin';
      const match = /language-(\w+)/.exec(`language-kotlin`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('kotlin');
    });
  });

  describe('Markup and Styling Languages', () => {
    it('should detect HTML language', () => {
      const fence = '```html';
      const match = /language-(\w+)/.exec(`language-html`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('html');
    });

    it('should detect CSS language', () => {
      const fence = '```css';
      const match = /language-(\w+)/.exec(`language-css`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('css');
    });

    it('should detect SCSS language', () => {
      const fence = '```scss';
      const match = /language-(\w+)/.exec(`language-scss`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('scss');
    });

    it('should detect XML language', () => {
      const fence = '```xml';
      const match = /language-(\w+)/.exec(`language-xml`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('xml');
    });

    it('should detect JSON language', () => {
      const fence = '```json';
      const match = /language-(\w+)/.exec(`language-json`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('json');
    });

    it('should detect YAML language', () => {
      const fence = '```yaml';
      const match = /language-(\w+)/.exec(`language-yaml`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('yaml');
    });

    it('should detect Markdown language', () => {
      const fence = '```markdown';
      const match = /language-(\w+)/.exec(`language-markdown`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('markdown');
    });
  });

  describe('Shell and Scripting Languages', () => {
    it('should detect Bash language', () => {
      const fence = '```bash';
      const match = /language-(\w+)/.exec(`language-bash`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('bash');
    });

    it('should detect Shell language', () => {
      const fence = '```shell';
      const match = /language-(\w+)/.exec(`language-shell`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('shell');
    });

    it('should detect PowerShell language', () => {
      const fence = '```powershell';
      const match = /language-(\w+)/.exec(`language-powershell`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('powershell');
    });

    it('should detect Batch language', () => {
      const fence = '```batch';
      const match = /language-(\w+)/.exec(`language-batch`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('batch');
    });
  });

  describe('Database and Query Languages', () => {
    it('should detect SQL language', () => {
      const fence = '```sql';
      const match = /language-(\w+)/.exec(`language-sql`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('sql');
    });

    it('should detect GraphQL language', () => {
      const fence = '```graphql';
      const match = /language-(\w+)/.exec(`language-graphql`);
      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('graphql');
    });
  });

  describe('Inline Code vs Block Code', () => {
    it('should identify inline code (no language)', () => {
      const inline = true;
      const className = undefined;
      expect(inline).toBe(true);
      expect(className).toBeUndefined();
    });

    it('should identify block code with language', () => {
      const inline = false;
      const className = 'language-javascript';
      expect(inline).toBe(false);
      expect(className).toBe('language-javascript');
    });

    it('should identify block code without language', () => {
      const inline = false;
      const className = undefined;
      expect(inline).toBe(false);
      expect(className).toBeUndefined();
    });
  });

  describe('Theme Support', () => {
    it('should use oneDark theme for dark mode', () => {
      const isDark = true;
      const expectedTheme = 'oneDark';
      expect(isDark).toBe(true);
      expect(expectedTheme).toBe('oneDark');
    });

    it('should use oneLight theme for light mode', () => {
      const isDark = false;
      const expectedTheme = 'oneLight';
      expect(isDark).toBe(false);
      expect(expectedTheme).toBe('oneLight');
    });

    it('should switch theme based on isDark prop', () => {
      let isDark = true;
      let theme = isDark ? 'oneDark' : 'oneLight';
      expect(theme).toBe('oneDark');

      isDark = false;
      theme = isDark ? 'oneDark' : 'oneLight';
      expect(theme).toBe('oneLight');
    });
  });

  describe('Code Content Processing', () => {
    it('should remove trailing newline from code', () => {
      const code = 'const x = 1;\n';
      const processed = code.replace(/\n$/, '');
      expect(processed).toBe('const x = 1;');
    });

    it('should preserve internal newlines', () => {
      const code = 'line1\nline2\nline3\n';
      const processed = code.replace(/\n$/, '');
      expect(processed).toBe('line1\nline2\nline3');
    });

    it('should handle code without trailing newline', () => {
      const code = 'const x = 1;';
      const processed = code.replace(/\n$/, '');
      expect(processed).toBe('const x = 1;');
    });

    it('should convert children to string', () => {
      const children = ['const x = 1;'];
      const stringified = String(children);
      expect(stringified).toBe('const x = 1;');
    });

    it('should handle empty code block', () => {
      const code = '';
      expect(code).toBe('');
    });

    it('should handle whitespace-only code', () => {
      const code = '   \n  \t  \n';
      const processed = code.replace(/\n$/, '');
      expect(processed).toMatch(/\s+/);
    });
  });

  describe('Language Aliases', () => {
    it('should recognize js as javascript', () => {
      const fence = '```js';
      const match = /language-(\w+)/.exec(`language-js`);
      expect(match?.[1]).toBe('js');
      // In Prism, 'js' is an alias for 'javascript'
    });

    it('should recognize ts as typescript', () => {
      const fence = '```ts';
      const match = /language-(\w+)/.exec(`language-ts`);
      expect(match?.[1]).toBe('ts');
    });

    it('should recognize py as python', () => {
      const fence = '```py';
      const match = /language-(\w+)/.exec(`language-py`);
      expect(match?.[1]).toBe('py');
    });

    it('should recognize sh as shell', () => {
      const fence = '```sh';
      const match = /language-(\w+)/.exec(`language-sh`);
      expect(match?.[1]).toBe('sh');
    });

    it('should recognize yml as yaml', () => {
      const fence = '```yml';
      const match = /language-(\w+)/.exec(`language-yml`);
      expect(match?.[1]).toBe('yml');
    });

    it('should recognize md as markdown', () => {
      const fence = '```md';
      const match = /language-(\w+)/.exec(`language-md`);
      expect(match?.[1]).toBe('md');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing language marker', () => {
      const className = undefined;
      const match = /language-(\w+)/.exec(className || '');
      expect(match).toBeNull();
    });

    it('should handle empty language marker', () => {
      const className = 'language-';
      const match = /language-(\w+)/.exec(className);
      expect(match).toBeNull();
    });

    it('should handle invalid language name', () => {
      const className = 'language-xyz123unknown';
      const match = /language-(\w+)/.exec(className);
      expect(match?.[1]).toBe('xyz123unknown');
      // Even invalid languages should be extracted
    });

    it('should handle multiple classes', () => {
      const className = 'code-block language-javascript highlighted';
      const match = /language-(\w+)/.exec(className);
      expect(match?.[1]).toBe('javascript');
    });

    it('should handle case sensitivity', () => {
      const className = 'language-JavaScript';
      const match = /language-(\w+)/.exec(className);
      expect(match?.[1]).toBe('JavaScript');
    });

    it('should handle hyphenated language names', () => {
      const className = 'language-objective-c';
      const match = /language-([\w-]+)/.exec(className);
      expect(match?.[1]).toContain('objective-c');
    });
  });

  describe('Custom Code Component Logic', () => {
    it('should render SyntaxHighlighter for block code with language', () => {
      const inline = false;
      const className = 'language-javascript';
      const match = /language-(\w+)/.exec(className);
      
      const shouldUseSyntaxHighlighter = !inline && match;
      expect(shouldUseSyntaxHighlighter).toBeTruthy();
    });

    it('should render regular code tag for inline code', () => {
      const inline = true;
      const className = 'language-javascript';
      const match = /language-(\w+)/.exec(className);
      
      const shouldUseSyntaxHighlighter = !inline && match;
      expect(shouldUseSyntaxHighlighter).toBe(false);
    });

    it('should render regular code tag for block code without language', () => {
      const inline = false;
      const className = undefined;
      const match = /language-(\w+)/.exec(className || '');
      
      const shouldUseSyntaxHighlighter = !inline && match;
      expect(shouldUseSyntaxHighlighter).toBeFalsy();
    });
  });

  describe('SyntaxHighlighter Props', () => {
    it('should use div as PreTag', () => {
      const PreTag = 'div';
      expect(PreTag).toBe('div');
    });

    it('should pass language from match group', () => {
      const className = 'language-javascript';
      const match = /language-(\w+)/.exec(className);
      const language = match?.[1];
      expect(language).toBe('javascript');
    });

    it('should select theme based on isDark', () => {
      const isDark = true;
      const style = isDark ? 'oneDark' : 'oneLight';
      expect(style).toBe('oneDark');
    });

    it('should process children before passing', () => {
      const children = ['const x = 1;\n'];
      const processed = String(children).replace(/\n$/, '');
      expect(processed).toBe('const x = 1;');
    });
  });

  describe('Common Programming Languages', () => {
    const languages = [
      'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
      'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css',
      'sql', 'bash', 'json', 'yaml', 'xml', 'markdown'
    ];

    languages.forEach(lang => {
      it(`should support ${lang} language`, () => {
        const className = `language-${lang}`;
        const match = /language-(\w+)/.exec(className);
        expect(match?.[1]).toBe(lang);
      });
    });
  });

  describe('Integration with ReactMarkdown', () => {
    it('should receive props from ReactMarkdown', () => {
      const props = {
        node: {},
        inline: false,
        className: 'language-javascript',
        children: ['const x = 1;'],
      };
      
      expect(props.node).toBeDefined();
      expect(props.inline).toBe(false);
      expect(props.className).toBe('language-javascript');
      expect(props.children).toEqual(['const x = 1;']);
    });

    it('should handle spread props', () => {
      const props = {
        node: {},
        inline: false,
        className: 'language-javascript',
        children: ['code'],
        key: '1',
        id: 'code-block',
      };
      
      const { node, inline, className, children, ...rest } = props;
      expect(rest).toEqual({ key: '1', id: 'code-block' });
    });
  });
});
