// Custom hook for session management
import { useCallback, useEffect, RefObject } from 'react';

type SessionManagementProps = {
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  setImage: (img: File | null) => void;
  setImageUrl: (url: string) => void;
  setShowSidebar: (show: boolean) => void;
  updateTitle: (title: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  editingSessionId: string | null;
  editingTitle: string;
  setEditingSessionId: (id: string | null) => void;
  setEditingTitle: (title: string) => void;
  editingContainerRef: RefObject<HTMLDivElement | null>;
};

export const useSessionManagement = ({
  currentSessionId,
  setCurrentSessionId,
  setImage,
  setImageUrl,
  setShowSidebar,
  updateTitle,
  loadSessions,
  removeSession,
  editingSessionId,
  editingTitle,
  setEditingSessionId,
  setEditingTitle,
  editingContainerRef,
}: SessionManagementProps) => {

  // Start new conversation
  const handleNewChat = useCallback(() => {
    setImage(null);
    setImageUrl("");
    setCurrentSessionId(null);
    // Clear stored session ID
    localStorage.removeItem('current-session-id');
    // Close sidebar on mobile only
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
      localStorage.setItem('sidebar-open', 'false');
    }
  }, [setImage, setImageUrl, setCurrentSessionId, setShowSidebar]);

  // Switch to existing session
  const handleSwitchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Clear image preview (don't persist when switching session)
    setImage(null);
    setImageUrl("");
    // Store current session ID for page reload recovery
    localStorage.setItem('current-session-id', sessionId);
    // Close sidebar on mobile only
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
      localStorage.setItem('sidebar-open', 'false');
    }
  }, [setCurrentSessionId, setImage, setImageUrl, setShowSidebar]);

  // Delete session
  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeSession(sessionId);
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  }, [removeSession, currentSessionId, handleNewChat]);

  // Start editing session title
  const handleStartEditTitle = useCallback((sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // If not current conversation, switch to it first
    if (currentSessionId !== sessionId) {
      setCurrentSessionId(sessionId);
    }
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  }, [currentSessionId, setCurrentSessionId, setEditingSessionId, setEditingTitle]);

  // Save edited title
  const handleSaveTitle = useCallback(async (sessionId: string) => {
    if (!editingTitle.trim()) return;
    
    try {
      await updateTitle(editingTitle.trim());
      await loadSessions(); // Refresh session list
      setEditingSessionId(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  }, [editingTitle, updateTitle, loadSessions, setEditingSessionId, setEditingTitle]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingSessionId(null);
    setEditingTitle("");
  }, [setEditingSessionId, setEditingTitle]);

  // Handle Enter key to save, Escape to cancel
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle(sessionId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }, [handleSaveTitle, handleCancelEdit]);

  // Click outside editing container to cancel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingSessionId && editingContainerRef.current && !editingContainerRef.current.contains(event.target as Node)) {
        handleCancelEdit();
      }
    };

    if (editingSessionId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingSessionId, editingContainerRef, handleCancelEdit]);

  return {
    handleNewChat,
    handleSwitchSession,
    handleDeleteSession,
    handleStartEditTitle,
    handleSaveTitle,
    handleCancelEdit,
    handleTitleKeyDown,
  };
};
