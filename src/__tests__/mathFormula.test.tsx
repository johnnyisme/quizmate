// src/__tests__/mathFormula.test.tsx
// Tests for KaTeX math formula rendering with proper plugin order

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

describe('KaTeX Math Formula Rendering', () => {
  const rehypePlugins = [
    rehypeRaw,
    // First sanitize, then process KaTeX (so KaTeX output is trusted)
    [rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'style'],
      },
      tagNames: [
        ...(defaultSchema.tagNames || []),
        'div', 'span', 'annotation', 'semantics',
      ],
    }],
    [rehypeKatex, { output: 'htmlAndMathml', strict: false, trust: true }],
  ] as any;

  const remarkPlugins = [remarkMath];

  describe('根号符號渲染', () => {
    it('should render square root symbol correctly', () => {
      const markdown = '根號2：$\\sqrt{2}$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      // KaTeX should generate elements with katex classes
      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
    });

    it('should render cube root correctly', () => {
      const markdown = '立方根：$\\sqrt[3]{8}$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
    });

    it('should render complex square root expression', () => {
      const markdown = '$\\sqrt{x^2 + y^2}$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
    });
  });

  describe('其他數學符號', () => {
    it('should render fractions correctly', () => {
      const markdown = '分數：$\\frac{1}{2}$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
    });

    it('should render superscripts and subscripts', () => {
      const markdown = '上下標：$x^2$, $x_i$, $x_i^2$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
    });

    it('should render summation and integration', () => {
      const markdown = '$$\\int_0^1 x^2 dx = \\sum_{i=1}^n i$$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
    });

    it('should render matrices', () => {
      const markdown = '$$\\begin{matrix} a & b \\\\ c & d \\end{matrix}$$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
    });
  });

  describe('插件順序測試', () => {
    it('should process sanitize before katex', () => {
      // This ensures KaTeX output is not filtered by sanitize
      const markdown = '根號：$\\sqrt{2}$ 和分數：$\\frac{3}{4}$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      // Should have multiple katex elements (one for each formula)
      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should preserve KaTeX classes after sanitization', () => {
      const markdown = '$\\sqrt{x}$';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      // KaTeX classes should be preserved (not stripped by sanitize)
      const katexElements = container.querySelectorAll('[class*="katex"]');
      expect(katexElements.length).toBeGreaterThan(0);
      
      // Check if classes are actually present
      const firstElement = katexElements[0];
      expect(firstElement.className).toMatch(/katex/);
    });
  });

  describe('實際問題案例', () => {
    it('should render AB length formula correctly', () => {
      // Real-world example from user's issue
      const markdown = '所以 $x=5+\\sqrt{5}$。答案：AB 的長為 $5+\\sqrt{5}$。';
      
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {markdown}
        </ReactMarkdown>
      );

      const katexElements = container.querySelectorAll('[class*="katex"]');
      // Should have 2 math formulas
      expect(katexElements.length).toBeGreaterThanOrEqual(2);
      
      // Check that katex classes are present (indicates proper rendering)
      const firstKatex = katexElements[0];
      expect(firstKatex.className).toMatch(/katex/);
    });
  });
});
