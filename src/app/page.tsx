"use client";
import { useState, useRef, useEffect } from "react";
import { Content } from "@google/generative-ai";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useSessionStorage, useSessionHistory } from "@/lib/useSessionStorage";
import type { Message as DBMessage } from "@/lib/db";

// 定義顯示在介面上的訊息類型
type DisplayMessage = {
  role: "user" | "model";
  text: string;
  image?: string;
};

export default function HomePage() {
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

  // 初始化主題
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    document.documentElement.classList.toggle('light', !shouldBeDark);
    
    // 短暫延遲後顯示內容，避免閃爍
    setTimeout(() => setIsThemeReady(true), 50);
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

  // 處理表單提交 (傳送訊息)
  const handleSubmit = async () => {
    const promptText = currentPrompt.trim();
    const promptForRetry = promptText; // 保留原始輸入，若失敗可還原

    // 允許只有圖片或只有文字，但至少要有一個
    if (!promptText && !image) {
      setError("請輸入問題或上傳圖片");
      return;
    }

    setIsLoading(true);
    setError("");

    // --- 更新介面對話 ---
    const displayText = promptText || "[圖片問題]";
    const userMessage: DisplayMessage = { role: "user", text: displayText };
    // 只有第一則訊息需要顯示圖片
    if (apiHistory.length === 0 && image) {
      userMessage.image = imageUrl;
    }
    setDisplayConversation(prev => [...prev, userMessage]);
    // 讓視窗在使用者送出新問題時捲到該訊息位置（不影響後續 AI 回覆的閱讀）
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 0);
    
    // --- 準備傳送給 API 的資料 ---
    const formData = new FormData();
    const apiPrompt = promptText || "請分析這張圖片並解答題目";
    formData.append("prompt", apiPrompt);
    formData.append("history", JSON.stringify(apiHistory));
    // 只有第一則訊息需要傳送圖片檔案
    if (apiHistory.length === 0 && image) {
      formData.append("image", image);
    }

    // 清空輸入框，但保持圖片以供後續對話使用
    setCurrentPrompt("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API 請求失敗");
      }

      // 處理流式回應
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("無法讀取回應流");
      }

      const decoder = new TextDecoder();
      let modelResponseText = "";

      // 先添加一個空的 AI 回應訊息，然後逐步更新
      const modelMessage: DisplayMessage = { role: "model", text: "" };
      setDisplayConversation(prev => [...prev, modelMessage]);

      // 讀取流式回應並逐字更新 UI
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        modelResponseText += chunk;

        // 實時更新最後一條 AI 訊息
        setDisplayConversation(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === "model") {
            updated[updated.length - 1].text = modelResponseText;
          }
          return updated;
        });

        // 滾動到最新訊息
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
          }
        }, 0);
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
        // Create new session
        const title = generateTitle(promptText || "圖片問題");
        
        // Convert image to base64 for storage
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
        await performCleanup(); // LRU cleanup
        await loadSessions(); // Refresh list
      } else {
        // Append to existing session
        await addMessages([userDBMsg, modelDBMsg]);
      }

      // --- 更新用於傳送給 API 的歷史紀錄 ---
      const modelApiPart = { role: "model", parts: [{ text: modelResponseText }] };
      // 若是第一則對話且有圖片，將圖片的 inlineData 一併放入歷史，讓後續追問仍可引用圖片
      if (apiHistory.length === 0 && image) {
        try {
          const base64 = await fileToBase64(image);
          const initialUserWithImage = {
            role: "user",
            parts: [
              { inlineData: { data: base64, mimeType: image.type } },
              { text: apiPrompt },
            ],
          };
          setApiHistory([initialUserWithImage, modelApiPart]);
        } catch (e) {
          // 如果轉檔失敗，至少保留文字歷史
          const fallbackUser = { role: "user", parts: [{ text: apiPrompt }] };
          setApiHistory([fallbackUser, modelApiPart]);
        }
      } else {
        const userApiPart = { role: "user", parts: [{ text: apiPrompt }] };
        setApiHistory(prev => [...prev, userApiPart, modelApiPart]);
      }

    } catch (err: any) {
      setError(err.message);
      // 如果出錯，將剛才送出的訊息從對話中移除，讓使用者可以重試
      setDisplayConversation(prev => prev.slice(0, -1));
      // 將原本的提問放回輸入框，方便再次送出
      setCurrentPrompt(promptForRetry);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
      {/* Loading overlay */}
      {!isThemeReady && (
        <div className="fixed inset-0 bg-gray-300 dark:bg-gray-800 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 dark:text-gray-300">載入中...</p>
          </div>
        </div>
      )}

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
          <div className="px-4 py-3 border-b dark:border-gray-700 flex-shrink-0 flex items-center justify-between">
            {/* Left: Sidebar toggle button (mobile only) */}
            <div className="flex items-center justify-start w-10 h-10">
              <button 
                onClick={() => setShowSidebar(true)} 
                className="lg:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                title="開啟側邊欄"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
            
            {/* Center: Logo and Title */}
            <div className="flex items-center gap-2 justify-center flex-1">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
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
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
                QuizMate - AI 互動家教
              </h1>
            </div>
            
            {/* Right: Theme toggle button */}
            <div className="flex items-center justify-end w-10 h-10">
              <button 
                onClick={toggleTheme}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                title={isDark ? '切換至淺色模式' : '切換至深色模式'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
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
              className="absolute top-4 right-4 w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10"
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
  );
}

