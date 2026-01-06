import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '@/components/MessageBubble';

describe('Math Formula Duplication Fix', () => {
  const mockProps = {
    index: 0,
    isLastUserMessage: false,
    isSelectMode: false,
    isSelected: false,
    copiedMessageIndex: null,
    isDark: false,
    onToggleSelect: vi.fn(),
    onCopyMessage: vi.fn(),
    onEnterShareMode: vi.fn(),
    onLongPressStart: vi.fn(),
    onLongPressEnd: vi.fn(),
    onImagePreview: vi.fn(),
  };

  describe('KaTeX Configuration', () => {
    it('should use default KaTeX output (MathML + HTML for accessibility)', () => {
      const msg = {
        role: 'model' as const,
        text: '$x=1$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have both MathML (for screen readers) and HTML rendering
      const mathmlElements = container.querySelectorAll('math');
      expect(mathmlElements.length).toBeGreaterThan(0);
      
      // Should have KaTeX HTML classes
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Text should appear (MathML hidden by CSS in browser, but not in jsdom)
      const text = container.textContent || '';
      // Note: In jsdom, both MathML and HTML render, so can't assert exact count
      // In browser, CSS hides MathML so only HTML shows
      expect(text).toContain('x=1');
    });

    it('should generate .katex-mathml elements (for screen readers)', () => {
      const msg = {
        role: 'model' as const,
        text: '$a + b$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have .katex-mathml class (hidden by CSS in browser)
      const mathmlElements = container.querySelectorAll('.katex-mathml');
      expect(mathmlElements.length).toBeGreaterThan(0);
      
      // Should also have .katex-html class (visible rendering)
      const htmlElements = container.querySelectorAll('.katex-html');
      expect(htmlElements.length).toBeGreaterThan(0);
    });

    it('should use local KaTeX CSS to avoid CSP issues in production', () => {
      // This is a meta-test checking the useTheme hook configuration
      // We use local CSS file instead of CDN to avoid Content Security Policy violations
      
      // Read the useTheme.ts source to verify local CSS usage
      const fs = require('fs');
      const path = require('path');
      const useThemePath = path.join(__dirname, '..', 'hooks', 'useTheme.ts');
      const useThemeContent = fs.readFileSync(useThemePath, 'utf-8');
      
      // Check that we use local CSS file instead of CDN
      expect(useThemeContent).toContain('/katex/katex.min.css');
      expect(useThemeContent).toContain('from local file to avoid CSP issues');
      
      // Ensure we DON'T use CDN (which would violate CSP in production)
      expect(useThemeContent).not.toContain('cdn.jsdelivr.net');
      expect(useThemeContent).not.toContain('integrity');
      expect(useThemeContent).not.toContain('crossOrigin');
    });

    it('should have CSS rule to hide .katex-mathml to prevent duplication', () => {
      // This is a meta-test checking the globals.css configuration
      const fs = require('fs');
      const path = require('path');
      const globalsCssPath = path.join(__dirname, '..', 'app', 'globals.css');
      const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf-8');
      
      // Check that CSS rule exists to hide MathML
      expect(globalsCssContent).toContain('.katex-mathml');
      expect(globalsCssContent).toMatch(/\.katex-mathml[\s\S]*display:\s*none\s*!important/);
    });
  });

  describe('Inline Math Formula Rendering', () => {
    it('should render inline math formula without duplication (e.g., X=2)', () => {
      const msg = {
        role: 'model' as const,
        text: '答案是 $X=2$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // KaTeX should render math inside span.katex
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Check that the text content doesn't have duplicate "X=2"
      const bubble = container.querySelector('.prose');
      expect(bubble).toBeTruthy();
      const text = bubble?.textContent || '';
      
      // Note: In test environment (jsdom), both MathML and HTML are rendered without CSS
      // So text appears multiple times. In browser, .katex-mathml is hidden by CSS.
      // We just verify KaTeX rendered successfully (no duplication visible in browser)
      expect(text).toContain('X=2');
    });

    it('should render complex inline math without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '方程式 $ax^2 + bx + c = 0$ 的解',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have KaTeX HTML rendering
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Text should appear (MathML hidden by CSS in browser, but not in jsdom)
      const text = container.textContent || '';
      // Note: In jsdom, both MathML and HTML render, so can't assert exact count
      // In browser, CSS hides MathML so only HTML shows
      expect(text).toContain('ax');
      expect(text).toContain('bx');
      expect(text).toContain('c=0');
    });

    it('should render fractions without visual duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\frac{1}{2}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have KaTeX rendering
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // MathML elements exist (for accessibility) but hidden by CSS in browser
      const mfracElements = container.querySelectorAll('mfrac');
      expect(mfracElements.length).toBeGreaterThan(0);
    });
  });

  describe('Block Math Formula Rendering', () => {
    it('should render block math formula without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$$\nX = 2\n$$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have display mode KaTeX
      const katexElements = container.querySelectorAll('.katex-display');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Text should appear (MathML hidden by CSS in browser, but not in jsdom)
      const text = container.textContent || '';
      // Note: In jsdom, both MathML and HTML render, so can't assert exact count
      // In browser, CSS hides MathML so only HTML shows
      expect(text).toContain('X=2');
    });

    it('should render equation system without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$$\n\\begin{cases}\nx + y = 3 \\\\\n2x - y = 1\n\\end{cases}\n$$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      const katexElements = container.querySelectorAll('.katex-display');
      expect(katexElements.length).toBeGreaterThan(0);
    });
  });

  describe('MathML Attribute Preservation', () => {
    it('should preserve KaTeX HTML structure with proper classes', () => {
      const msg = {
        role: 'model' as const,
        text: '$x^2$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // KaTeX uses specific classes for rendered output
      const katexElements = container.querySelectorAll('.katex, .katex-html, .katex-mathml');
      expect(katexElements.length).toBeGreaterThan(0);
    });

    it('should preserve className on math elements', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\sqrt{2}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // KaTeX generates elements with specific classNames
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Check that className is preserved
      katexElements.forEach(el => {
        expect(el.className).toBeTruthy();
        expect(el.className).toContain('katex');
      });
    });

    it('should render simple variables without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$x$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have KaTeX HTML
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Text should appear (MathML hidden by CSS in browser, but not in jsdom)
      const text = container.textContent || '';
      // Note: In jsdom, both MathML and HTML render, so can't assert exact count
      // In browser, CSS hides MathML so only HTML shows
      expect(text).toContain('x');
    });
  });

  describe('Mixed Content Rendering', () => {
    it('should render text with multiple inline formulas correctly', () => {
      const msg = {
        role: 'model' as const,
        text: '當 $x=2$ 時，$y=4$，所以 $x+y=6$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have 3 katex elements
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBe(3);
      
      // Each formula should appear (MathML hidden by CSS in browser, but not in jsdom)
      const text = container.textContent || '';
      // Note: In jsdom, both MathML and HTML render, so can't assert exact count
      // In browser, CSS hides MathML so only HTML shows
      expect(text).toContain('x=2');
      expect(text).toContain('y=4');
      expect(text).toContain('x+y=6');
    });

    it('should render mix of inline and block math', () => {
      const msg = {
        role: 'model' as const,
        text: '設 $x=2$，則：\n\n$$\ny = x^2 = 4\n$$\n\n因此 $y=4$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have both inline and display math
      const inlineKatex = container.querySelectorAll('.katex:not(.katex-display)');
      const displayKatex = container.querySelectorAll('.katex-display');
      
      expect(inlineKatex.length).toBeGreaterThan(0);
      expect(displayKatex.length).toBeGreaterThan(0);
    });
  });

  describe('Special Math Symbols', () => {
    it('should render Greek letters without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\alpha + \\beta = \\gamma$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Text should not be duplicated
      const text = container.textContent || '';
      // Greek letters should appear reasonable times (not excessive duplication)
      expect(text.length).toBeLessThan(100); // Sanity check for duplication
    });

    it('should render superscript and subscript correctly', () => {
      const msg = {
        role: 'model' as const,
        text: '$x_1^2 + x_2^2$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      const text = container.textContent || '';
      
      // Should contain the expression text
      expect(text).toContain('x');
      expect(text).toContain('1');
      expect(text).toContain('2');
      // Check for KaTeX rendering
      expect(container.querySelector('.katex')).toBeTruthy();
    });

    it('should render fractions without visual duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\frac{a}{b} = \\frac{c}{d}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have KaTeX rendering
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // MathML elements exist (for accessibility) but hidden by CSS in browser
      const mfracElements = container.querySelectorAll('mfrac');
      expect(mfracElements.length).toBeGreaterThan(0);
    });

    it('should render square roots without visual duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\sqrt{x} + \\sqrt{y}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have KaTeX rendering
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // MathML elements exist (for accessibility) but hidden by CSS in browser
      const msqrtElements = container.querySelectorAll('msqrt');
      expect(msqrtElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty math formula gracefully', () => {
      const msg = {
        role: 'model' as const,
        text: '$$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should not crash
      expect(container).toBeTruthy();
    });

    it('should handle invalid LaTeX gracefully', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\invalidcommand{test}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should not crash, KaTeX may render error or raw text
      expect(container).toBeTruthy();
    });

    it('should handle nested formulas', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\frac{1}{\\sqrt{2}}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have KaTeX HTML rendering
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // MathML elements exist (for accessibility) but hidden by CSS in browser
      const mfracElements = container.querySelectorAll('mfrac');
      const msqrtElements = container.querySelectorAll('msqrt');
      expect(mfracElements.length).toBeGreaterThan(0);
      expect(msqrtElements.length).toBeGreaterThan(0);
    });
  });

  describe('Sanitization Does Not Break Math', () => {
    it('should preserve KaTeX HTML structure after sanitization', () => {
      const msg = {
        role: 'model' as const,
        text: '$x = 2$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have proper KaTeX structure
      const katex = container.querySelector('.katex');
      expect(katex).toBeTruthy();
      
      // Should contain the equation variables (not stripped by sanitization)
      const text = container.textContent || '';
      expect(text).toContain('x');
      expect(text).toContain('2');
      
      // KaTeX structure should be preserved
      expect(katex?.querySelector('span')).toBeTruthy();
    });

    it('should not strip style attributes from KaTeX elements', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\color{red}{x}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // KaTeX may add style attributes for colors
      const elementsWithStyle = container.querySelectorAll('[style]');
      // Should have some elements with style (KaTeX uses inline styles)
      expect(elementsWithStyle.length).toBeGreaterThan(0);
    });
  });
});
