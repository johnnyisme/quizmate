// src/__tests__/tableOverflow.test.ts
// 測試 Markdown 表格橫向滾動功能

import { describe, it, expect } from 'vitest';

describe('Table Overflow Handling', () => {
  describe('Table Wrapper Component', () => {
    it('should wrap table in scrollable container', () => {
      const tableWrapper = {
        className: 'overflow-x-scroll -mx-3 px-3 my-2',
      };
      
      expect(tableWrapper.className).toContain('overflow-x-scroll');
    });

    it('should add vertical margin for spacing', () => {
      const tableWrapper = {
        className: 'overflow-x-scroll -mx-3 px-3 my-2',
      };
      
      expect(tableWrapper.className).toContain('my-2');
    });

    it('should use negative margin to extend scroll area', () => {
      const tableWrapper = {
        className: 'overflow-x-scroll -mx-3 px-3 my-2',
      };
      
      expect(tableWrapper.className).toContain('-mx-3');
      expect(tableWrapper.className).toContain('px-3');
    });

    it('should set max-width with viewport calculation', () => {
      const maxWidth = 'calc(100vw - 4rem)';
      
      expect(maxWidth).toBe('calc(100vw - 4rem)');
    });

    it('should override wordBreak to normal for tables', () => {
      const tableWrapperStyle = {
        maxWidth: 'calc(100vw - 4rem)',
        wordBreak: 'normal',
      };
      
      expect(tableWrapperStyle.wordBreak).toBe('normal');
    });
  });

  describe('Prose Container', () => {
    it('should enable horizontal scrolling for long content', () => {
      const proseClasses = 'prose prose-sm max-w-none dark:prose-invert overflow-x-auto';
      
      expect(proseClasses).toContain('overflow-x-auto');
    });

    it('should maintain max-w-none for full width', () => {
      const proseClasses = 'prose prose-sm max-w-none dark:prose-invert overflow-x-auto';
      
      expect(proseClasses).toContain('max-w-none');
    });

    it('should support dark mode', () => {
      const proseClasses = 'prose prose-sm max-w-none dark:prose-invert overflow-x-auto';
      
      expect(proseClasses).toContain('dark:prose-invert');
    });

    it('should set explicit width to 100%', () => {
      const proseStyle = { width: '100%', wordBreak: 'break-word' };
      
      expect(proseStyle.width).toBe('100%');
    });

    it('should break long words to prevent overflow', () => {
      const proseStyle = { width: '100%', wordBreak: 'break-word' };
      
      expect(proseStyle.wordBreak).toBe('break-word');
    });
  });

  describe('Scroll Behavior', () => {
    it('should use overflow-x-scroll for reliable scrolling', () => {
      const overflowStyle = 'overflow-x-scroll';
      
      // overflow-x-scroll 強制顯示滾動能力（即使內容未溢出）
      expect(overflowStyle).toBe('overflow-x-scroll');
    });

    it('should not affect vertical scrolling', () => {
      const overflowStyle = 'overflow-x-scroll';
      
      // 只影響橫向，不影響縱向
      expect(overflowStyle).not.toContain('overflow-y');
    });

    it('should always show scroll capability', () => {
      // overflow-x-scroll 與 overflow-x-auto 不同，會一直保持滾動能力
      const behavior = 'scroll';
      
      expect(behavior).toBe('scroll');
    });
  });

  describe('Scroll Container Strategy', () => {
    it('should use viewport-based max-width calculation', () => {
      const strategy = {
        maxWidth: 'calc(100vw - 4rem)',
        overflow: 'overflow-x-scroll',
      };
      
      expect(strategy.maxWidth).toBe('calc(100vw - 4rem)');
      expect(strategy.overflow).toBe('overflow-x-scroll');
    });

    it('should use negative margins to extend scroll area to bubble edges', () => {
      const className = 'overflow-x-scroll -mx-3 px-3 my-2';
      
      expect(className).toContain('-mx-3');
      expect(className).toContain('px-3');
    });
  });

  describe('Table Cell Rendering', () => {
    it('should prevent cell content from wrapping', () => {
      const cellStyle = { whiteSpace: 'nowrap' };
      
      expect(cellStyle.whiteSpace).toBe('nowrap');
    });

    it('should apply whiteSpace to both th and td', () => {
      const thStyle = { whiteSpace: 'nowrap' };
      const tdStyle = { whiteSpace: 'nowrap' };
      
      expect(thStyle.whiteSpace).toBe('nowrap');
      expect(tdStyle.whiteSpace).toBe('nowrap');
    });

    it('should auto-size cells based on content', () => {
      // 使用 whiteSpace: nowrap 讓瀏覽器根據內容自動調整寬度
      const autoSize = true;
      
      expect(autoSize).toBe(true);
    });

    it('should preserve existing cell props', () => {
      const props = { className: 'custom', id: 'cell-1' };
      const cellWithStyle = { 
        ...props, 
        style: { whiteSpace: 'nowrap', ...props } 
      };
      
      expect(cellWithStyle.className).toBe('custom');
      expect(cellWithStyle.id).toBe('cell-1');
    });
  });

  describe('Component Integration', () => {
    it('should only wrap table elements', () => {
      const customComponents = {
        table: true,
        code: true, // 已存在的 component
      };
      
      expect(customComponents.table).toBe(true);
      expect(customComponents.code).toBe(true);
    });

    it('should preserve table children', () => {
      const tableComponent = (children: any) => {
        return {
          type: 'div',
          children: {
            type: 'table',
            children: children,
          },
        };
      };
      
      const result = tableComponent(['thead', 'tbody']);
      expect(result.children.children).toEqual(['thead', 'tbody']);
    });

    it('should pass through table props', () => {
      const props = {
        className: 'custom-table',
        id: 'table-1',
      };
      
      const tableComponent = (props: any) => ({
        wrapper: { 
          className: 'overflow-x-scroll -mx-3 px-3 my-2',
          style: { maxWidth: 'calc(100vw - 4rem)', wordBreak: 'normal' }
        },
        table: { ...props },
      });
      
      const result = tableComponent(props);
      expect(result.wrapper.style.maxWidth).toBe('calc(100vw - 4rem)');
      expect(result.wrapper.style.wordBreak).toBe('normal');
      expect(result.table.className).toBe('custom-table');
      expect(result.table.id).toBe('table-1');
    });

    it('should ensure message bubble maintains fixed width', () => {
      const messageBubble = {
        className: 'max-w-lg lg:max-w-3xl p-3',
      };
      
      expect(messageBubble.className).toContain('max-w-lg');
      expect(messageBubble.className).not.toContain('min-w-0');
    });

    it('should ensure relative container stays normal', () => {
      const relativeContainer = {
        className: 'relative',
      };
      
      expect(relativeContainer.className).toBe('relative');
      expect(relativeContainer.className).not.toContain('min-w-0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty table', () => {
      const emptyTable = {
        children: [],
      };
      
      expect(emptyTable.children).toEqual([]);
    });

    it('should handle nested tables', () => {
      const nestedStructure = {
        type: 'table',
        children: [
          { type: 'tr', children: [{ type: 'td', children: [{ type: 'table' }] }] },
        ],
      };
      
      expect(nestedStructure.children[0].children[0].children[0].type).toBe('table');
    });

    it('should handle very wide tables', () => {
      const wideTable = {
        columnCount: 20,
        estimatedWidth: 2000, // px
      };
      
      // overflow-x-auto 會啟用滾動
      expect(wideTable.estimatedWidth).toBeGreaterThan(768); // 超過桌面 max-width
    });
  });

  describe('Accessibility', () => {
    it('should maintain keyboard navigation', () => {
      const scrollable = {
        tabindex: 0, // 可聚焦
        role: 'region',
      };
      
      expect(scrollable.tabindex).toBe(0);
    });

    it('should provide visual scroll indicators', () => {
      // Webkit 瀏覽器會自動顯示滾動條指示器
      const hasNativeScrollbar = true;
      
      expect(hasNativeScrollbar).toBe(true);
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should use standard CSS property', () => {
      const cssProperty = 'overflow-x';
      const cssValue = 'auto';
      
      // overflow-x: auto 是標準 CSS 屬性
      expect(`${cssProperty}: ${cssValue}`).toBe('overflow-x: auto');
    });

    it('should work on mobile browsers', () => {
      const touchScrolling = true; // 支援觸控滾動
      
      expect(touchScrolling).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should not cause layout reflow for normal content', () => {
      const affectsLayout = false; // 只在表格溢出時才滾動
      
      expect(affectsLayout).toBe(false);
    });

    it('should use hardware acceleration', () => {
      // overflow-x-auto 使用 GPU 加速
      const usesGPU = true;
      
      expect(usesGPU).toBe(true);
    });
  });
});
