"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSessionStorage, useSessionHistory } from "@/lib/useSessionStorage";
import type { Message as DBMessage } from "@/lib/db";
import dynamic from 'next/dynamic';
import ApiKeySetup from "@/components/ApiKeySetup";
import PromptSettings, { DEFAULT_PROMPT, type CustomPrompt } from "@/components/PromptSettings";

// Lazy load Settings modal (code splitting)
const Settings = dynamic(() => import("@/components/Settings"), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-600 dark:text-gray-400">載入設定中...</div></div>,
  ssr: false,
});
import MessageBubble from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import SessionList from "@/components/SessionList";

// 定義顯示在介面上的訊息類型
type DisplayMessage = {
  role: "user" | "model";
  text: string;
  image?: string;
};

type ModelType = "gemini-3-flash-preview" | "gemini-2.5-flash" | "gemini-2.5-pro";

type ThinkingMode = "fast" | "thinking";

// Grouped state types for performance optimization
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

type SettingsState = {
  apiKeys: string[];
  currentKeyIndex: number;
  selectedModel: ModelType;
  thinkingMode: ThinkingMode;
  prompts: CustomPrompt[];
  selectedPromptId: string;
  isDark: boolean;
};

type ChatState = {
  displayConversation: DisplayMessage[];
  apiHistory: Content[];
  currentPrompt: string;
  isLoading: boolean;
  error: { message: string; suggestion?: string; technicalDetails?: string } | null;
};

type ImageState = {
  image: File | null;
  imageUrl: string;
  cameraStream: MediaStream | null;
};

type SelectionState = {
  selectedMessages: Set<number>;
  editingSessionId: string | null;
  editingTitle: string;
};

// 將技術性錯誤轉換為使用者友善的訊息
const getFriendlyErrorMessage = (error: any): { message: string; suggestion: string } => {
  const errorStr = error?.message || JSON.stringify(error) || '';
  
  // 429 - 配額用完
  if (errorStr.includes("429") || errorStr.toLowerCase().includes("quota") || errorStr.toLowerCase().includes("resource_exhausted")) {
    return {
      message: "API 配額已用完",
      suggestion: "免費額度已經用完。建議：\n1. 嘗試換不同的 Gemini agent\n2. 用不同 Google 帳號申請新的 API Key 並加入輪替\n3. 等待配額重置（通常每天重置)\n4. 升級到付費方案以獲得更高配額"
    };
  }
  
  // 403 - 權限問題
  if (errorStr.includes("403") || errorStr.toLowerCase().includes("permission_denied")) {
    return {
      message: "API 權限不足",
      suggestion: "可能原因：\n1. API Key 沒有存取權限\n2. 需要在 Google Cloud Console 啟用 'Generative Language API'\n3. API Key 可能有 IP 或 HTTP referrer 限制\n\n請到 Google Cloud Console 檢查設定"
    };
  }
  
  // 401 - 認證失敗
  if (errorStr.includes("401") || errorStr.toLowerCase().includes("unauthorized") || errorStr.toLowerCase().includes("invalid_api_key")) {
    return {
      message: "API Key 無效",
      suggestion: "請檢查：\n1. API Key 是否正確複製（沒有多餘空格）\n2. API Key 是否已過期或被刪除\n3. 到 Google AI Studio 重新生成新的 API Key"
    };
  }
  
  // 400 - 請求錯誤
  if (errorStr.includes("400") || errorStr.toLowerCase().includes("invalid_argument")) {
    return {
      message: "請求格式錯誤",
      suggestion: "可能原因：\n1. 圖片格式不支援（請使用 JPG、PNG、GIF、WebP）\n2. 圖片太大（建議小於 4MB）\n3. 問題內容包含不支援的字元\n\n請嘗試重新上傳圖片或修改問題"
    };
  }
  
  // 503 - 服務暫時無法使用
  if (errorStr.includes("503") || errorStr.toLowerCase().includes("unavailable")) {
    return {
      message: "服務暫時無法使用",
      suggestion: "Google AI 服務目前負載過高或維護中。\n請稍後再試，通常幾分鐘內就會恢復"
    };
  }
  
  // 500 - 伺服器錯誤
  if (errorStr.includes("500") || errorStr.toLowerCase().includes("internal")) {
    return {
      message: "伺服器發生錯誤",
      suggestion: "Google AI 服務發生內部錯誤。\n這通常是暫時性問題，請稍後再試"
    };
  }
  
  // Network errors
  if (errorStr.toLowerCase().includes("network") || errorStr.toLowerCase().includes("fetch")) {
    return {
      message: "網路連線問題",
      suggestion: "請檢查：\n1. 網路連線是否正常\n2. 是否有防火牆或代理伺服器阻擋\n3. 嘗試重新整理頁面"
    };
  }
  
  // 模型不支援
  if (errorStr.toLowerCase().includes("model") && errorStr.toLowerCase().includes("not found")) {
    return {
      message: "模型不可用",
      suggestion: "選擇的 AI 模型可能：\n1. 尚未開放使用\n2. 需要付費方案\n3. 已被停用\n\n建議切換到其他模型（如 Gemini 2.5 Flash）"
    };
  }
  
  // 預設錯誤訊息
  return {
    message: "發生未預期的錯誤",
    suggestion: "請嘗試：\n1. 重新整理頁面\n2. 清除瀏覽器快取\n3. 檢查 API Key 是否正確\n4. 點擊下方箭頭查看詳細錯誤訊息\n\n如問題持續，請回報給開發者"
  };
};

export default function HomePage() {
  // Grouped states for better performance
  const [uiState, setUIState] = useState<UIState>({
    showSettings: false,
    showSidebar: false,
    showCamera: false,
    previewImage: null,
    isSelectMode: false,
    copiedMessageIndex: null,
    showScrollToTop: false,
    showScrollToBottom: false,
    showErrorSuggestion: false,
    showTechnicalDetails: false,
  });

  const [settingsState, setSettingsState] = useState<SettingsState>({
    apiKeys: [],
    currentKeyIndex: 0,
    selectedModel: "gemini-2.5-flash",
    thinkingMode: "fast",
    prompts: [DEFAULT_PROMPT],
    selectedPromptId: "default",
    isDark: false,
  });

  const [chatState, setChatState] = useState<ChatState>({
    displayConversation: [],
    apiHistory: [],
    currentPrompt: "",
    isLoading: false,
    error: null,
  });

  const [imageState, setImageState] = useState<ImageState>({
    image: null,
    imageUrl: "",
    cameraStream: null,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedMessages: new Set(),
    editingSessionId: null,
    editingTitle: "",
  });

  // Keep separate for specific reasons
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isThemeReady, setIsThemeReady] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelMessageIndexRef = useRef<number | null>(null);
  const errorSuggestionRef = useRef<HTMLDivElement>(null);
  const errorTechnicalRef = useRef<HTMLDivElement>(null);
  const editingContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const shouldScrollToQuestion = useRef<boolean>(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper functions for state updates (reduces boilerplate)
  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSettingsState = useCallback((updates: Partial<SettingsState>) => {
    setSettingsState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateImageState = useCallback((updates: Partial<ImageState>) => {
    setImageState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSelectionState = useCallback((updates: Partial<SelectionState>) => {
    setSelectionState(prev => ({ ...prev, ...updates }));
  }, []);

  // Destructure for easier access
  const {
    showSettings, showSidebar, showCamera, previewImage,
    isSelectMode, copiedMessageIndex, showScrollToTop, showScrollToBottom,
    showErrorSuggestion, showTechnicalDetails
  } = uiState;

  const {
    apiKeys, currentKeyIndex, selectedModel, thinkingMode,
    prompts, selectedPromptId, isDark
  } = settingsState;

  const {
    displayConversation, apiHistory, currentPrompt, isLoading, error
  } = chatState;

  const { image, imageUrl, cameraStream } = imageState;

  const { selectedMessages, editingSessionId, editingTitle } = selectionState;

  // Backward-compatible setters (to minimize refactoring)
  const setApiKeys = useCallback((keys: string[]) => updateSettingsState({ apiKeys: keys }), []);
  const setCurrentKeyIndex = useCallback((index: number) => updateSettingsState({ currentKeyIndex: index }), []);
  const setSelectedModel = useCallback((model: ModelType) => updateSettingsState({ selectedModel: model }), []);
  const setThinkingMode = useCallback((mode: ThinkingMode) => updateSettingsState({ thinkingMode: mode }), []);
  const setPrompts = useCallback((p: CustomPrompt[]) => updateSettingsState({ prompts: p }), []);
  const setSelectedPromptId = useCallback((id: string) => updateSettingsState({ selectedPromptId: id }), []);
  const setIsDark = useCallback((dark: boolean) => updateSettingsState({ isDark: dark }), []);
  
  const setShowSettings = useCallback((show: boolean) => updateUIState({ showSettings: show }), []);
  const setShowSidebar = useCallback((show: boolean) => updateUIState({ showSidebar: show }), []);
  const setShowCamera = useCallback((show: boolean) => updateUIState({ showCamera: show }), []);
  const setPreviewImage = useCallback((img: string | null) => updateUIState({ previewImage: img }), []);
  const setIsSelectMode = useCallback((mode: boolean) => updateUIState({ isSelectMode: mode }), []);
  const setCopiedMessageIndex = useCallback((idx: number | null) => updateUIState({ copiedMessageIndex: idx }), []);
  const setShowScrollToTop = useCallback((show: boolean) => updateUIState({ showScrollToTop: show }), []);
  const setShowScrollToBottom = useCallback((show: boolean) => updateUIState({ showScrollToBottom: show }), []);
  const setShowErrorSuggestion = useCallback((show: boolean) => updateUIState({ showErrorSuggestion: show }), []);
  const setShowTechnicalDetails = useCallback((show: boolean) => updateUIState({ showTechnicalDetails: show }), []);
  
  const setDisplayConversation = useCallback((conv: DisplayMessage[] | ((prev: DisplayMessage[]) => DisplayMessage[])) => {
    if (typeof conv === 'function') {
      setChatState(prev => ({ ...prev, displayConversation: conv(prev.displayConversation) }));
    } else {
      updateChatState({ displayConversation: conv });
    }
  }, []);
  const setApiHistory = useCallback((hist: Content[] | ((prev: Content[]) => Content[])) => {
    if (typeof hist === 'function') {
      setChatState(prev => ({ ...prev, apiHistory: hist(prev.apiHistory) }));
    } else {
      updateChatState({ apiHistory: hist });
    }
  }, []);
  const setCurrentPrompt = useCallback((prompt: string) => updateChatState({ currentPrompt: prompt }), []);
  const setIsLoading = useCallback((loading: boolean) => updateChatState({ isLoading: loading }), []);
  const setError = useCallback((err: { message: string; suggestion?: string; technicalDetails?: string } | null) => updateChatState({ error: err }), []);
  
  const setImage = useCallback((img: File | null) => updateImageState({ image: img }), []);
  const setImageUrl = useCallback((url: string) => updateImageState({ imageUrl: url }), []);
  const setCameraStream = useCallback((stream: MediaStream | null) => updateImageState({ cameraStream: stream }), []);
  
  const setSelectedMessages = useCallback((msgs: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (typeof msgs === 'function') {
      setSelectionState(prev => ({ ...prev, selectedMessages: msgs(prev.selectedMessages) }));
    } else {
      updateSelectionState({ selectedMessages: msgs });
    }
  }, []);
  const setEditingSessionId = useCallback((id: string | null) => updateSelectionState({ editingSessionId: id }), []);
  const setEditingTitle = useCallback((title: string) => updateSelectionState({ editingTitle: title }), []);

  // 當新問題加入時自動滾動
  useEffect(() => {
    if (shouldScrollToQuestion.current && lastUserMessageRef.current && chatContainerRef.current) {
      shouldScrollToQuestion.current = false;
      
      const userMessage = lastUserMessageRef.current;
      const container = chatContainerRef.current;
      
      // 計算問題氣泡相對於容器的位置
      const containerRect = container.getBoundingClientRect();
      const messageRect = userMessage.getBoundingClientRect();
      const relativeTop = messageRect.top - containerRect.top;
      
      // 滾動到問題位置（留 16px 上方間距）
      container.scrollTo({
        top: container.scrollTop + relativeTop - 16,
        behavior: 'smooth'
      });
    }
  }, [displayConversation]);

  // Gemini App-like 滾動效果：使用 requestAnimationFrame 確保滾動平滑
  // Padding 已在 handleSubmit 中直接設定
  // 只在開始 loading 時執行一次，避免串流更新時重複滾動
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (isLoading && displayConversation.length > 0) {
      // 使用 requestAnimationFrame 確保滾動在下一個繪製週期執行
      const rafId = requestAnimationFrame(() => {
        if (lastUserMessageRef.current) {
          const userMessage = lastUserMessageRef.current;
          const containerRect = container.getBoundingClientRect();
          const messageRect = userMessage.getBoundingClientRect();
          const relativeTop = messageRect.top - containerRect.top;
          
          container.scrollTo({
            top: container.scrollTop + relativeTop - 16,
            behavior: 'smooth'
          });
        }
      });
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [isLoading]); // 移除 displayConversation 依賴，只在 loading 狀態改變時執行

  // 根據語言自適應截斷 prompt 名稱
  const truncatePromptName = (name: string) => {
    const hasChinese = /[\u4E00-\u9FFF]/.test(name);
    
    // 只要有中文字元就用短限制（中文字寬度大）；純英文/數字允許更長
    const maxLength = hasChinese ? 4 : 12;
    
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  // 滾動到頂部
  const scrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 滾動到底部
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ 
        top: chatContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  // 展開錯誤詳情時自動滾動到內容
  useEffect(() => {
    if (showErrorSuggestion && errorSuggestionRef.current) {
      setTimeout(() => {
        errorSuggestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    if (showTechnicalDetails && errorTechnicalRef.current) {
      setTimeout(() => {
        errorTechnicalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showErrorSuggestion, showTechnicalDetails]);

  // 初始化 API keys、模型選擇和 prompts
  useEffect(() => {
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
    
    // 驗證存儲的模型是否仍然有效
    if (storedModel && validModels.includes(storedModel)) {
      setSelectedModel(storedModel);
    } else {
      // 如果沒有儲存的模型或模型已失效，使用預設值並儲存
      const defaultModel: ModelType = "gemini-2.5-flash";
      setSelectedModel(defaultModel);
      localStorage.setItem("selected-model", defaultModel);
    }

    // 載入 prompts
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

    // 恢復上次的對話
    const lastSessionId = localStorage.getItem('current-session-id');
    if (lastSessionId) {
      setCurrentSessionId(lastSessionId);
    }

    // 恢復側邊欄狀態
    const storedSidebarState = localStorage.getItem('sidebar-open');
    if (storedSidebarState === 'true') {
      setShowSidebar(true);
    }
  }, []);

  // 初始化主題 + 動態載入 KaTeX CSS
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    document.documentElement.classList.toggle('light', !shouldBeDark);
    
    // 動態載入 KaTeX CSS (只在需要時載入)
    if (typeof window !== 'undefined' && !document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/katex.min.css';
      link.integrity = 'sha384-mXD7x5S50Ko38scHSnD4egvoExgMPbrseZorkbE49evAfv9nNcbrXJ8LLNsDgh9d';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    
    // 立即顯示內容，讓灰色加載畫面能正常顯示
    setIsThemeReady(true);
  }, []);

  // 切換主題
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    const root = document.documentElement;
    root.classList.toggle('dark', newTheme);
    root.classList.toggle('light', !newTheme);
  };

  // 切換模型
  const handleModelChange = useCallback((model: ModelType) => {
    setSelectedModel(model);
    localStorage.setItem('selected-model', model);
  }, [setSelectedModel]);

  // 更新 prompts
  const handlePromptsUpdated = useCallback((updatedPrompts: CustomPrompt[], newSelectedId?: string) => {
    const normalized = updatedPrompts.map((p) => 
      p.id === "default" ? { ...DEFAULT_PROMPT, ...p, isDefault: p.isDefault } : p
    );
    
    // 确定新的默认 ID
    const defaultId = newSelectedId || normalized.find(p => p.isDefault)?.id || normalized[0]?.id || "default";
    const ensured = normalized.map(p => ({ ...p, isDefault: p.id === defaultId }));
    
    setPrompts(ensured);
    localStorage.setItem('custom-prompts', JSON.stringify(ensured));
    
    // 更新 selectedPromptId
    setSelectedPromptId(defaultId);
    localStorage.setItem('selected-prompt-id', defaultId);
  }, [setPrompts, setSelectedPromptId]);
  // 切換 prompt
  const handlePromptChange = useCallback((promptId: string) => {
    const ensured = prompts.map(p => ({ ...p, isDefault: p.id === promptId }));
    setPrompts(ensured);
    localStorage.setItem('custom-prompts', JSON.stringify(ensured));
    setSelectedPromptId(promptId);
    localStorage.setItem('selected-prompt-id', promptId);
  }, [prompts, setPrompts, setSelectedPromptId]);

  // Session management hooks
  const { session, createNewSession, addMessages, updateTitle } = useSessionStorage(currentSessionId);
  const { sessions: sessionList, loadSessions, removeSession, performCleanup } = useSessionHistory();

  // Track previous session ID to detect real session switches
  const prevSessionIdRef = useRef<string | null>(null);

  // Load session when switching
  useEffect(() => {
    if (session) {
      const isSessionSwitch = prevSessionIdRef.current !== session.id;
      prevSessionIdRef.current = session.id;

      // Convert DB messages to display format
      const displayMsgs: DisplayMessage[] = session.messages.map((msg) => ({
        role: msg.role,
        text: msg.content,
        image: msg.imageBase64,
      }));
      setDisplayConversation(displayMsgs);

      // Rebuild API history
      const apiMsgs: Content[] = [];
      for (let i = 0; i < session.messages.length; i++) {
        const msg = session.messages[i];
        if (msg.role === "user") {
          const parts: any[] = [];
          if (i === 0 && msg.imageBase64) {
            // First message with image
            const base64Data = msg.imageBase64.split(",")[1] || msg.imageBase64;
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg", // Default, ideally store in DB
              },
            });
          }
          parts.push({ text: msg.content });
          apiMsgs.push({ role: "user", parts });
        } else {
          apiMsgs.push({ role: "model", parts: [{ text: msg.content }] });
        }
      }
      setApiHistory(apiMsgs);

      // Restore image if available
      if (session.imageBase64) {
        setImageUrl(session.imageBase64);
        // Note: Cannot fully restore File object, but imageUrl is sufficient for display
      }

      // 只在真正切換 session 時恢復滾動位置（不是在同一個 session 更新訊息時）
      if (isSessionSwitch) {
        const savedScrollPos = localStorage.getItem(`scroll-pos-${session.id}`);
        if (savedScrollPos && chatContainerRef.current) {
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = parseInt(savedScrollPos, 10);
            }
          }, 100); // 等待 DOM 渲染完成
        }
      }
    }
  }, [session]);

  // Generate title from first user message
  const generateTitle = (text: string): string => {
    const cleaned = text.replace(/[*$\n]/g, " ").trim();
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
  };

  // 將檔案轉為純 base64（不含 data: 前綴）
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIndex = result.indexOf(",");
        if (commaIndex !== -1) {
          resolve(result.slice(commaIndex + 1));
        } else {
          // 若非 dataURL，直接回傳原字串
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 處理圖片選擇
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 檢查圖片大小限制 (10MB)
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_IMAGE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setError({
          message: "圖片檔案太大",
          suggestion: `目前圖片大小：${fileSizeMB} MB\n\n建議：\n1. 壓縮圖片後再上傳（建議 < 10MB）\n2. 使用線上工具壓縮：TinyPNG、Squoosh 等\n3. 調整圖片解析度（手機可選擇「中」或「低」畫質拍照）\n4. 截圖時選擇較小的區域\n\n💡 10MB 限制是為了保護瀏覽器儲存空間，避免影響效能。`
        });
        // 清空 input，允許重新選擇同一個檔案
        e.target.value = '';
        return;
      }
      
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      // 重置對話並開始新 session
      setDisplayConversation([]);
      setApiHistory([]);
      setCurrentSessionId(null);
      setError(null);
    }
  }, [setImage, setImageUrl, setDisplayConversation, setApiHistory, setError]);

  // Start new conversation
  const handleNewChat = useCallback(() => {
    setImage(null);
    setImageUrl("");
    setDisplayConversation([]);
    setApiHistory([]);
    setCurrentSessionId(null);
    setError(null);
    // 清除儲存的 session ID
    localStorage.removeItem('current-session-id');
    // Close sidebar on mobile only
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
      localStorage.setItem('sidebar-open', 'false');
    }
  }, [setImage, setImageUrl, setDisplayConversation, setApiHistory, setError, setShowSidebar]);

  // Switch to existing session
  const handleSwitchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    // 儲存當前 session ID 以便頁面重載後恢復
    localStorage.setItem('current-session-id', sessionId);
    // Close sidebar on mobile only
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
      localStorage.setItem('sidebar-open', 'false');
    }
  }, [setShowSidebar]);

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
    // 如果不是當前對話,先切換到該對話
    if (currentSessionId !== sessionId) {
      setCurrentSessionId(sessionId);
    }
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  }, [currentSessionId, setEditingSessionId, setEditingTitle]);

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

  // 點擊編輯容器外部時取消編輯
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
  }, [editingSessionId]);

  // 監聽滾動位置來顯示/隱藏滾動按鈕
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100; // 100px 閾值
      
      // 距離頂部超過 100px 時顯示「回到頂部」按鈕
      setShowScrollToTop(scrollTop > threshold);
      
      // 距離底部超過 100px 時顯示「跳到最新」按鈕
      setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - threshold);
    };

    // 初始檢查
    handleScroll();

    // 監聽滾動事件
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [displayConversation]);

  // 在頁面離開時保存滾動位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSessionId && chatContainerRef.current) {
        const scrollPos = chatContainerRef.current.scrollTop;
        localStorage.setItem(`scroll-pos-${currentSessionId}`, scrollPos.toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSessionId]);

  // 偵測是否為行動裝置
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // 觸發檔案選擇
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 開啟攝影機（僅限桌面）
  const handleOpenCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      // 等待 video 元素準備好
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Failed to access camera:', err);
      setError({ 
        message: "無法存取攝影機",
        suggestion: "請確認：\n1. 瀏覽器有攝影機權限\n2. 沒有其他應用程式正在使用攝影機\n3. 使用 HTTPS 連線（本地開發可用 localhost）"
      });
    }
  }, [setCameraStream, setShowCamera, setError]);

  // 處理相機按鈕點擊
  const handleCameraClick = useCallback(() => {
    if (isMobile()) {
      // 行動裝置：使用原生檔案選擇器（會自動提供拍照選項）
      cameraInputRef.current?.click();
    } else {
      // 桌面：開啟網頁攝影機
      handleOpenCamera();
    }
  }, [handleOpenCamera]);

  // 關閉攝影機
  const handleCloseCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream, setCameraStream, setShowCamera]);

  // 拍照
  const handleTakePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 設定 canvas 尺寸與 video 相同
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 繪製當前影格到 canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 將 canvas 轉換為 blob
      canvas.toBlob((blob) => {
        if (blob) {
          // 建立 File 物件
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImage(file);
          setImageUrl(URL.createObjectURL(file));
          
          // 重置對話
          setDisplayConversation([]);
          setApiHistory([]);
          setCurrentSessionId(null);
          setError(null);
          
          // 關閉攝影機
          handleCloseCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  }, [setImage, setImageUrl, setDisplayConversation, setApiHistory, setError, handleCloseCamera]);

  // 複製訊息內容
  const handleCopyMessage = useCallback(async (text: string, index: number) => {
    try {
      // 優先使用現代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: 使用傳統 execCommand 方法（支援更多環境）
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      
      setCopiedMessageIndex(index);
      // 2 秒後清除複製狀態
      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError({
        message: "複製失敗",
        suggestion: "請檢查瀏覽器是否允許存取剪貼簿"
      });
    }
  }, []);

  // 長按進入選取模式
  const handleLongPressStart = useCallback((index: number) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelectMode(true);
      setSelectedMessages(new Set([index]));
    }, 500); // 500ms 長按
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // 切換訊息選取狀態
  const toggleMessageSelect = useCallback((index: number) => {
    if (!isSelectMode) return;
    
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, [isSelectMode]);

  // 全選訊息
  const selectAllMessages = () => {
    const allIndices = displayConversation.map((_, i) => i);
    setSelectedMessages(new Set(allIndices));
  };

  // 清除選取，離開選取模式
  const clearSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  };

  // 格式化選取的訊息為 Markdown
  const formatSelectedMessages = (): string => {
    const sortedIndices = Array.from(selectedMessages).sort((a, b) => a - b);
    const messages = sortedIndices.map(i => displayConversation[i]);
    
    const header = '與 QuizMate AI 老師的討論\n' + '─'.repeat(30) + '\n\n';
    const body = messages.map(msg => {
      const icon = msg.role === 'user' ? '👤' : '🤖';
      const label = msg.role === 'user' ? '用戶' : 'AI';
      return `${icon} ${label}：${msg.text}`;
    }).join('\n\n');
    
    return header + body;
  };

  // 進入分享模式（桌面端用）
  const enterShareMode = useCallback((index: number) => {
    setIsSelectMode(true);
    setSelectedMessages(new Set([index]));
  }, []);

  // 分享選取的訊息（移動端多選用）
  const shareSelectedMessages = async () => {
    if (selectedMessages.size === 0) {
      setError({
        message: "請先選取訊息",
        suggestion: "點擊訊息泡泡上的勾選框來選取要分享的內容"
      });
      return;
    }

    const formattedText = formatSelectedMessages();

    try {
      // 檢查是否支援 Web Share API（需要在 HTTPS 或 localhost）
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        console.log('使用 Web Share API 分享');
        await navigator.share({
          title: '與 QuizMate AI 老師的討論',
          text: formattedText,
        });
        // 分享成功後清除選取
        clearSelection();
        return;
      }
      
      // Fallback: 複製到剪貼簿
      console.log('Web Share API 不支援，使用剪貼簿 fallback');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedText);
      } else {
        // 傳統 fallback
        const textArea = document.createElement('textarea');
        textArea.value = formattedText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      
      alert('✅ 已複製到剪貼簿！\n\n💡 你的瀏覽器不支援直接分享功能。請手動貼上到 LINE、Messenger 等 App 分享。\n\n提示：在支援的瀏覽器（如 Safari、Chrome Mobile）上可直接呼叫分享選單。');
      clearSelection();
    } catch (err: any) {
      // 用戶取消分享
      if (err.name === 'AbortError') {
        console.log('用戶取消分享');
        return;
      }
      
      console.error('Failed to share:', err);
      setError({
        message: "分享失敗",
        suggestion: "請確認瀏覽器支援分享功能，或嘗試使用複製功能\n\n技術細節：" + (err.message || JSON.stringify(err))
      });
    }
  };

  // 處理表單提交 (傳送訊息) - 直接使用前端 Gemini API + 模型選擇 + key 輪轉
  const handleSubmit = async (promptText?: string) => {
    if (apiKeys.length === 0) {
      setError({ message: "請先設置 API keys" });
      return;
    }

    const text = promptText ?? currentPrompt.trim();
    const promptForRetry = text;

    if (!text && !image) {
      setError({ message: "請輸入問題或上傳圖片" });
      return;
    }

    setIsLoading(true);
    setError(null);

    // --- 更新介面對話，只加入用戶訊息 ---
    const displayText = text || "[圖片問題]";
    const userMessage: DisplayMessage = { role: "user", text: displayText };
    if (apiHistory.length === 0 && image) {
      userMessage.image = imageUrl;
    }
    
    setDisplayConversation(prev => [...prev, userMessage]);

    // 標記需要滾動到新問題
    shouldScrollToQuestion.current = true;

    // 直接設定 padding（不依賴 useEffect）
    if (chatContainerRef.current) {
      chatContainerRef.current.style.paddingBottom = '80vh';
    }

    const apiPrompt = text || "請分析這張圖片並解答題目";
    setCurrentPrompt("");

    try {
      // 嘗試使用當前 API key，如果失敗則輪轉
      let modelResponseText = "";
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < apiKeys.length; i++) {
        const keyIndex = (currentKeyIndex + i) % apiKeys.length;
        try {
          const client = new GoogleGenerativeAI(apiKeys[keyIndex]);
          const model = client.getGenerativeModel({ model: selectedModel });

          // 準備請求的內容
          const parts: any[] = [];

          // 如果是第一則訊息且有圖片，加入圖片
          if (apiHistory.length === 0 && image) {
            const base64 = await fileToBase64(image);
            parts.push({
              inlineData: {
                data: base64,
                mimeType: image.type || "image/jpeg",
              },
            });
          }

          parts.push({ text: apiPrompt });

          // 準備系統指令（在第一則訊息時加入）
          let systemPrompt = "";
          if (apiHistory.length === 0) {
            const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
            systemPrompt = selectedPrompt?.content || DEFAULT_PROMPT.content;
          }

          // 呼叫 Gemini API（支援串流）
          const buildRequestPayload = (withThinking: boolean) => {
            const generationConfig: any = {
              temperature: 1.0,
              maxOutputTokens: 65536,
            };

            if (withThinking && selectedModel.includes("gemini-3")) {
              // 與官方 cURL 範例一致：generationConfig.thinkingConfig
              generationConfig.thinkingConfig = {
                thinkingLevel: "high",
                includeThoughts: false,
              };
            }

            return {
              contents: apiHistory.length === 0 && systemPrompt
                ? [{ role: "user", parts: [{ text: systemPrompt }] }, { role: "user", parts }]
                : [...apiHistory, { role: "user", parts }],
              generationConfig,
            };
          };

          const updateModelMessage = (updater: (prevText: string) => string) => {
            setDisplayConversation(prev => {
              const lastMsg = prev[prev.length - 1];
              // 如果最後一則是 model 訊息，更新它；否則加入新的 model 訊息
              if (lastMsg && lastMsg.role === 'model') {
                return prev.map((msg, i) => i === prev.length - 1 ? { ...msg, text: updater(msg.text) } : msg);
              } else {
                return [...prev, { role: 'model', text: updater('') }];
              }
            });
          };

          const streamOnce = async (withThinking: boolean): Promise<string> => {

            const result = await model.generateContentStream(buildRequestPayload(withThinking));
            let aggregated = "";

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (!chunkText) continue;
              aggregated += chunkText;
              updateModelMessage((prevText) => prevText + chunkText);
            }

            // 防呆：若串流沒有內容，回退完整回應文字
            if (!aggregated) {
              const fullResponse = await result.response;
              aggregated = fullResponse.text();
              updateModelMessage(() => aggregated);
            }

            return aggregated;
          };

          try {
            modelResponseText = await streamOnce(thinkingMode === "thinking");
          } catch (err: any) {
            const msg = (err?.message || "").toLowerCase();
            const thinkingLikelyUnsupported = msg.includes("thinking") || msg.includes("unknown name") || msg.includes("unrecognized");

            if (thinkingMode === "thinking" && thinkingLikelyUnsupported && selectedModel.includes("gemini-3")) {
              console.warn("Thinking not supported for this key/model, retrying without thinking.", err?.message);
              modelResponseText = await streamOnce(false);
            } else {
              throw err;
            }
          }

          success = true;
          setCurrentKeyIndex(keyIndex); // 更新為成功的 key index
          break;
        } catch (err: any) {
          lastError = err;
          // 只在開發環境輸出詳細錯誤（避免 production console 噪音）
          if (process.env.NODE_ENV === 'development') {
            console.warn(`API key ${keyIndex} failed:`, err.message);
          }
          // 繼續嘗試下一個 key
          continue;
        }
      }

      if (!success) {
        throw new Error(
          `所有 API keys 都失敗。最後錯誤: ${lastError?.message || "未知錯誤"}`
        );
      }

      // --- 保存到 IndexedDB ---
      const userDBMsg: DBMessage = {
        role: "user",
        content: promptText || "[圖片問題]",
        timestamp: Date.now(),
      };
      const modelDBMsg: DBMessage = {
        role: "model",
        content: modelResponseText,
        timestamp: Date.now(),
      };

      if (!currentSessionId) {
        const title = generateTitle(promptText || "圖片問題");
        let imageB64: string | undefined;
        if (apiHistory.length === 0 && image) {
          try {
            const base64Data = await fileToBase64(image);
            imageB64 = `data:${image.type};base64,${base64Data}`;
            userDBMsg.imageBase64 = imageB64;
          } catch (e) {
            console.error("Failed to convert image to base64:", e);
          }
        }

        const newSession = await createNewSession(title, [userDBMsg, modelDBMsg], imageB64);
        setCurrentSessionId(newSession.id);
        // 儲存新建立的 session ID
        localStorage.setItem('current-session-id', newSession.id);
        await performCleanup();
        await loadSessions();
      } else {
        await addMessages([userDBMsg, modelDBMsg]);
      }

      // --- 更新 API history ---
      const modelApiPart = { role: "model", parts: [{ text: modelResponseText }] };
      if (apiHistory.length === 0 && image) {
        try {
          const base64 = await fileToBase64(image);
          const initialUserWithImage = {
            role: "user",
            parts: [
              { inlineData: { data: base64, mimeType: image.type || "image/jpeg" } },
              { text: apiPrompt },
            ],
          };
          setApiHistory([initialUserWithImage, modelApiPart]);
        } catch (e) {
          const fallbackUser = { role: "user", parts: [{ text: apiPrompt }] };
          setApiHistory([fallbackUser, modelApiPart]);
        }
      } else {
        const userApiPart = { role: "user", parts: [{ text: apiPrompt }] };
        setApiHistory(prev => [...prev, userApiPart, modelApiPart]);
      }
    } catch (err: any) {
      const friendlyError = getFriendlyErrorMessage(err);
      const technicalDetails = err?.stack || JSON.stringify(err, null, 2);
      setError({ 
        message: friendlyError.message,
        suggestion: friendlyError.suggestion,
        technicalDetails: technicalDetails
      });
      setShowErrorSuggestion(false);
      setShowTechnicalDetails(false);
      setDisplayConversation(prev => prev.slice(0, -1));
      setCurrentPrompt(promptForRetry);
    } finally {
      modelMessageIndexRef.current = null;
      setIsLoading(false);
      
      // 移除 padding（讓瀏覽器自然處理滾動）
      if (chatContainerRef.current) {
        chatContainerRef.current.style.paddingBottom = '0px';
      }
    }
  };

  return (
    <>
      {/* Loading overlay - 顯示在最頂層 */}
      {!isThemeReady && (
        <div className="fixed inset-0 bg-gray-300 dark:bg-gray-800 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 dark:text-gray-300">載入中...</p>
          </div>
        </div>
      )}

      {apiKeys.length === 0 ? (
        <ApiKeySetup onKeysSaved={setApiKeys} isDark={isDark} />
      ) : (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex overflow-hidden">

          {/* Sidebar */}
          <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-[70] pointer-events-auto w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col`}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 dark:text-gray-200">對話歷史</h2>
                <button onClick={() => { setShowSidebar(false); localStorage.setItem('sidebar-open', 'false'); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" title="收起側邊欄">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        <div className="p-2">
          <button
            type="button"
            onClick={handleNewChat}
            onTouchStart={(e) => { e.stopPropagation(); handleNewChat(); }}
            className="w-full p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center space-x-2 relative z-[80] touch-action-manipulation pointer-events-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>新對話</span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SessionList
            sessions={sessionList}
            currentSessionId={currentSessionId}
            editingSessionId={editingSessionId}
            editingTitle={editingTitle}
            editingContainerRef={editingContainerRef}
            onSwitchSession={handleSwitchSession}
            onDeleteSession={handleDeleteSession}
            onStartEditTitle={handleStartEditTitle}
            onSaveTitle={handleSaveTitle}
            onCancelEdit={handleCancelEdit}
            onTitleKeyDown={handleTitleKeyDown}
            setEditingTitle={setEditingTitle}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Main Content - Centered with sidebar consideration */}
      <div className={`absolute inset-0 ${showSidebar ? 'lg:left-72' : 'left-0'} flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto transition-all duration-300`}>
        <div className="w-full max-w-2xl lg:max-w-5xl h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col">
          <div className="px-1 sm:px-2 py-2 border-b dark:border-gray-700 flex-shrink-0 flex flex-row items-center gap-1 relative z-10 bg-white dark:bg-gray-800 overflow-x-auto">
            {/* Left cluster: menu + logo */}
            <div className="flex items-center gap-1 flex-shrink-0 min-w-[48px]">
              <button 
                onClick={() => { 
                  const newState = !showSidebar;
                  setShowSidebar(newState);
                  localStorage.setItem('sidebar-open', newState.toString());
                }} 
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
                onChange={(e) => handlePromptChange(e.target.value)}
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
                onChange={(e) => handleModelChange(e.target.value as ModelType)}
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
                  onChange={(e) => setThinkingMode(e.target.value as ThinkingMode)}
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
                onClick={() => setShowSettings(true)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                title="設定"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          {displayConversation.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div
                  onClick={handleUploadClick}
                  className="flex flex-col items-center justify-center w-full max-w-md h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2"/>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-5 text-center">
                      <svg className="w-10 h-10 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                      <p className="font-semibold">點擊上傳題目照片</p>
                      <p className="text-xs mt-1">或從相簿選擇</p>
                    </div>
                  )}
                </div>
                <p className="mt-4">可以上傳圖片、輸入文字，或兩者皆可</p>
            </div>
          )}

          <div className="space-y-4">
            {displayConversation.map((msg, index) => {
              // 找到所有用戶訊息的索引
              const userMessageIndices = displayConversation.reduce<number[]>((acc, m, i) => {
                if (m.role === 'user') acc.push(i);
                return acc;
              }, []);
              const lastUserIndex = userMessageIndices[userMessageIndices.length - 1];
              const isLastUserMessage = msg.role === 'user' && index === lastUserIndex;
              const isSelected = selectedMessages.has(index);
              
              return (
                <MessageBubble
                  key={index}
                  ref={isLastUserMessage ? lastUserMessageRef : null}
                  msg={msg}
                  index={index}
                  isLastUserMessage={isLastUserMessage}
                  isSelectMode={isSelectMode}
                  isSelected={isSelected}
                  copiedMessageIndex={copiedMessageIndex}
                  isDark={isDark}
                  onToggleSelect={toggleMessageSelect}
                  onCopyMessage={handleCopyMessage}
                  onEnterShareMode={enterShareMode}
                  onLongPressStart={handleLongPressStart}
                  onLongPressEnd={handleLongPressEnd}
                  onImagePreview={setPreviewImage}
                />
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-lg lg:max-w-3xl p-3 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-gray-800/95 flex items-center justify-center shadow-sm">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8">
                      <defs>
                        <linearGradient id="robotGradientThinking" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#60A5FA'}} />
                          <stop offset="100%" style={{stopColor: '#A78BFA'}} />
                        </linearGradient>
                      </defs>
                      <rect x="25" y="30" width="50" height="45" rx="8" fill="url(#robotGradientThinking)" />
                      <line x1="50" y1="30" x2="50" y2="20" stroke="url(#robotGradientThinking)" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="50" cy="17" r="4" fill="url(#robotGradientThinking)" />
                      <circle cx="40" cy="45" r="5" fill="white" opacity="0.9" />
                      <circle cx="60" cy="45" r="5" fill="white" opacity="0.9" />
                      <circle cx="41" cy="45" r="2.5" fill="#1E293B" />
                      <circle cx="61" cy="45" r="2.5" fill="#1E293B" />
                      <path d="M 38 58 Q 50 65 62 58" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                      <rect x="18" y="42" width="7" height="12" rx="3" fill="url(#robotGradientThinking)" opacity="0.8" />
                      <rect x="75" y="42" width="7" height="12" rx="3" fill="url(#robotGradientThinking)" opacity="0.8" />
                    </svg>
                  </div>
                  <p className="text-sm animate-pulse">AI 正在思考中...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selection Toolbar - 選取模式時顯示 */}
        {isSelectMode && (
          <div className="px-4 py-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-2">
            <button
              onClick={selectAllMessages}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              全選
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                已選 {selectedMessages.size} 則
              </span>
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={shareSelectedMessages}
                disabled={selectedMessages.size === 0}
                className="px-4 py-2 text-sm font-medium bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                分享
              </button>
            </div>
          </div>
        )}

        {/* Input Area - 選取模式時隱藏 */}
        {!isSelectMode && (
          <div className="sticky bottom-0 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 z-10">
            {error && (
            <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg relative">
              {/* 關閉按鈕 */}
              <button
                onClick={() => setError(null)}
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
                            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
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
                    onClick={() => {
                      setShowErrorSuggestion(!showErrorSuggestion);
                      if (showErrorSuggestion) {
                        setShowTechnicalDetails(false);
                      }
                    }}
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
          )}
          <input
            ref={fileInputRef}
            id="dropzone-file"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
          {/* 相機拍照專用輸入（行動裝置使用） */}
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
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hasImage={!!image}
            hasHistory={apiHistory.length > 0}
            onUploadClick={handleUploadClick}
            onCameraClick={handleCameraClick}
          />
        </div>
        )}
        </div>
      </div>

      {/* Scroll Buttons - Fixed at bottom-right, above input area */}
      {apiKeys.length > 0 && (showScrollToTop || showScrollToBottom) && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
          {/* Scroll to Top Button - 只在不在頂部時顯示 */}
          <button
            onClick={scrollToTop}
            className={`w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/30 lg:bg-white/90 dark:bg-gray-800/30 dark:lg:bg-gray-800/90 lg:backdrop-blur-sm hover:bg-white/50 lg:hover:bg-white dark:hover:bg-gray-800/50 dark:lg:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${!showScrollToTop ? 'opacity-0 invisible pointer-events-none' : ''}`}
            title="回到頂部"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
            </svg>
          </button>

          {/* Scroll to Bottom Button - 只在不在底部時顯示 */}
          <button
            onClick={scrollToBottom}
            className={`w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/30 lg:bg-white/90 dark:bg-gray-800/30 dark:lg:bg-gray-800/90 lg:backdrop-blur-sm hover:bg-white/50 lg:hover:bg-white dark:hover:bg-gray-800/50 dark:lg:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${!showScrollToBottom ? 'opacity-0 invisible pointer-events-none' : ''}`}
            title="跳到最新"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Overlay for mobile */}
      {showSidebar && isThemeReady && <div onClick={() => { setShowSidebar(false); localStorage.setItem('sidebar-open', 'false'); }} className="fixed inset-0 bg-gradient-to-r from-black/40 to-black/20 z-[60] lg:hidden" />}
      
      {/* Camera modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
            <button
              onClick={handleCloseCamera}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors shadow-lg"
            >
              取消
            </button>
            <button
              onClick={handleTakePhoto}
              className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-all shadow-lg border-4 border-blue-500"
              title="拍照"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full"></div>
            </button>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full flex flex-col">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors z-10 shadow-lg"
              title="關閉"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center mt-4 text-white text-sm sm:text-base">
              點擊周圍或關閉按鈕退出預覽
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[80]">
          <div className="bg-white dark:bg-gray-800 w-full h-full overflow-y-auto flex flex-col">
            <Settings
              apiKeys={apiKeys}
              onKeysSaved={setApiKeys}
              prompts={prompts}
              selectedPromptId={selectedPromptId}
              onPromptsUpdated={handlePromptsUpdated}
              isDark={isDark}
              onThemeToggle={toggleTheme}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

