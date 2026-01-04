// Chat Area component - Messages display area
import React, { useMemo } from 'react';
import MessageBubble from './MessageBubble';
import { DisplayMessage } from '@/hooks/useChatState';

interface ChatAreaProps {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  lastUserMessageRef: React.RefObject<HTMLDivElement | null>;
  displayConversation: DisplayMessage[];
  selectedMessages: Set<number>;
  copiedMessageIndex: number | null;
  isSelectMode: boolean;
  isLoading: boolean;
  imageUrl: string;
  isDark: boolean;
  onUploadClick: () => void;
  onToggleMessageSelect: (index: number) => void;
  onCopyMessage: (text: string, index: number) => void;
  onEnterShareMode: (index: number) => void;
  onLongPressStart: (index: number) => void;
  onLongPressEnd: () => void;
  onImagePreview: (imageUrl: string) => void;
}

export const ChatArea = ({
  chatContainerRef,
  lastUserMessageRef,
  displayConversation,
  selectedMessages,
  copiedMessageIndex,
  isSelectMode,
  isLoading,
  imageUrl,
  isDark,
  onUploadClick,
  onToggleMessageSelect,
  onCopyMessage,
  onEnterShareMode,
  onLongPressStart,
  onLongPressEnd,
  onImagePreview,
}: ChatAreaProps) => {
  return (
    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
      {displayConversation.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center w-full max-w-md h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2"/>
            ) : (
              <div className="flex flex-col items-center justify-center p-5 text-center">
                <svg className="w-10 h-10 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                <p className="font-semibold">點擊上傳題目照片</p>
                <p className="text-xs mt-1">或從相簿選擇</p>
              </div>
            )}
          </div>
          <p className="mt-4">可以上傳圖片、輸入文字，或兩者皆可</p>
        </div>
      )}

      <div className="space-y-4">
        {(() => {
          // ✅ Optimize: calculate lastUserMessageIndex once using useMemo
          const lastUserMessageIndex = useMemo(() => {
            for (let i = displayConversation.length - 1; i >= 0; i--) {
              if (displayConversation[i].role === 'user') {
                return i;
              }
            }
            return -1;
          }, [displayConversation]);
          
          return displayConversation.map((msg, index) => {
            const isLastUserMessage = msg.role === 'user' && index === lastUserMessageIndex;
            const isSelected = selectedMessages.has(index);
          
          return (
            <MessageBubble
              key={index}
              ref={isLastUserMessage ? lastUserMessageRef : null}
              msg={msg}
              index={index}
              isLastUserMessage={isLastUserMessage}
              isSelectMode={isSelectMode}
              isSelected={isSelected}
              copiedMessageIndex={copiedMessageIndex}
              isDark={isDark}
              onToggleSelect={onToggleMessageSelect}
              onCopyMessage={onCopyMessage}
              onEnterShareMode={onEnterShareMode}
              onLongPressStart={onLongPressStart}
              onLongPressEnd={onLongPressEnd}
              onImagePreview={onImagePreview}
            />
          );
        });
        })()}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-lg lg:max-w-3xl p-3 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-gray-800/95 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8">
                  <defs>
                    <linearGradient id="robotGradientThinking" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#60A5FA'}} />
                      <stop offset="100%" style={{stopColor: '#A78BFA'}} />
                    </linearGradient>
                  </defs>
                  <rect x="25" y="30" width="50" height="45" rx="8" fill="url(#robotGradientThinking)" />
                  <line x1="50" y1="30" x2="50" y2="20" stroke="url(#robotGradientThinking)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="50" cy="17" r="4" fill="url(#robotGradientThinking)" />
                  <circle cx="40" cy="45" r="5" fill="white" opacity="0.9" />
                  <circle cx="60" cy="45" r="5" fill="white" opacity="0.9" />
                  <circle cx="41" cy="45" r="2.5" fill="#1E293B" />
                  <circle cx="61" cy="45" r="2.5" fill="#1E293B" />
                  <path d="M 38 58 Q 50 65 62 58" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                  <rect x="18" y="42" width="7" height="12" rx="3" fill="url(#robotGradientThinking)" opacity="0.8" />
                  <rect x="75" y="42" width="7" height="12" rx="3" fill="url(#robotGradientThinking)" opacity="0.8" />
                </svg>
              </div>
              <p className="text-sm animate-pulse">AI 正在思考中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
