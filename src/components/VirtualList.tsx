'use client';
// Wrapper component for react-virtuoso Virtuoso (client-side only)
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { forwardRef } from 'react';

interface VirtualListProps {
  data: any[];
  itemContent: (index: number, item: any) => JSX.Element;
  style?: React.CSSProperties;
  atTopStateChange?: (atTop: boolean) => void;
  atBottomStateChange?: (atBottom: boolean) => void;
  components?: {
    Footer?: () => JSX.Element | null;
  };
}

const VirtualList = forwardRef<VirtuosoHandle, VirtualListProps>(
  ({ data, itemContent, style, atTopStateChange, atBottomStateChange, components }, ref) => {
    return (
      <Virtuoso
        ref={ref}
        data={data}
        itemContent={itemContent}
        style={style}
        atTopStateChange={atTopStateChange}
        atBottomStateChange={atBottomStateChange}
        components={components}
      />
    );
  }
);

VirtualList.displayName = 'VirtualList';

export default VirtualList;
