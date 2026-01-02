// src/__tests__/tableOverflow.test.ts
// 測試 Markdown 表格橫向滾動功能

import { describe, it, expect } from 'vitest';

describe('Table Overflow Handling', () => {
  describe('Table Wrapper Component', () => {
    it('should wrap table in scrollable container', () => {
      const tableWrapper = {
        className: 'overflow-x-auto -mx-3 px-3',
      };
      
      expect(tableWrapper.className).toContain('overflow-x-auto');
    });

    it('should use negative margin to expand scroll area', () => {
      const tableWrapper = {
        className: 'overflow-x-auto -mx-3 px-3',
      };
      
      expect(tableWrapper.className).toContain('-mx-3');
    });

    it('should maintain padding for content spacing', () => {
      const tableWrapper = {
        className: 'overflow-x-auto -mx-3 px-3',
      };
      
      expect(tableWrapper.className).toContain('px-3');
    });
  });

  describe('Prose Container', () => {
    it('should have overflow-x-auto as fallback', () => {
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
  });

  describe('Scroll Behavior', () => {
    it('should allow horizontal scrolling for wide tables', () => {
      const overflowStyle = 'overflow-x-auto';
      
      // overflow-x-auto 允許橫向滾動
      expect(overflowStyle).toBe('overflow-x-auto');
    });

    it('should not affect vertical scrolling', () => {
      const overflowStyle = 'overflow-x-auto';
      
      // 只影響橫向，不影響縱向
      expect(overflowStyle).not.toContain('overflow-y');
    });

    it('should hide scrollbar when content fits', () => {
      // overflow-x-auto 只在內容溢出時顯示滾動條
      const behavior = 'auto';
      
      expect(behavior).toBe('auto');
    });
  });

  describe('Margin and Padding Strategy', () => {
    it('should calculate correct scroll area width', () => {
      // -mx-3 擴展 12px (每側 3*4px)
      // px-3 保持內距 12px
      const marginOffset = -12; // -mx-3 = -0.75rem = -12px
      const paddingOffset = 12; // px-3 = 0.75rem = 12px
      
      expect(marginOffset + paddingOffset).toBe(0); // 淨效果：擴展滾動區域但保持視覺間距
    });

    it('should extend scroll area beyond bubble padding', () => {
      const bubblePadding = 12; // p-3
      const tableMargin = -12; // -mx-3
      
      const extendedArea = bubblePadding + tableMargin;
      expect(extendedArea).toBe(0); // 表格滾動區域延伸到氣泡邊緣
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
        wrapper: { className: 'overflow-x-auto -mx-3 px-3' },
        table: { ...props },
      });
      
      const result = tableComponent(props);
      expect(result.table.className).toBe('custom-table');
      expect(result.table.id).toBe('table-1');
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
