import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Session } from '@/lib/db';

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  editingSessionId: string | null;
  editingTitle: string;
  editingContainerRef: React.RefObject<HTMLDivElement>;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onStartEditTitle: (sessionId: string, currentTitle: string, e: React.MouseEvent) => void;
  onSaveTitle: (sessionId: string) => void;
  onCancelEdit: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent, sessionId: string) => void;
  setEditingTitle: (title: string) => void;
  isDark: boolean;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  editingSessionId,
  editingTitle,
  editingContainerRef,
  onSwitchSession,
  onDeleteSession,
  onStartEditTitle,
  onSaveTitle,
  onCancelEdit,
  onTitleKeyDown,
  setEditingTitle,
  isDark,
}) => {
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const s = sessions[index];
    
    return (
      <div style={style} className="px-2 py-1">
        <div 
          onClick={() => editingSessionId !== s.id && onSwitchSession(s.id)} 
          className={`group p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentSessionId === s.id ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {editingSessionId === s.id ? (
                <div ref={editingContainerRef} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => onTitleKeyDown(e, s.id)}
                    maxLength={30}
                    autoFocus
                    className="flex-1 min-w-0 text-sm font-medium bg-white dark:bg-gray-800 border border-blue-500 dark:border-blue-400 rounded px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSaveTitle(s.id); }} 
                    className="p-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex-shrink-0"
                    title="保存"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCancelEdit(); }} 
                    className="p-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0"
                    title="取消"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(s.updatedAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
                </>
              )}
            </div>
            {editingSessionId !== s.id && (
              <div className="flex items-center gap-1 transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                <button 
                  onClick={(e) => onStartEditTitle(s.id, s.title, e)} 
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-500 dark:text-blue-400 transition-colors"
                  title="編輯標題"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => onDeleteSession(s.id, e)} 
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-colors"
                  title="刪除對話"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [sessions, currentSessionId, editingSessionId, editingTitle, editingContainerRef, onSwitchSession, onDeleteSession, onStartEditTitle, onSaveTitle, onCancelEdit, onTitleKeyDown, setEditingTitle]);

  return (
    <List
      height={window.innerHeight - 180} // Subtract header + new chat button height
      itemCount={sessions.length}
      itemSize={100} // Height per session item (adjusted for padding)
      width="100%"
    >
      {Row}
    </List>
  );
};

export default React.memo(SessionList);
