// Custom hook for managing UI state
import { useState, useCallback } from 'react';

type UIState = {
  showSettings: boolean;
  showSidebar: boolean;
  showCamera: boolean;
  previewImage: string | null;
  isSelectMode: boolean;
  copiedMessageIndex: number | null;
  showScrollToTop: boolean;
  showScrollToBottom: boolean;
  showErrorSuggestion: boolean;
  showTechnicalDetails: boolean;
};

export const useUIState = () => {
  // ✅ Initialize sidebar state from localStorage (client-side only)
  const [uiState, setUIState] = useState<UIState>(() => {
    // Check if we're on the client side (localStorage is only available in browser)
    const storedSidebarOpen = typeof window !== 'undefined' ? localStorage.getItem('sidebar-open') : null;
    return {
      showSettings: false,
      showSidebar: storedSidebarOpen === 'true', // Default false, use stored if available
      showCamera: false,
      previewImage: null,
      isSelectMode: false,
      copiedMessageIndex: null,
      showScrollToTop: false,
      showScrollToBottom: false,
      showErrorSuggestion: false,
      showTechnicalDetails: false,
    };
  });

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // Individual setters for backward compatibility
  const setShowSettings = useCallback((show: boolean) => updateUIState({ showSettings: show }), [updateUIState]);
  const setShowSidebar = useCallback((show: boolean) => updateUIState({ showSidebar: show }), [updateUIState]);
  const setShowCamera = useCallback((show: boolean) => updateUIState({ showCamera: show }), [updateUIState]);
  const setPreviewImage = useCallback((img: string | null) => updateUIState({ previewImage: img }), [updateUIState]);
  const setIsSelectMode = useCallback((mode: boolean) => updateUIState({ isSelectMode: mode }), [updateUIState]);
  const setCopiedMessageIndex = useCallback((idx: number | null) => updateUIState({ copiedMessageIndex: idx }), [updateUIState]);
  const setShowScrollToTop = useCallback((show: boolean) => updateUIState({ showScrollToTop: show }), [updateUIState]);
  const setShowScrollToBottom = useCallback((show: boolean) => updateUIState({ showScrollToBottom: show }), [updateUIState]);
  const setShowErrorSuggestion = useCallback((show: boolean) => updateUIState({ showErrorSuggestion: show }), [updateUIState]);
  const setShowTechnicalDetails = useCallback((show: boolean) => updateUIState({ showTechnicalDetails: show }), [updateUIState]);

  return {
    ...uiState,
    updateUIState,
    setShowSettings,
    setShowSidebar,
    setShowCamera,
    setPreviewImage,
    setIsSelectMode,
    setCopiedMessageIndex,
    setShowScrollToTop,
    setShowScrollToBottom,
    setShowErrorSuggestion,
    setShowTechnicalDetails,
  };
};
