// Selection Toolbar component - Multi-message selection controls
import React from 'react';

interface SelectionToolbarProps {
  selectedMessages: Set<number>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onShare: () => void;
}

export const SelectionToolbar = ({
  selectedMessages,
  onSelectAll,
  onClearSelection,
  onShare,
}: SelectionToolbarProps) => {
  return (
    <div className="px-4 py-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-2">
      <button
        onClick={onSelectAll}
        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
      >
        全選
      </button>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          已選 {selectedMessages.size} 則
        </span>
        <button
          onClick={onClearSelection}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={onShare}
          disabled={selectedMessages.size === 0}
          className="px-4 py-2 text-sm font-medium bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          分享
        </button>
      </div>
    </div>
  );
};
