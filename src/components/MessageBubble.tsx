import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

type DisplayMessage = {
  role: "user" | "model";
  text: string;
  image?: string;
};

interface MessageBubbleProps {
  msg: DisplayMessage;
  index: number;
  isLastUserMessage: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  copiedMessageIndex: number | null;
  isDark: boolean;
  onToggleSelect: (index: number) => void;
  onCopyMessage: (text: string, index: number) => void;
  onEnterShareMode: (index: number) => void;
  onLongPressStart: (index: number) => void;
  onLongPressEnd: () => void;
  onImagePreview: (imageUrl: string) => void;
}

const MessageBubble = React.memo(
  React.forwardRef<HTMLDivElement, MessageBubbleProps>(({
    msg,
    index,
    isLastUserMessage,
    isSelectMode,
    isSelected,
    copiedMessageIndex,
    isDark,
    onToggleSelect,
    onCopyMessage,
    onEnterShareMode,
    onLongPressStart,
    onLongPressEnd,
    onImagePreview,
  }, ref) => {

  // Memoize rehype plugins configuration
  const rehypePlugins = useMemo(() => [
    rehypeRaw,
    [rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        '*': ['className', 'style'],
        span: ['className', 'style'],
        div: ['className', 'style'],
      },
      tagNames: [
        ...(defaultSchema.tagNames || []),
        'div', 'span', 'br', 'hr',
      ],
    }],
    rehypeKatex,
  ] as any, []);

  // Memoize remark plugins configuration
  const remarkPlugins = useMemo(() => [remarkMath, remarkGfm], []);

  // Memoize ReactMarkdown components
  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="overflow-x-auto -mx-3 px-3 my-2" style={{ maxWidth: 'calc(100vw - 4rem)' }}>
          <SyntaxHighlighter
            style={isDark ? oneDark : oneLight}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    table({ node, children, ...props }: any) {
      return (
        <div className="overflow-x-scroll -mx-3 px-3 my-2" style={{ maxWidth: 'calc(100vw - 4rem)', wordBreak: 'normal' }}>
          <table {...props}>{children}</table>
        </div>
      );
    },
    th({ node, children, ...props }: any) {
      return (
        <th {...props} style={{ whiteSpace: 'nowrap', ...props.style }}>
          {children}
        </th>
      );
    },
    td({ node, children, ...props }: any) {
      return (
        <td {...props} style={{ whiteSpace: 'nowrap', ...props.style }}>
          {children}
        </td>
      );
    },
  }), [isDark]);

  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
      <div className="flex items-start gap-2">
        {/* 選取框 - 僅在選取模式時顯示 */}
        {isSelectMode && (
          <button
            onClick={() => onToggleSelect(index)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center mt-3 transition-all ${
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
            }`}
            aria-label={isSelected ? '取消選取' : '選取此訊息'}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}
        
        <div className="relative">
          <div 
            ref={isLastUserMessage ? ref : null}
            onTouchStart={() => !isSelectMode && onLongPressStart(index)}
            onTouchEnd={onLongPressEnd}
            onTouchMove={onLongPressEnd}
            onClick={() => isSelectMode && onToggleSelect(index)}
            className={`max-w-lg lg:max-w-3xl p-3 rounded-lg shadow-md cursor-pointer transition-all ${
              isSelected 
                ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' 
                : ''
            } ${msg.role === 'user' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
            style={isLastUserMessage ? { scrollMarginTop: '16px' } : undefined}
          >
            {msg.image && (
              <img 
                src={msg.image} 
                alt="User upload" 
                className="rounded-lg mb-2 max-h-60 cursor-pointer hover:opacity-90 transition-opacity" 
                onClick={() => onImagePreview(msg.image!)}
              />
            )}
            <div className="prose prose-sm max-w-none dark:prose-invert overflow-x-auto" style={{ width: '100%', wordBreak: 'break-word' }}>
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
                components={markdownComponents}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
          
          {/* 複製和分享按鈕 - 泡泡外右下方，選取模式時隱藏 */}
          {!isSelectMode && (
            <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
              {/* 分享按鈕（桌面端顯示，在左邊） */}
              <button
                onClick={() => onEnterShareMode(index)}
                className="hidden lg:block p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg opacity-0 lg:group-hover:opacity-100 transition-all border border-gray-200 dark:border-gray-600"
                title="選取訊息以分享"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              
              {/* 複製按鈕（在右邊） */}
              <button
                onClick={() => onCopyMessage(msg.text, index)}
                className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all border border-gray-200 dark:border-gray-600"
                title={copiedMessageIndex === index ? "已複製！" : "複製內容"}
              >
                {copiedMessageIndex === index ? (
                  <svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  })
);

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
