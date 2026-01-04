// Error Display component - Collapsible error messages with suggestions
import React from 'react';

interface ErrorDisplayProps {
  error: { message: string; suggestion?: string; technicalDetails?: string } | null;
  showErrorSuggestion: boolean;
  showTechnicalDetails: boolean;
  errorSuggestionRef: React.RefObject<HTMLDivElement | null>;
  errorTechnicalRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onToggleSuggestion: () => void;
  onToggleTechnicalDetails: () => void;
}

export const ErrorDisplay = ({
  error,
  showErrorSuggestion,
  showTechnicalDetails,
  errorSuggestionRef,
  errorTechnicalRef,
  onClose,
  onToggleSuggestion,
  onToggleTechnicalDetails,
}: ErrorDisplayProps) => {
  if (!error) return null;

  return (
    <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg relative">
      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded text-red-600 dark:text-red-400 transition-colors"
        title="關閉"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex items-start justify-between gap-2 pr-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-700 dark:text-red-400 text-sm font-semibold leading-5">{error.message}</p>
          </div>
          
          {/* 第一層：建議 */}
          {error.suggestion && showErrorSuggestion && (
            <div ref={errorSuggestionRef} className="mt-2 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded border border-red-300 dark:border-red-700 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans leading-relaxed">{error.suggestion}</pre>
              
              {/* 第二層：原始錯誤 */}
              {error.technicalDetails && (
                <div className="mt-3">
                  <button
                    onClick={onToggleTechnicalDetails}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline flex items-center gap-1"
                  >
                    {showTechnicalDetails ? "隱藏" : "查看"}原始錯誤訊息
                    <svg 
                      className={`w-3 h-3 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showTechnicalDetails && (
                    <div ref={errorTechnicalRef} className="mt-2 p-2 bg-red-200 dark:bg-red-950/50 rounded border border-red-400 dark:border-red-800 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap break-words font-mono">{error.technicalDetails}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 第一層展開按鈕 */}
        {error.suggestion && (
          <button
            onClick={onToggleSuggestion}
            className="flex-shrink-0 p-1.5 hover:bg-red-100 dark:hover:bg-red-800/50 rounded text-red-600 dark:text-red-400 transition-colors"
            title={showErrorSuggestion ? "隱藏建議" : "查看建議"}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${showErrorSuggestion ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
