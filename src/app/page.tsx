"use client";
import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useSessionStorage, useSessionHistory } from "@/lib/useSessionStorage";
import type { Message as DBMessage } from "@/lib/db";
import ApiKeySetup from "@/components/ApiKeySetup";

// 定義顯示在介面上的訊息類型
type DisplayMessage = {
  role: "user" | "model";
  text: string;
  image?: string;
};

type ModelType = "gemini-3-flash-preview" | "gemini-2.5-flash" | "gemini-2.5-pro";

export default function HomePage() {
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<ModelType>("gemini-3-flash-preview");
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [displayConversation, setDisplayConversation] = useState<DisplayMessage[]>([]);
  const [apiHistory, setApiHistory] = useState<Content[]>([]); // 用於傳送給 API
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isThemeReady, setIsThemeReady] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 初始化 API keys 和模型選擇
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
      const defaultModel: ModelType = "gemini-3-flash-preview";
      setSelectedModel(defaultModel);
      localStorage.setItem("selected-model", defaultModel);
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

  // Session management hooks
  const { session, createNewSession, addMessages } = useSessionStorage(currentSessionId);
  const { sessions: sessionList, loadSessions, removeSession, performCleanup } = useSessionHistory();

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
    }
  }, [session]);

  // Generate title from first user message
  const generateTitle = (text: string): string => {
    const cleaned = text.replace(/[*$\n]/g, " ").trim();
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
  };

  // 渲染包含數學公式的文字
  const renderMathInText = (text: string): string => {
    try {
      // 先處理 **粗體** 標記
      let processedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      
      // 處理換行
      processedText = processedText.replace(/\n/g, "<br />");
      
      // 處理 display math ($$...$$)
      processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, { displayMode: true, throwOnError: false });
        } catch (e) {
          return match; // 如果渲染失敗，返回原始文字
        }
      });
      
      // 處理 inline math ($...$)
      processedText = processedText.replace(/\$([^$]+)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, { displayMode: false, throwOnError: false });
        } catch (e) {
          return match; // 如果渲染失敗，返回原始文字
        }
      });
      
      return processedText;
    } catch (e) {
      console.error("Error rendering math:", e);
      return text;
    }
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
      setError("");
    }
  };

  // Start new conversation
  const handleNewChat = () => {
    setImage(null);
    setImageUrl("");
    setDisplayConversation([]);
    setApiHistory([]);
    setCurrentSessionId(null);
    setError("");
    setShowSidebar(false); // collapse sidebar on mobile; desktop layout unaffected (lg override)
  };

  // Switch to existing session
  const handleSwitchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSidebar(false);
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

  // 觸發檔案選擇
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 處理表單提交 (傳送訊息) - 直接使用前端 Gemini API + 模型選擇 + key 輪轉
  const handleSubmit = async () => {
    if (apiKeys.length === 0) {
      setError("請先設置 API keys");
      return;
    }

    const promptText = currentPrompt.trim();
    const promptForRetry = promptText;

    if (!promptText && !image) {
      setError("請輸入問題或上傳圖片");
      return;
    }

    setIsLoading(true);
    setError("");

    // --- 更新介面對話 ---
    const displayText = promptText || "[圖片問題]";
    const userMessage: DisplayMessage = { role: "user", text: displayText };
    if (apiHistory.length === 0 && image) {
      userMessage.image = imageUrl;
    }
    setDisplayConversation(prev => [...prev, userMessage]);
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 0);

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
            systemPrompt = `你是一位專業且有耐心的國中全科老師。請詳細分析題目並**嚴格按照以下順序**提供資訊：

1.  **最終答案**：清楚標示最後的答案。    
2.  **題目主旨**：這題在考什麼觀念？
3.  **解題步驟**：一步一步帶領學生解題，說明每一步的思考邏輯。
4.  **相關公式**：列出解這題會用到的所有公式，並簡單說明。

**重要**：請務必按照 1→2→3→4 的順序回答，不要調整順序。使用繁體中文、條列式回答。如果使用者有額外指定題目（例如：請解第三題），請優先處理。`;
          }

          // 呼叫 Gemini API
          const generationConfig: any = {
            temperature: 1.0,
            maxOutputTokens: 65536,
          };

          const response = await model.generateContent(
            {
              contents: apiHistory.length === 0 && systemPrompt
                ? [{ role: "user", parts: [{ text: systemPrompt }] }, { role: "user", parts }]
                : [...apiHistory, { role: "user", parts }],
              generationConfig,
            }
          );

          const responseText = response.response.text();
          modelResponseText = responseText;
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

      // 添加 AI 回應到顯示對話
      const modelMessage: DisplayMessage = {
        role: "model",
        text: modelResponseText,
      };
      setDisplayConversation(prev => [...prev, modelMessage]);

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
        }
      }, 0);

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
      setError(err.message);
      setDisplayConversation(prev => prev.slice(0, -1));
      setCurrentPrompt(promptForRetry);
    } finally {
      setIsLoading(false);
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
          <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 z-[70] pointer-events-auto w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col`}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 dark:text-gray-200">對話歷史</h2>
                <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
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
            <div key={s.id} onClick={() => handleSwitchSession(s.id)} className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${currentSessionId === s.id ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(s.updatedAt).toLocaleDateString('zh-TW')}</p>
                </div>
                <button onClick={(e) => handleDeleteSession(s.id, e)} className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Centered with sidebar consideration */}
      <div className="absolute inset-0 lg:left-64 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto">
        <div className="w-full max-w-2xl h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col">
          <div className="px-2 sm:px-4 py-3 border-b dark:border-gray-700 flex-shrink-0 flex items-center gap-2 sm:gap-3">
            {/* Left: Sidebar toggle button (mobile only) */}
            <button 
              onClick={() => setShowSidebar(true)} 
              className="lg:hidden flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
              title="開啟側邊欄"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            
            {/* Center: Logo and Title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center">
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
              <h1 className="hidden sm:block text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 truncate">
                QuizMate - AI 互動家教
              </h1>
            </div>
            
            {/* Right: Model selector and control buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <select 
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value as ModelType)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded border h-8 sm:h-10 transition-colors ${
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
              
              <button 
                onClick={() => setShowApiKeySetup(true)}
                className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                title="API 金鑰設定"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <button 
                onClick={toggleTheme}
                className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                title={isDark ? '切換至淺色模式' : '切換至深色模式'}
              >
                {isDark ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
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
            {displayConversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-lg p-3 rounded-lg shadow-md ${msg.role === 'user' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="User upload" 
                      className="rounded-lg mb-2 max-h-60 cursor-pointer hover:opacity-90 transition-opacity" 
                      onClick={() => setPreviewImage(msg.image!)}
                    />
                  )}
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMathInText(msg.text) }} />
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="max-w-lg p-3 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        <p className="text-sm animate-pulse">AI 正在思考中...</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              id="dropzone-file"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
            {/* 相機拍照專用輸入（Android Chrome 會直接開啟相機） */}
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
              title="上傳圖片" 
              onClick={handleUploadClick} 
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1.586-1.586a2 2 0 00-2.828 0L6 14" /></svg>
            </button>
            <button 
              title="拍照" 
              onClick={() => cameraInputRef.current?.click()} 
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2-2h6l2 2h4v12H3V7zm9 2a5 5 0 110 10 5 5 0 010-10z" /></svg>
            </button>
            <input
              type="text"
              id="prompt-input"
              name="prompt"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
              placeholder={apiHistory.length > 0 ? "進行追問..." : "輸入問題或直接上傳圖片"}
              className="flex-1 min-w-0 h-10 px-4 py-2 border dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-shadow"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!currentPrompt.trim() && !image)}
              className="flex-shrink-0 h-10 px-4 sm:px-5 bg-blue-500 dark:bg-blue-600 text-white rounded-full font-semibold whitespace-nowrap hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              傳送
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && isThemeReady && <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-gradient-to-r from-black/40 to-black/20 z-[60] lg:hidden" />}
      
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

      {/* API Key Setup Modal */}
      {showApiKeySetup && apiKeys.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ApiKeySetup 
              onKeysSaved={setApiKeys} 
              isDark={isDark}
              onClose={() => setShowApiKeySetup(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
}

