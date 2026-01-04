// Header component - Top navigation bar
import { ModelType, ThinkingMode, CustomPrompt } from '@/hooks/useSettingsState';
import { truncatePromptName } from '@/utils/fileUtils';

interface HeaderProps {
  showSidebar: boolean;
  selectedPromptId: string;
  selectedModel: ModelType;
  thinkingMode: ThinkingMode;
  prompts: CustomPrompt[];
  isDark: boolean;
  onToggleSidebar: () => void;
  onPromptChange: (promptId: string) => void;
  onModelChange: (model: ModelType) => void;
  onThinkingModeChange: (mode: ThinkingMode) => void;
  onOpenSettings: () => void;
}

export const Header = ({
  showSidebar,
  selectedPromptId,
  selectedModel,
  thinkingMode,
  prompts,
  isDark,
  onToggleSidebar,
  onPromptChange,
  onModelChange,
  onThinkingModeChange,
  onOpenSettings,
}: HeaderProps) => {
  return (
    <div className="px-1 sm:px-2 py-2 border-b dark:border-gray-700 flex-shrink-0 flex flex-row items-center gap-1 relative z-10 bg-white dark:bg-gray-800 overflow-x-auto">
      {/* Left cluster: menu + logo */}
      <div className="flex items-center gap-1 flex-shrink-0 min-w-[48px]">
        <button 
          onClick={onToggleSidebar}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
          title={showSidebar ? "收起側邊欄" : "開啟側邊欄"}
        >
          {showSidebar ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="dark:stop-color-blue-400" style={{stopColor: '#60A5FA'}} />
                <stop offset="100%" className="dark:stop-color-purple-500" style={{stopColor: '#A78BFA'}} />
              </linearGradient>
            </defs>
            {/* Robot head */}
            <rect x="25" y="30" width="50" height="45" rx="8" fill="url(#robotGradient)" />
            {/* Antenna */}
            <line x1="50" y1="30" x2="50" y2="20" stroke="url(#robotGradient)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="17" r="4" fill="url(#robotGradient)" />
            {/* Eyes */}
            <circle cx="40" cy="45" r="5" fill="white" opacity="0.9" />
            <circle cx="60" cy="45" r="5" fill="white" opacity="0.9" />
            <circle cx="41" cy="45" r="2.5" fill="#1E293B" />
            <circle cx="61" cy="45" r="2.5" fill="#1E293B" />
            {/* Smile */}
            <path d="M 38 58 Q 50 65 62 58" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
            {/* Ears */}
            <rect x="18" y="42" width="7" height="12" rx="3" fill="url(#robotGradient)" opacity="0.8" />
            <rect x="75" y="42" width="7" height="12" rx="3" fill="url(#robotGradient)" opacity="0.8" />
          </svg>
        </div>
      </div>

      {/* Right cluster: selectors and actions */}
      <div className="flex items-center gap-0.5 flex-1 justify-end flex-nowrap">
        <select 
          value={selectedPromptId}
          onChange={(e) => onPromptChange(e.target.value)}
          className={`px-1 py-1 text-xs rounded border h-7 transition-colors ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          title="選擇 Prompt"
        >
          {prompts.map(p => (
            <option key={p.id} value={p.id}>{truncatePromptName(p.name)}</option>
          ))}
        </select>

        <select 
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
          className={`px-1 py-1 text-xs rounded border h-7 transition-colors ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          title="選擇 AI 模型"
        >
          <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
        </select>

        {selectedModel.includes("gemini-3") && (
          <select
            value={thinkingMode}
            onChange={(e) => onThinkingModeChange(e.target.value as ThinkingMode)}
            className={`px-1 py-1 text-xs rounded border h-7 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            title="推理/快速（Thinking: high; 不支援會自動回退）"
          >
            <option value="fast">快速</option>
            <option value="thinking">推理</option>
          </select>
        )}
        
        <button 
          onClick={onOpenSettings}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
          title="設定"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>
    </div>
  );
};
