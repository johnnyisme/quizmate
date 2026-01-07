import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  hasImage: boolean;
  hasHistory: boolean;
  onUploadClick: () => void;
  onCameraClick: () => void;
  disabled?: boolean;
}

export const ChatInput = React.memo<ChatInputProps>(({
  onSubmit,
  isLoading,
  hasImage,
  hasHistory,
  onUploadClick,
  onCameraClick,
  disabled = false,
}) => {
  const [localPrompt, setLocalPrompt] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自動調整高度
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 22;
      const maxHeight = lineHeight * 3; // 3 行
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalPrompt(e.target.value);
    adjustHeight();
  };

  const handleSubmit = () => {
    if (!localPrompt.trim() && !hasImage) return;
    if (isLoading || disabled) return;
    
    onSubmit(localPrompt.trim());
    setLocalPrompt('');
    
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  };

  const handleFocus = () => {
    setInputFocused(true);
    if (textareaRef.current && localPrompt) {
      adjustHeight();
    }
  };

  const handleBlur = () => {
    setInputFocused(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Desktop: Enter 提交, Shift+Enter 换行
    // Mobile: 保持原有行为（Enter 换行）
    if (e.key === 'Enter' && !e.shiftKey) {
      // 检测是否为桌面设备（窗口宽度 >= 1024px）
      const isDesktop = window.innerWidth >= 1024;
      
      if (isDesktop) {
        e.preventDefault(); // 阻止默认换行
        handleSubmit();
      }
      // Mobile: 不阻止，允许换行
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button 
        title="上傳考卷" 
        onClick={onUploadClick} 
        className={`flex-shrink-0 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 overflow-hidden ${inputFocused ? 'w-0 opacity-0 pointer-events-none' : 'w-9 opacity-100'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </button>
      <button 
        title="拍照" 
        onClick={onCameraClick} 
        className={`flex-shrink-0 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 overflow-hidden ${inputFocused ? 'w-0 opacity-0 pointer-events-none' : 'w-9 opacity-100'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>
      <textarea
        ref={textareaRef}
        id="prompt-input"
        name="prompt"
        value={localPrompt}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={hasHistory ? "進行追問..." : "輸入問題或上傳圖片"}
        rows={1}
        disabled={disabled}
        className="flex-1 min-w-0 px-3 py-1.5 text-base border dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-shadow resize-none overflow-y-auto leading-5 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: '36px', maxHeight: '66px' }}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || disabled || (!localPrompt.trim() && !hasImage)}
        className="flex-shrink-0 h-9 px-3 sm:px-4 text-sm bg-blue-500 dark:bg-blue-600 text-white rounded-full font-semibold whitespace-nowrap hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        傳送
      </button>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
