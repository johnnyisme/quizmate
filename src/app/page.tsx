"use client";
import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "katex/dist/katex.min.css";
import { useSessionStorage, useSessionHistory } from "@/lib/useSessionStorage";
import type { Message as DBMessage } from "@/lib/db";
import ApiKeySetup from "@/components/ApiKeySetup";
import Settings from "@/components/Settings";
import PromptSettings, { DEFAULT_PROMPT, type CustomPrompt } from "@/components/PromptSettings";
import MessageBubble from "@/components/MessageBubble";

// 定義顯示在介面上的訊息類型
type DisplayMessage = {
  role: "user" | "model";
  text: string;
  image?: string;
};

type ModelType = "gemini-3-flash-preview" | "gemini-2.5-flash" | "gemini-2.5-pro";

type ThinkingMode = "fast" | "thinking";

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
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<ModelType>("gemini-2.5-flash");
  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>("fast");
  const [showSettings, setShowSettings] = useState(false);
  const [prompts, setPrompts] = useState<CustomPrompt[]>([DEFAULT_PROMPT]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("default");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [displayConversation, setDisplayConversation] = useState<DisplayMessage[]>([]);
  const [apiHistory, setApiHistory] = useState<Content[]>([]); // 用於傳送給 API
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; suggestion?: string; technicalDetails?: string } | null>(null);
  const [showErrorSuggestion, setShowErrorSuggestion] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isThemeReady, setIsThemeReady] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelMessageIndexRef = useRef<number | null>(null);
  const errorSuggestionRef = useRef<HTMLDivElement>(null);
  const errorTechnicalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editingContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const shouldScrollToQuestion = useRef<boolean>(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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
  }, [isLoading, displayConversation]);

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
  }, [showErrorSuggestion]);

  useEffect(() => {
    if (showTechnicalDetails && errorTechnicalRef.current) {
      setTimeout(() => {
        errorTechnicalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showTechnicalDetails]);

  // 展開錯誤詳情時自動滾動到內容
  useEffect(() => {
    if (showErrorSuggestion && errorSuggestionRef.current) {
      setTimeout(() => {
        errorSuggestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showErrorSuggestion]);

  useEffect(() => {
    if (showTechnicalDetails && errorTechnicalRef.current) {
      setTimeout(() => {
        errorTechnicalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showTechnicalDetails]);

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

  // 初始化主題
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    document.documentElement.classList.toggle('light', !shouldBeDark);
    
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
  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
    localStorage.setItem('selected-model', model);
  };

  // 更新 prompts
  const handlePromptsUpdated = (updatedPrompts: CustomPrompt[], newSelectedId?: string) => {
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
  };
  // 切換 prompt
  const handlePromptChange = (promptId: string) => {
    const ensured = prompts.map(p => ({ ...p, isDefault: p.id === promptId }));
    setPrompts(ensured);
    localStorage.setItem('custom-prompts', JSON.stringify(ensured));
    setSelectedPromptId(promptId);
    localStorage.setItem('selected-prompt-id', promptId);
  };

  // Session management hooks
  const { session, createNewSession, addMessages, updateTitle } = useSessionStorage(currentSessionId);
  const { sessions: sessionList, loadSessions, removeSession, performCleanup } = useSessionHistory();

  // Session title editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Load session when switching
  useEffect(() => {
    if (session) {
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

      // 恢復滾動位置
      const savedScrollPos = localStorage.getItem(`scroll-pos-${session.id}`);
      if (savedScrollPos && chatContainerRef.current) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = parseInt(savedScrollPos, 10);
          }
        }, 100); // 等待 DOM 渲染完成
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
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      // 重置對話並開始新 session
      setDisplayConversation([]);
      setApiHistory([]);
      setCurrentSessionId(null);
      setError(null);
    }
  };

  // Start new conversation
  const handleNewChat = () => {
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
  };

  // Switch to existing session
  const handleSwitchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // 儲存當前 session ID 以便頁面重載後恢復
    localStorage.setItem('current-session-id', sessionId);
    // Close sidebar on mobile only
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
      localStorage.setItem('sidebar-open', 'false');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeSession(sessionId);
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Start editing session title
  const handleStartEditTitle = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 如果不是當前對話,先切換到該對話
    if (currentSessionId !== sessionId) {
      setCurrentSessionId(sessionId);
    }
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  // Save edited title
  const handleSaveTitle = async (sessionId: string) => {
    if (!editingTitle.trim()) return;
    
    try {
      await updateTitle(editingTitle.trim());
      await loadSessions(); // Refresh session list
      setEditingSessionId(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // Handle Enter key to save, Escape to cancel
  const handleTitleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle(sessionId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

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
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 處理相機按鈕點擊
  const handleCameraClick = () => {
    if (isMobile()) {
      // 行動裝置：使用原生檔案選擇器（會自動提供拍照選項）
      cameraInputRef.current?.click();
    } else {
      // 桌面：開啟網頁攝影機
      handleOpenCamera();
    }
  };

  // 開啟攝影機（僅限桌面）
  const handleOpenCamera = async () => {
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
  };

  // 關閉攝影機
  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // 拍照
  const handleTakePhoto = () => {
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
  };

  // 複製訊息內容
  const handleCopyMessage = async (text: string, index: number) => {
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
  };

  // 長按進入選取模式
  const handleLongPressStart = (index: number) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelectMode(true);
      setSelectedMessages(new Set([index]));
    }, 500); // 500ms 長按
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 切換訊息選取狀態
  const toggleMessageSelect = (index: number) => {
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
  };

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
  const enterShareMode = (index: number) => {
    setIsSelectMode(true);
    setSelectedMessages(new Set([index]));
  };

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
  const handleSubmit = async () => {
    if (apiKeys.length === 0) {
      setError({ message: "請先設置 API keys" });
      return;
    }

    const promptText = currentPrompt.trim();
    const promptForRetry = promptText;

    if (!promptText && !image) {
      setError({ message: "請輸入問題或上傳圖片" });
      return;
    }

    setIsLoading(true);
    setError(null);

    // --- 更新介面對話，只加入用戶訊息 ---
    const displayText = promptText || "[圖片問題]";
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

    const apiPrompt = promptText || "請分析這張圖片並解答題目";
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
          console.error(`API key ${keyIndex} failed:`, err.message);
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
      
      // 移除 padding
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
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessionList.map((s) => (
            <div 
              key={s.id} 
              onClick={() => editingSessionId !== s.id && handleSwitchSession(s.id)} 
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
                        onKeyDown={(e) => handleTitleKeyDown(e, s.id)}
                        maxLength={30}
                        autoFocus
                        className="flex-1 min-w-0 text-sm font-medium bg-white dark:bg-gray-800 border border-blue-500 dark:border-blue-400 rounded px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSaveTitle(s.id); }} 
                        className="p-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex-shrink-0"
                        title="保存"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} 
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
                {/* 按鈕區：桌面端 hover 顯示，移動端始終顯示（因無 hover），編輯時隱藏（改在 input 右側顯示） */}
                {editingSessionId !== s.id && (
                  <div className="flex items-center gap-1 transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                      <button 
                        onClick={(e) => handleStartEditTitle(s.id, s.title, e)} 
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-500 dark:text-blue-400 transition-colors"
                        title="編輯標題"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSession(s.id, e)} 
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
          ))}
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
          <div className="flex items-center gap-1.5 sm:gap-2">
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
            <button 
              title="上傳考卷" 
              onClick={handleUploadClick} 
              className={`flex-shrink-0 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 overflow-hidden ${inputFocused ? 'w-0 opacity-0 pointer-events-none' : 'w-9 opacity-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button 
              title="拍照" 
              onClick={handleCameraClick} 
              className={`flex-shrink-0 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 overflow-hidden ${inputFocused ? 'w-0 opacity-0 pointer-events-none' : 'w-9 opacity-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <textarea
              ref={textareaRef}
              id="prompt-input"
              name="prompt"
              value={currentPrompt}
              onChange={(e) => {
                setCurrentPrompt(e.target.value);
                // 自動調整高度
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  const scrollHeight = textareaRef.current.scrollHeight;
                  const lineHeight = 22; // 約等於 text-base 的行高
                  const maxHeight = lineHeight * 3; // 3 行
                  textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onFocus={() => {
                setInputFocused(true);
                // 點入時根據內容重新計算高度
                if (textareaRef.current && currentPrompt) {
                  textareaRef.current.style.height = 'auto';
                  const scrollHeight = textareaRef.current.scrollHeight;
                  const lineHeight = 22;
                  const maxHeight = lineHeight * 3;
                  textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                }
              }}
              onBlur={() => {
                setInputFocused(false);
                // 鍵盤收起時縮回到一行
                if (textareaRef.current) {
                  textareaRef.current.style.height = '36px';
                }
              }}
              placeholder={apiHistory.length > 0 ? "進行追問..." : "輸入問題或上傳圖片"}
              rows={1}
              className="flex-1 min-w-0 px-3 py-1.5 text-sm border dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-shadow resize-none overflow-y-auto leading-5"
              style={{ minHeight: '36px', maxHeight: '66px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!currentPrompt.trim() && !image)}
              className="flex-shrink-0 h-9 px-3 sm:px-4 text-sm bg-blue-500 dark:bg-blue-600 text-white rounded-full font-semibold whitespace-nowrap hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              傳送
            </button>
          </div>
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

