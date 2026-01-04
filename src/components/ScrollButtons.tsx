// Scroll Buttons component - Smart scroll to top/bottom buttons
import React from 'react';

interface ScrollButtonsProps {
  showScrollToTop: boolean;
  showScrollToBottom: boolean;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
}

export const ScrollButtons = ({
  showScrollToTop,
  showScrollToBottom,
  onScrollToTop,
  onScrollToBottom,
}: ScrollButtonsProps) => {
  if (!showScrollToTop && !showScrollToBottom) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
      {/* Scroll to Top Button */}
      <button
        onClick={onScrollToTop}
        className={`w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/30 lg:bg-white/90 dark:bg-gray-800/30 dark:lg:bg-gray-800/90 lg:backdrop-blur-sm hover:bg-white/50 lg:hover:bg-white dark:hover:bg-gray-800/50 dark:lg:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${!showScrollToTop ? 'opacity-0 invisible pointer-events-none' : ''}`}
        title="回到頂部"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
        </svg>
      </button>

      {/* Scroll to Bottom Button */}
      <button
        onClick={onScrollToBottom}
        className={`w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/30 lg:bg-white/90 dark:bg-gray-800/30 dark:lg:bg-gray-800/90 lg:backdrop-blur-sm hover:bg-white/50 lg:hover:bg-white dark:hover:bg-gray-800/50 dark:lg:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${!showScrollToBottom ? 'opacity-0 invisible pointer-events-none' : ''}`}
        title="跳到最新"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
};
