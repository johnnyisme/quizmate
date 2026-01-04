"use client";
import { useRef } from "react";
import dynamic from 'next/dynamic';
import ApiKeySetup from "@/components/ApiKeySetup";
import { ChatInput } from "@/components/ChatInput";
import SessionList from "@/components/SessionList";
import { Header } from "@/components/Header";
import { ChatArea } from "@/components/ChatArea";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { ScrollButtons } from "@/components/ScrollButtons";
import { CameraModal } from "@/components/CameraModal";

// Custom Hooks
import { useUIState } from "@/hooks/useUIState";
import { useSettingsState } from "@/hooks/useSettingsState";
import { useChatState } from "@/hooks/useChatState";
import { useImageState } from "@/hooks/useImageState";
import { useSelectionState } from "@/hooks/useSelectionState";
import { useTheme } from "@/hooks/useTheme";
import { useCamera } from "@/hooks/useCamera";
import { useMessageActions } from "@/hooks/useMessageActions";
import { useScrollManagement } from "@/hooks/useScrollManagement";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { useSessionStorage, useSessionHistory } from "@/lib/useSessionStorage";
import { useState } from "react";

// Lazy load Settings modal
const Settings = dynamic(() => import("@/components/Settings"), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-600 dark:text-gray-400">載入設定中...</div></div>,
  ssr: false,
});

export default function HomePage() {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const errorSuggestionRef = useRef<HTMLDivElement>(null);
  const errorTechnicalRef = useRef<HTMLDivElement>(null);
  const editingContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const shouldScrollToQuestion = useRef<boolean>(false);

  // State Hooks
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const uiState = useUIState();
  const chatState = useChatState();
  const imageState = useImageState();
  const selectionState = useSelectionState();

  // Theme Hook (manages its own isDark state)
  const { isDark, isThemeReady, toggleTheme } = useTheme();
  
  // Settings Hook
  const settingsState = useSettingsState();

  // Camera Hook
  const {
    handleCameraClick,
    handleCloseCamera,
    handleTakePhoto,
    handleImageChange,
  } = useCamera({
    videoRef,
    canvasRef,
    cameraInputRef,
    showCamera: uiState.showCamera,
    setShowCamera: uiState.setShowCamera,
    setCameraStream: imageState.setCameraStream,
    cameraStream: imageState.cameraStream,
    setImage: imageState.setImage,
    setImageUrl: imageState.setImageUrl,
    setDisplayConversation: chatState.setDisplayConversation,
    setApiHistory: chatState.setApiHistory,
    setCurrentSessionId,
    setError: chatState.setError,
  });

  // Message Actions Hook
  const {
    handleCopyMessage,
    handleLongPressStart,
    handleLongPressEnd,
    toggleMessageSelect,
    selectAllMessages,
    clearSelection,
    shareSelectedMessages,
    enterShareMode,
  } = useMessageActions({
    isSelectMode: uiState.isSelectMode,
    selectedMessages: selectionState.selectedMessages,
    displayConversation: chatState.displayConversation,
    setIsSelectMode: uiState.setIsSelectMode,
    setSelectedMessages: selectionState.setSelectedMessages,
    setCopiedMessageIndex: uiState.setCopiedMessageIndex,
    setError: chatState.setError,
  });

  // Scroll Management Hook
  const {
    scrollToTop,
    scrollToBottom,
  } = useScrollManagement({
    chatContainerRef,
    lastUserMessageRef,
    shouldScrollToQuestion,
    currentSessionId,
    displayConversation: chatState.displayConversation,
    isLoading: chatState.isLoading,
    setShowScrollToTop: uiState.setShowScrollToTop,
    setShowScrollToBottom: uiState.setShowScrollToBottom,
  });

  // Session Storage Hooks
  const { session, createNewSession, addMessages, updateTitle } = useSessionStorage(currentSessionId);
  const { sessions: sessionList, loadSessions, removeSession, performCleanup } = useSessionHistory();

  // Session Management Hook
  const {
    handleNewChat,
    handleSwitchSession,
    handleDeleteSession,
    handleStartEditTitle,
    handleSaveTitle,
    handleCancelEdit,
    handleTitleKeyDown,
  } = useSessionManagement({
    currentSessionId,
    editingContainerRef,
    setCurrentSessionId,
    setImage: imageState.setImage,
    setImageUrl: imageState.setImageUrl,
    setShowSidebar: uiState.setShowSidebar,
    setEditingSessionId: selectionState.setEditingSessionId,
    setEditingTitle: selectionState.setEditingTitle,
    editingTitle: selectionState.editingTitle,
    editingSessionId: selectionState.editingSessionId,
    updateTitle,
    loadSessions,
    removeSession,
  });

  // Gemini API Hook
  const { handleSubmit } = useGeminiAPI({
    apiKeys: settingsState.apiKeys,
    currentKeyIndex: settingsState.currentKeyIndex,
    selectedModel: settingsState.selectedModel,
    thinkingMode: settingsState.thinkingMode,
    prompts: settingsState.prompts,
    selectedPromptId: settingsState.selectedPromptId,
    currentSessionId,
    apiHistory: chatState.apiHistory,
    chatContainerRef,
    shouldScrollToQuestion,
    setCurrentKeyIndex: settingsState.setCurrentKeyIndex,
    setDisplayConversation: chatState.setDisplayConversation,
    setApiHistory: chatState.setApiHistory,
    setCurrentPrompt: chatState.setCurrentPrompt,
    setIsLoading: chatState.setIsLoading,
    setError: chatState.setError,
    setCurrentSessionId,
    createNewSession,
    addMessages,
    performCleanup,
    loadSessions,
  });

  // Handle form submission wrapper
  const onSubmit = async (promptText?: string) => {
    await handleSubmit(
      promptText ?? chatState.currentPrompt.trim(),
      imageState.image,
      imageState.imageUrl,
      imageState.setImage,
      imageState.setImageUrl
    );
  };

  // Handle settings updates
  const handlePromptsUpdated = (updatedPrompts: any[], newSelectedId?: string) => {
    settingsState.setPrompts(updatedPrompts);
    if (newSelectedId) {
      settingsState.setSelectedPromptId(newSelectedId);
    }
  };

  const handlePromptChange = (promptId: string) => {
    settingsState.setSelectedPromptId(promptId);
  };

  const handleModelChange = (model: any) => {
    settingsState.setSelectedModel(model);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleToggleSidebar = () => {
    const newState = !uiState.showSidebar;
    uiState.setShowSidebar(newState);
    localStorage.setItem('sidebar-open', newState.toString());
  };

  const handleToggleErrorSuggestion = () => {
    uiState.setShowErrorSuggestion(!uiState.showErrorSuggestion);
    if (uiState.showErrorSuggestion) {
      uiState.setShowTechnicalDetails(false);
    }
  };

  const handleToggleTechnicalDetails = () => {
    uiState.setShowTechnicalDetails(!uiState.showTechnicalDetails);
  };

  return (
    <>
      {/* Loading overlay */}
      {!isThemeReady && (
        <div className="fixed inset-0 bg-gray-300 dark:bg-gray-800 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 dark:text-gray-300">載入中...</p>
          </div>
        </div>
      )}

      {settingsState.apiKeys.length === 0 ? (
        <ApiKeySetup onKeysSaved={settingsState.setApiKeys} isDark={isDark} />
      ) : (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
          {/* Sidebar */}
          <div className={`${uiState.showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-[70] pointer-events-auto w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col`}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 dark:text-gray-200">對話歷史</h2>
              <button 
                onClick={() => { uiState.setShowSidebar(false); localStorage.setItem('sidebar-open', 'false'); }} 
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" 
                title="收起側邊欄"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2">
              <button
                type="button"
                onClick={handleNewChat}
                onTouchStart={(e) => { e.stopPropagation(); handleNewChat(); }}
                className="w-full p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center space-x-2 relative z-[80] touch-action-manipulation pointer-events-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>新對話</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SessionList
                sessions={sessionList}
                currentSessionId={currentSessionId}
                editingSessionId={selectionState.editingSessionId}
                editingTitle={selectionState.editingTitle}
                editingContainerRef={editingContainerRef}
                onSwitchSession={handleSwitchSession}
                onDeleteSession={handleDeleteSession}
                onStartEditTitle={handleStartEditTitle}
                onSaveTitle={handleSaveTitle}
                onCancelEdit={handleCancelEdit}
                onTitleKeyDown={handleTitleKeyDown}
                setEditingTitle={selectionState.setEditingTitle}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className={`absolute inset-0 ${uiState.showSidebar ? 'lg:left-72' : 'left-0'} flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto transition-all duration-300`}>
            <div className="w-full max-w-2xl lg:max-w-5xl h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col">
              <Header
                showSidebar={uiState.showSidebar}
                selectedPromptId={settingsState.selectedPromptId}
                selectedModel={settingsState.selectedModel}
                thinkingMode={settingsState.thinkingMode}
                prompts={settingsState.prompts}
                isDark={isDark}
                onToggleSidebar={handleToggleSidebar}
                onPromptChange={handlePromptChange}
                onModelChange={handleModelChange}
                onThinkingModeChange={settingsState.setThinkingMode}
                onOpenSettings={() => uiState.setShowSettings(true)}
              />

              <ChatArea
                chatContainerRef={chatContainerRef}
                lastUserMessageRef={lastUserMessageRef}
                displayConversation={chatState.displayConversation}
                selectedMessages={selectionState.selectedMessages}
                copiedMessageIndex={uiState.copiedMessageIndex}
                isSelectMode={uiState.isSelectMode}
                isLoading={chatState.isLoading}
                imageUrl={imageState.imageUrl}
                isDark={isDark}
                onUploadClick={handleUploadClick}
                onToggleMessageSelect={toggleMessageSelect}
                onCopyMessage={handleCopyMessage}
                onEnterShareMode={enterShareMode}
                onLongPressStart={handleLongPressStart}
                onLongPressEnd={handleLongPressEnd}
                onImagePreview={uiState.setPreviewImage}
              />

              {/* Selection Toolbar */}
              {uiState.isSelectMode && (
                <SelectionToolbar
                  selectedMessages={selectionState.selectedMessages}
                  onSelectAll={selectAllMessages}
                  onClearSelection={clearSelection}
                  onShare={shareSelectedMessages}
                />
              )}

              {/* Input Area */}
              {!uiState.isSelectMode && (
                <div className="sticky bottom-0 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 z-10">
                  {/* Image Preview */}
                  {imageState.imageUrl && chatState.displayConversation.length > 0 && (
                    <div className="px-4 pt-3 pb-2">
                      <div className="relative inline-block">
                        <img 
                          src={imageState.imageUrl} 
                          alt="準備發送的圖片" 
                          className="h-20 max-w-xs rounded-lg object-cover shadow-md border-2 border-blue-500 dark:border-blue-400"
                        />
                        <button
                          onClick={() => {
                            imageState.setImage(null);
                            imageState.setImageUrl("");
                          }}
                          className="absolute -top-2 -right-2 w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors shadow-lg"
                          title="移除圖片"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <ErrorDisplay
                      error={chatState.error}
                      showErrorSuggestion={uiState.showErrorSuggestion}
                      showTechnicalDetails={uiState.showTechnicalDetails}
                      errorSuggestionRef={errorSuggestionRef}
                      errorTechnicalRef={errorTechnicalRef}
                      onClose={() => chatState.setError(null)}
                      onToggleSuggestion={handleToggleErrorSuggestion}
                      onToggleTechnicalDetails={handleToggleTechnicalDetails}
                    />
                    <input
                      ref={fileInputRef}
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <input
                      ref={cameraInputRef}
                      id="camera-file"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                    />
                    <ChatInput
                      onSubmit={onSubmit}
                      isLoading={chatState.isLoading}
                      hasImage={!!imageState.image}
                      hasHistory={chatState.apiHistory.length > 0}
                      onUploadClick={handleUploadClick}
                      onCameraClick={handleCameraClick}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scroll Buttons */}
          {settingsState.apiKeys.length > 0 && (
            <ScrollButtons
              showScrollToTop={uiState.showScrollToTop}
              showScrollToBottom={uiState.showScrollToBottom}
              onScrollToTop={scrollToTop}
              onScrollToBottom={scrollToBottom}
            />
          )}

          {/* Overlay for mobile */}
          {uiState.showSidebar && isThemeReady && (
            <div 
              onClick={() => { uiState.setShowSidebar(false); localStorage.setItem('sidebar-open', 'false'); }} 
              className="fixed inset-0 bg-gradient-to-r from-black/40 to-black/20 z-[60] lg:hidden" 
            />
          )}
          
          {/* Camera Modal */}
          <CameraModal
            showCamera={uiState.showCamera}
            videoRef={videoRef}
            canvasRef={canvasRef}
            onClose={handleCloseCamera}
            onTakePhoto={handleTakePhoto}
          />

          {/* Image Preview Modal */}
          <ImagePreviewModal
            previewImage={uiState.previewImage}
            onClose={() => uiState.setPreviewImage(null)}
          />
        </div>
      )}

      {/* Settings Modal */}
      {uiState.showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[80]">
          <div className="bg-white dark:bg-gray-800 w-full h-full overflow-y-auto flex flex-col">
            <Settings
              apiKeys={settingsState.apiKeys}
              onKeysSaved={settingsState.setApiKeys}
              prompts={settingsState.prompts}
              selectedPromptId={settingsState.selectedPromptId}
              onPromptsUpdated={handlePromptsUpdated}
              isDark={isDark}
              onThemeToggle={toggleTheme}
              onClose={() => uiState.setShowSettings(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
