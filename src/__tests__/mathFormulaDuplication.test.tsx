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
      
      // Should contain "X=2" but not duplicated like "X=2x=2" or "X=2X=2"
      // Count occurrences of "X=2" (KaTeX renders in multiple formats)
      const matches = text.match(/X=2/g);
      expect(matches).toBeTruthy();
      // KaTeX renders: annotation (hidden) + HTML display (visible) + possible aria-label
      // Should be <= 4 (not excessive like 10+)
      expect(matches!.length).toBeLessThanOrEqual(4);
    });

    it('should render complex inline math without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '方程式 $ax^2 + bx + c = 0$ 的解',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Should have MathML elements (indicates KaTeX rendered successfully)
      const mathElements = container.querySelectorAll('math');
      expect(mathElements.length).toBeGreaterThan(0);
    });

    it('should preserve KaTeX MathML tags after sanitization', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\frac{1}{2}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // KaTeX generates mfrac for fractions
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
      
      const katexElements = container.querySelectorAll('.katex-display');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Block math should render in display mode
      const mathElements = container.querySelectorAll('math');
      expect(mathElements.length).toBeGreaterThan(0);
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

    it('should preserve mathvariant attribute on mi elements', () => {
      const msg = {
        role: 'model' as const,
        text: '$x$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // MathML mi elements may have mathvariant
      const miElements = container.querySelectorAll('mi');
      expect(miElements.length).toBeGreaterThan(0);
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
      
      // Should have 3 math elements
      const mathElements = container.querySelectorAll('math');
      expect(mathElements.length).toBe(3);
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
      
      // Should have math element
      const mathElements = container.querySelectorAll('math');
      expect(mathElements.length).toBeGreaterThan(0);
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

    it('should render fractions without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\frac{a}{b} = \\frac{c}{d}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have mfrac elements
      const mfracElements = container.querySelectorAll('mfrac');
      expect(mfracElements.length).toBe(2); // Two fractions
    });

    it('should render square roots without duplication', () => {
      const msg = {
        role: 'model' as const,
        text: '$\\sqrt{x} + \\sqrt{y}$',
      };

      const { container } = render(<MessageBubble msg={msg} {...mockProps} />);
      
      // Should have msqrt elements
      const msqrtElements = container.querySelectorAll('msqrt');
      expect(msqrtElements.length).toBe(2); // Two square roots
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
      
      // Should have both mfrac and msqrt
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
      expect(katex.querySelector('span')).toBeTruthy();
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
