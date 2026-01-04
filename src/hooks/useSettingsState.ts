// Custom hook for managing settings state
import { useState, useCallback, useEffect } from 'react';
import { CustomPrompt, DEFAULT_PROMPT } from '@/components/PromptSettings';

export type ModelType = "gemini-3-flash-preview" | "gemini-2.5-flash" | "gemini-2.5-pro";
export type ThinkingMode = "fast" | "thinking";

type SettingsState = {
  apiKeys: string[];
  currentKeyIndex: number;
  selectedModel: ModelType;
  thinkingMode: ThinkingMode;
  prompts: CustomPrompt[];
  selectedPromptId: string;
  isDark: boolean;
};

export const useSettingsState = () => {
  const [settingsState, setSettingsState] = useState<SettingsState>({
    apiKeys: [],
    currentKeyIndex: 0,
    selectedModel: "gemini-2.5-flash",
    thinkingMode: "fast",
    prompts: [DEFAULT_PROMPT],
    selectedPromptId: "default",
    isDark: false,
  });

  const updateSettingsState = useCallback((updates: Partial<SettingsState>) => {
    setSettingsState(prev => ({ ...prev, ...updates }));
  }, []);

  // Individual setters
  const setApiKeys = useCallback((keys: string[]) => updateSettingsState({ apiKeys: keys }), [updateSettingsState]);
  const setCurrentKeyIndex = useCallback((index: number) => updateSettingsState({ currentKeyIndex: index }), [updateSettingsState]);
  const setSelectedModel = useCallback((model: ModelType) => updateSettingsState({ selectedModel: model }), [updateSettingsState]);
  const setThinkingMode = useCallback((mode: ThinkingMode) => updateSettingsState({ thinkingMode: mode }), [updateSettingsState]);
  const setPrompts = useCallback((p: CustomPrompt[]) => updateSettingsState({ prompts: p }), [updateSettingsState]);
  const setSelectedPromptId = useCallback((id: string) => updateSettingsState({ selectedPromptId: id }), [updateSettingsState]);
  const setIsDark = useCallback((dark: boolean) => updateSettingsState({ isDark: dark }), [updateSettingsState]);

  // Initialize from localStorage (client-side only)
  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;

    const storedKeys = localStorage.getItem("gemini-api-keys");
    if (storedKeys) {
      try {
        const keys = JSON.parse(storedKeys);
        setApiKeys(keys);
      } catch (e) {
        console.error("Failed to parse API keys:", e);
      }
    }

    const storedModel = localStorage.getItem("selected-model") as ModelType | null;
    const validModels: ModelType[] = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-pro"];
    
    if (storedModel && validModels.includes(storedModel)) {
      setSelectedModel(storedModel);
    } else {
      const defaultModel: ModelType = "gemini-2.5-flash";
      setSelectedModel(defaultModel);
      localStorage.setItem("selected-model", defaultModel);
    }

    // Load prompts
    const storedPrompts = localStorage.getItem("custom-prompts");
    let normalized: CustomPrompt[] | null = null;
    if (storedPrompts) {
      try {
        const parsed = JSON.parse(storedPrompts) as CustomPrompt[];
        normalized = parsed.map((p) => (p.id === "default" ? { ...DEFAULT_PROMPT } : p));
      } catch (e) {
        console.error("Failed to parse prompts:", e);
      }
    }

    const basePrompts = normalized && normalized.length > 0 ? normalized : [DEFAULT_PROMPT];
    const defaultIdFromData = basePrompts.find(p => p.isDefault)?.id || basePrompts[0].id;
    const ensured = basePrompts.map(p => ({ ...p, isDefault: p.id === defaultIdFromData }));
    setPrompts(ensured);
    localStorage.setItem('custom-prompts', JSON.stringify(ensured));

    const storedPromptId = localStorage.getItem("selected-prompt-id");
    const effectiveSelected = storedPromptId && ensured.some(p => p.id === storedPromptId)
      ? storedPromptId
      : defaultIdFromData;
    setSelectedPromptId(effectiveSelected);
    localStorage.setItem('selected-prompt-id', effectiveSelected);
  }, []);

  return {
    ...settingsState,
    updateSettingsState,
    setApiKeys,
    setCurrentKeyIndex,
    setSelectedModel,
    setThinkingMode,
    setPrompts,
    setSelectedPromptId,
    setIsDark,
  };
};
