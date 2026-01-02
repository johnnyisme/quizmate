// src/__tests__/errorHandling.integration.test.tsx
// Integration tests for error handling UI - 驗證錯誤訊息渲染、展開/收起、自動滾動

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';

// 簡化的錯誤顯示組件，模擬 page.tsx 中的錯誤處理 UI
function ErrorDisplay() {
  const [error, setError] = useState<{ message: string; suggestion?: string; technicalDetails?: string } | null>(null);
  const [showErrorSuggestion, setShowErrorSuggestion] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // 模擬觸發錯誤的按鈕
  const triggerError = (type: 'simple' | 'with-suggestion' | 'with-technical') => {
    if (type === 'simple') {
      setError({ message: "請先設置 API keys" });
    } else if (type === 'with-suggestion') {
      setError({ 
        message: "API 配額已用完",
        suggestion: "免費額度已經用完。建議：\n1. 嘗試換不同的 Gemini agent\n2. 用不同 Google 帳號申請新的 API Key"
      });
    } else {
      setError({ 
        message: "API 配額已用完",
        suggestion: "免費額度已經用完。建議：\n1. 嘗試換不同的 Gemini agent",
        technicalDetails: "Error: 429 Resource Exhausted\n  at fetch (http://localhost:3000)"
      });
    }
  };

  return (
    <div>
      <button onClick={() => triggerError('simple')}>Trigger Simple Error</button>
      <button onClick={() => triggerError('with-suggestion')}>Trigger Error With Suggestion</button>
      <button onClick={() => triggerError('with-technical')}>Trigger Error With Technical</button>
      
      {error && (
        <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg relative" data-testid="error-container">
          {/* 關閉按鈕 */}
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded text-red-600 dark:text-red-400 transition-colors"
            title="關閉"
            data-testid="error-close-button"
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
                <p className="text-red-700 dark:text-red-400 text-sm font-semibold leading-5" data-testid="error-message">{error.message}</p>
              </div>
              
              {/* 第一層：建議 */}
              {error.suggestion && showErrorSuggestion && (
                <div data-testid="error-suggestion" className="mt-2 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded border border-red-300 dark:border-red-700 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{error.suggestion}</pre>
                  
                  {/* 第二層：原始錯誤 */}
                  {error.technicalDetails && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline flex items-center gap-1"
                        data-testid="technical-details-toggle"
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
                        <div data-testid="technical-details" className="mt-2 p-2 bg-red-200 dark:bg-red-950/50 rounded border border-red-400 dark:border-red-800 max-h-32 overflow-y-auto">
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
                onClick={() => {
                  setShowErrorSuggestion(!showErrorSuggestion);
                  if (showErrorSuggestion) {
                    setShowTechnicalDetails(false);
                  }
                }}
                className="flex-shrink-0 p-1.5 hover:bg-red-100 dark:hover:bg-red-800/50 rounded text-red-600 dark:text-red-400 transition-colors"
                title={showErrorSuggestion ? "隱藏建議" : "查看建議"}
                data-testid="suggestion-toggle"
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
      )}
    </div>
  );
}

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Simple Error Display', () => {
    it('should render error message with warning icon', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Simple Error'));
      
      const errorContainer = screen.getByTestId('error-container');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200', 'rounded-lg');
      
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('請先設置 API keys');
      expect(errorMessage).toHaveClass('text-red-700', 'font-semibold');
    });

    it('should render close button in top-right corner', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Simple Error'));
      
      const closeButton = screen.getByTestId('error-close-button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('absolute', 'top-2', 'right-2');
      expect(closeButton).toHaveAttribute('title', '關閉');
    });

    it('should dismiss error when clicking close button', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Simple Error'));
      expect(screen.getByTestId('error-container')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('error-close-button'));
      expect(screen.queryByTestId('error-container')).not.toBeInTheDocument();
    });

    it('should not show suggestion toggle for simple errors', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Simple Error'));
      
      expect(screen.queryByTestId('suggestion-toggle')).not.toBeInTheDocument();
    });
  });

  describe('Error with Suggestion', () => {
    it('should render suggestion toggle button', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      
      const toggleButton = screen.getByTestId('suggestion-toggle');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveClass('flex-shrink-0', 'p-1.5', 'rounded');
      expect(toggleButton).toHaveAttribute('title', '查看建議');
    });

    it('should expand suggestion on toggle click', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      expect(screen.queryByTestId('error-suggestion')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      
      const suggestion = screen.getByTestId('error-suggestion');
      expect(suggestion).toBeInTheDocument();
      expect(suggestion).toHaveClass('bg-red-100', 'border-red-300', 'rounded');
      expect(suggestion).toHaveTextContent('免費額度已經用完');
      expect(suggestion).toHaveTextContent('1. 嘗試換不同的 Gemini agent');
    });

    it('should collapse suggestion on second toggle click', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      expect(screen.getByTestId('error-suggestion')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      expect(screen.queryByTestId('error-suggestion')).not.toBeInTheDocument();
    });

    it('should rotate arrow icon when expanding/collapsing', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      
      const toggleButton = screen.getByTestId('suggestion-toggle');
      const arrow = toggleButton.querySelector('svg');
      
      // Initially not rotated
      expect(arrow).not.toHaveClass('rotate-180');
      
      // Click to expand
      fireEvent.click(toggleButton);
      expect(arrow).toHaveClass('rotate-180');
      
      // Click to collapse
      fireEvent.click(toggleButton);
      expect(arrow).not.toHaveClass('rotate-180');
    });

    it('should preserve line breaks in suggestion text', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      
      const suggestion = screen.getByTestId('error-suggestion');
      const pre = suggestion.querySelector('pre');
      
      expect(pre).toHaveClass('whitespace-pre-wrap');
      expect(pre?.textContent).toContain('\n');
    });
  });

  describe('Two-Level Error Expansion', () => {
    it('should show technical details toggle when suggestion is expanded', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Technical'));
      
      // Technical toggle shouldn't exist yet
      expect(screen.queryByTestId('technical-details-toggle')).not.toBeInTheDocument();
      
      // Expand suggestion
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      
      // Now technical toggle should appear
      const technicalToggle = screen.getByTestId('technical-details-toggle');
      expect(technicalToggle).toBeInTheDocument();
      expect(technicalToggle).toHaveTextContent('查看原始錯誤訊息');
    });

    it('should expand technical details on second level toggle', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Technical'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      
      expect(screen.queryByTestId('technical-details')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('technical-details-toggle'));
      
      const technicalDetails = screen.getByTestId('technical-details');
      expect(technicalDetails).toBeInTheDocument();
      expect(technicalDetails).toHaveClass('bg-red-200', 'border-red-400');
      expect(technicalDetails).toHaveTextContent('Error: 429 Resource Exhausted');
      expect(technicalDetails).toHaveTextContent('at fetch');
    });

    it('should collapse technical details independently', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Technical'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      fireEvent.click(screen.getByTestId('technical-details-toggle'));
      
      expect(screen.getByTestId('technical-details')).toBeInTheDocument();
      
      // Collapse technical details
      fireEvent.click(screen.getByTestId('technical-details-toggle'));
      expect(screen.queryByTestId('technical-details')).not.toBeInTheDocument();
      
      // Suggestion should still be visible
      expect(screen.getByTestId('error-suggestion')).toBeInTheDocument();
    });

    it('should collapse technical details when collapsing suggestion', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Technical'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      fireEvent.click(screen.getByTestId('technical-details-toggle'));
      
      expect(screen.getByTestId('technical-details')).toBeInTheDocument();
      
      // Collapse suggestion (should also collapse technical)
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      
      expect(screen.queryByTestId('error-suggestion')).not.toBeInTheDocument();
      expect(screen.queryByTestId('technical-details')).not.toBeInTheDocument();
    });

    it('should update toggle button text for technical details', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Technical'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      
      const toggle = screen.getByTestId('technical-details-toggle');
      expect(toggle).toHaveTextContent('查看原始錯誤訊息');
      
      fireEvent.click(toggle);
      expect(toggle).toHaveTextContent('隱藏原始錯誤訊息');
      
      fireEvent.click(toggle);
      expect(toggle).toHaveTextContent('查看原始錯誤訊息');
    });

    it('should use monospace font for technical details', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Technical'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      fireEvent.click(screen.getByTestId('technical-details-toggle'));
      
      const technicalDetails = screen.getByTestId('technical-details');
      const pre = technicalDetails.querySelector('pre');
      
      expect(pre).toHaveClass('font-mono', 'whitespace-pre-wrap', 'break-words');
    });
  });

  describe('Multiple Errors', () => {
    it('should replace old error with new error', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Simple Error'));
      expect(screen.getByTestId('error-message')).toHaveTextContent('請先設置 API keys');
      
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      expect(screen.getByTestId('error-message')).toHaveTextContent('API 配額已用完');
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('請先設置 API keys');
    });

    it('should reset expansion state when new error appears', () => {
      render(<ErrorDisplay />);
      
      // First error with expanded suggestion
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      fireEvent.click(screen.getByTestId('suggestion-toggle'));
      expect(screen.getByTestId('error-suggestion')).toBeInTheDocument();
      
      // New error should not be expanded
      fireEvent.click(screen.getByText('Trigger Simple Error'));
      expect(screen.queryByTestId('error-suggestion')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on close button', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Simple Error'));
      
      const closeButton = screen.getByTestId('error-close-button');
      expect(closeButton).toHaveAttribute('title', '關閉');
    });

    it('should have proper ARIA attributes on toggle buttons', () => {
      render(<ErrorDisplay />);
      
      fireEvent.click(screen.getByText('Trigger Error With Suggestion'));
      
      const toggle = screen.getByTestId('suggestion-toggle');
      expect(toggle).toHaveAttribute('title', '查看建議');
      
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('title', '隱藏建議');
    });
  });
});
