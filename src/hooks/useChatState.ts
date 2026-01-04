// Custom hook for managing chat state
import { useState, useCallback } from 'react';
import { Content } from '@google/generative-ai';

export type DisplayMessage = {
  role: "user" | "model";
  text: string;
  image?: string;
};

type ChatState = {
  displayConversation: DisplayMessage[];
  apiHistory: Content[];
  currentPrompt: string;
  isLoading: boolean;
  error: { message: string; suggestion?: string; technicalDetails?: string } | null;
};

export const useChatState = () => {
  const [chatState, setChatState] = useState<ChatState>({
    displayConversation: [],
    apiHistory: [],
    currentPrompt: "",
    isLoading: false,
    error: null,
  });

  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

  const setDisplayConversation = useCallback((conv: DisplayMessage[] | ((prev: DisplayMessage[]) => DisplayMessage[])) => {
    if (typeof conv === 'function') {
      setChatState(prev => ({ ...prev, displayConversation: conv(prev.displayConversation) }));
    } else {
      updateChatState({ displayConversation: conv });
    }
  }, [updateChatState]);

  const setApiHistory = useCallback((hist: Content[] | ((prev: Content[]) => Content[])) => {
    if (typeof hist === 'function') {
      setChatState(prev => ({ ...prev, apiHistory: hist(prev.apiHistory) }));
    } else {
      updateChatState({ apiHistory: hist });
    }
  }, [updateChatState]);

  const setCurrentPrompt = useCallback((prompt: string) => updateChatState({ currentPrompt: prompt }), [updateChatState]);
  const setIsLoading = useCallback((loading: boolean) => updateChatState({ isLoading: loading }), [updateChatState]);
  const setError = useCallback((err: { message: string; suggestion?: string; technicalDetails?: string } | null) => updateChatState({ error: err }), [updateChatState]);

  return {
    ...chatState,
    updateChatState,
    setDisplayConversation,
    setApiHistory,
    setCurrentPrompt,
    setIsLoading,
    setError,
  };
};
