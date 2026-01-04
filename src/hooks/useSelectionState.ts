// Custom hook for managing message selection state
import { useState, useCallback } from 'react';

type SelectionState = {
  selectedMessages: Set<number>;
  editingSessionId: string | null;
  editingTitle: string;
};

export const useSelectionState = () => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedMessages: new Set(),
    editingSessionId: null,
    editingTitle: "",
  });

  const updateSelectionState = useCallback((updates: Partial<SelectionState>) => {
    setSelectionState(prev => ({ ...prev, ...updates }));
  }, []);

  const setSelectedMessages = useCallback((msgs: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (typeof msgs === 'function') {
      setSelectionState(prev => ({ ...prev, selectedMessages: msgs(prev.selectedMessages) }));
    } else {
      updateSelectionState({ selectedMessages: msgs });
    }
  }, [updateSelectionState]);

  const setEditingSessionId = useCallback((id: string | null) => updateSelectionState({ editingSessionId: id }), [updateSelectionState]);
  const setEditingTitle = useCallback((title: string) => updateSelectionState({ editingTitle: title }), [updateSelectionState]);

  return {
    ...selectionState,
    updateSelectionState,
    setSelectedMessages,
    setEditingSessionId,
    setEditingTitle,
  };
};
