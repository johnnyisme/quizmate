// Custom hook for Gemini API integration
import { useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ModelType, ThinkingMode } from './useSettingsState';
import { DisplayMessage } from './useChatState';
import { fileToBase64 } from '@/utils/fileUtils';
import { getFriendlyErrorMessage } from '@/utils/errorHandling';
import type { Message as DBMessage } from '@/lib/db';

type GeminiAPIProps = {
  apiKeys: string[];
  currentKeyIndex: number;
  selectedModel: ModelType;
  thinkingMode: ThinkingMode;
  prompts: any[];
  selectedPromptId: string;
  currentSessionId: string | null;
  apiHistory: any[];
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  shouldScrollToQuestion: React.RefObject<boolean>;
  setCurrentKeyIndex: (index: number) => void;
  setDisplayConversation: (conv: any) => void;
  setApiHistory: (hist: any) => void;
  setCurrentPrompt: (prompt: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (err: any) => void;
  setCurrentSessionId: (id: string | null) => void;
  createNewSession: (title: string, messages: DBMessage[], image?: string) => Promise<any>;
  addMessages: (messages: DBMessage[]) => Promise<void>;
  performCleanup: () => Promise<void>;
  loadSessions: () => Promise<void>;
};

export const useGeminiAPI = ({
  apiKeys,
  currentKeyIndex,
  selectedModel,
  thinkingMode,
  prompts,
  selectedPromptId,
  currentSessionId,
  apiHistory,
  chatContainerRef,
  shouldScrollToQuestion,
  setCurrentKeyIndex,
  setDisplayConversation,
  setApiHistory,
  setCurrentPrompt,
  setIsLoading,
  setError,
  setCurrentSessionId,
  createNewSession,
  addMessages,
  performCleanup,
  loadSessions,
}: GeminiAPIProps) => {

  const modelMessageIndexRef = useRef<number | null>(null);

  // Generate title from first user message
  const generateTitle = (text: string): string => {
    const cleaned = text.replace(/[*$\n]/g, " ").trim();
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
  };

  // Handle form submission (send message)
  const handleSubmit = useCallback(async (
    promptText: string | undefined,
    image: File | null,
    imageUrl: string,
    setImage: (img: File | null) => void,
    setImageUrl: (url: string) => void
  ) => {
    if (apiKeys.length === 0) {
      setError({ message: "請先設置 API keys" });
      return;
    }

    const text = promptText ?? "";
    const promptForRetry = text;

    if (!text && !image) {
      setError({ message: "請輸入問題或上傳圖片" });
      return;
    }

    setIsLoading(true);
    setError(null);

    // Update UI conversation, add user message only
    const displayText = text || "[圖片問題]";
    const userMessage: DisplayMessage = { role: "user", text: displayText };
    if (image) {
      userMessage.image = imageUrl;
    }
    
    setDisplayConversation((prev: DisplayMessage[]) => [...prev, userMessage]);

    // Mark need to scroll to new question
    shouldScrollToQuestion.current = true;

    // Directly set padding (don't rely on useEffect)
    if (chatContainerRef.current) {
      chatContainerRef.current.style.paddingBottom = '80vh';
    }

    const apiPrompt = text || "請分析這張圖片並解答題目";
    setCurrentPrompt("");
    
    // Save image reference for later use
    const currentImage = image;
    const currentImageUrl = imageUrl;
    
    // Immediately clear image state, allow user to upload next image
    setImage(null);
    setImageUrl("");

    try {
      // Try current API key, rotate if failed
      let modelResponseText = "";
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < apiKeys.length; i++) {
        const keyIndex = (currentKeyIndex + i) % apiKeys.length;
        try {
          const client = new GoogleGenerativeAI(apiKeys[keyIndex]);
          const model = client.getGenerativeModel({ model: selectedModel });

          // Prepare request content
          const parts: any[] = [];

          // If there's an image, add it
          if (currentImage) {
            const base64 = await fileToBase64(currentImage);
            parts.push({
              inlineData: {
                data: base64,
                mimeType: currentImage.type || "image/jpeg",
              },
            });
          }

          parts.push({ text: apiPrompt });

          // Prepare system prompt (add on first message)
          let systemPrompt = "";
          if (apiHistory.length === 0) {
            const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
            systemPrompt = selectedPrompt?.content || "";
          }

          // Call Gemini API (supports streaming)
          const buildRequestPayload = (withThinking: boolean) => {
            const generationConfig: any = {
              temperature: 0.7,  // Lower for faster, more focused responses
              maxOutputTokens: 65536,
            };

            if (withThinking && selectedModel.includes("gemini-3")) {
              generationConfig.thinkingConfig = {
                thinkingLevel: "high",
                includeThoughts: false,  // Thoughts are in English, not user-friendly for students
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
            setDisplayConversation((prev: DisplayMessage[]) => {
              const lastMsg = prev[prev.length - 1];
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
            let batchBuffer = "";
            let lastUpdateTime = Date.now();
            const BATCH_INTERVAL_MS = 50; // Update UI every 50ms max (20fps)

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (!chunkText) continue;
              aggregated += chunkText;
              batchBuffer += chunkText;
              
              // Batch updates: only update UI every 50ms or when buffer is large
              const now = Date.now();
              if (now - lastUpdateTime >= BATCH_INTERVAL_MS || batchBuffer.length > 100) {
                const textToAdd = batchBuffer;
                batchBuffer = "";
                lastUpdateTime = now;
                updateModelMessage((prevText) => prevText + textToAdd);
              }
            }
            
            // Flush remaining buffer
            if (batchBuffer) {
              updateModelMessage((prevText) => prevText + batchBuffer);
            }

            // Fallback: if stream has no content, fall back to full response text
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
          setCurrentKeyIndex(keyIndex);
          break;
        } catch (err: any) {
          lastError = err;
          console.error(`API key ${keyIndex} failed:`, {
            message: err?.message,
            status: err?.status,
            statusText: err?.statusText,
            error: err
          });
          continue;
        }
      }

      if (!success) {
        const errorDetail = lastError?.message 
          || lastError?.statusText 
          || (lastError?.status ? `HTTP ${lastError.status}` : null)
          || JSON.stringify(lastError)
          || "未知錯誤";
        
        throw new Error(`所有 API keys 都失敗。最後錯誤: ${errorDetail}`);
      }

      // Save to IndexedDB
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

      // If there's an image, save to message
      if (currentImage) {
        try {
          const base64Data = await fileToBase64(currentImage);
          const imageB64 = `data:${currentImage.type};base64,${base64Data}`;
          userDBMsg.imageBase64 = imageB64;
        } catch (e) {
          console.error("Failed to convert image to base64:", e);
        }
      }

      if (!currentSessionId) {
        const title = generateTitle(promptText || "圖片問題");
        const sessionImage = userDBMsg.imageBase64;

        const newSession = await createNewSession(title, [userDBMsg, modelDBMsg], sessionImage);
        setCurrentSessionId(newSession.id);
        localStorage.setItem('current-session-id', newSession.id);
        await performCleanup();
        await loadSessions();
      } else {
        await addMessages([userDBMsg, modelDBMsg]);
      }

      // Update API history
      const modelApiPart = { role: "model", parts: [{ text: modelResponseText }] };
      if (currentImage) {
        try {
          const base64 = await fileToBase64(currentImage);
          const userWithImage = {
            role: "user",
            parts: [
              { inlineData: { data: base64, mimeType: currentImage.type || "image/jpeg" } },
              { text: apiPrompt },
            ],
          };
          setApiHistory((prev: any[]) => [...prev, userWithImage, modelApiPart]);
        } catch (e) {
          const fallbackUser = { role: "user", parts: [{ text: apiPrompt }] };
          setApiHistory((prev: any[]) => [...prev, fallbackUser, modelApiPart]);
        }
      } else {
        const userApiPart = { role: "user", parts: [{ text: apiPrompt }] };
        setApiHistory((prev: any[]) => [...prev, userApiPart, modelApiPart]);
      }
    } catch (err: any) {
      const friendlyError = getFriendlyErrorMessage(err);
      const technicalDetails = err?.stack || JSON.stringify(err, null, 2);
      setError({ 
        message: friendlyError.message,
        suggestion: friendlyError.suggestion,
        technicalDetails: technicalDetails
      });
      setDisplayConversation((prev: DisplayMessage[]) => prev.slice(0, -1));
      setCurrentPrompt(promptForRetry);
      
      // Restore image state on send failure
      if (currentImage) {
        setImage(currentImage);
        setImageUrl(currentImageUrl);
      }
    } finally {
      modelMessageIndexRef.current = null;
      setIsLoading(false);
      
      // Remove padding (let browser handle scroll naturally)
      if (chatContainerRef.current) {
        chatContainerRef.current.style.paddingBottom = '0px';
      }
    }
  }, [
    apiKeys,
    currentKeyIndex,
    selectedModel,
    thinkingMode,
    prompts,
    selectedPromptId,
    currentSessionId,
    apiHistory,
    chatContainerRef,
    shouldScrollToQuestion,
    setCurrentKeyIndex,
    setDisplayConversation,
    setApiHistory,
    setCurrentPrompt,
    setIsLoading,
    setError,
    setCurrentSessionId,
    createNewSession,
    addMessages,
    performCleanup,
    loadSessions,
  ]);

  return {
    handleSubmit,
  };
};
