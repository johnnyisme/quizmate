// Custom hook for Gemini API integration
import { useCallback, useRef, useMemo, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import type { CustomPrompt } from '@/components/PromptSettings';
import { ModelType, ThinkingMode } from './useSettingsState';
import type { ChatError, DisplayMessage } from './useChatState';
import { fileToBase64 } from '@/utils/fileUtils';
import { getFriendlyErrorMessage } from '@/utils/errorHandling';
import type { Message as DBMessage, Session as DBSession } from '@/lib/db';

type GeminiPart = NonNullable<Content['parts']>[number];
type GeminiGenerationConfig = {
  temperature: number;
  maxOutputTokens: number;
  thinkingConfig?: {
    thinkingLevel: string;
    includeThoughts: boolean;
  };
};

type GeminiAPIProps = {
  apiKeys: string[];
  currentKeyIndex: number;
  selectedModel: ModelType;
  thinkingMode: ThinkingMode;
  prompts: CustomPrompt[];
  selectedPromptId: string;
  currentSessionId: string | null;
  apiHistory: Content[];
  chatContainerRef: RefObject<HTMLDivElement | null>;
  shouldScrollToQuestion: RefObject<boolean>;
  setCurrentKeyIndex: (index: number) => void;
  setDisplayConversation: Dispatch<SetStateAction<DisplayMessage[]>>;
  setApiHistory: Dispatch<SetStateAction<Content[]>>;
  setCurrentPrompt: (prompt: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (err: ChatError) => void;
  setCurrentSessionId: (id: string | null) => void;
  createNewSession: (title: string, messages: DBMessage[], image?: string) => Promise<DBSession>;
  addMessages: (messages: DBMessage[]) => Promise<void>;
  performCleanup: () => Promise<void>;
  loadSessions: () => Promise<void>;
};

// Generate title from first user message
const generateTitle = (text: string): string => {
  const cleaned = text.replace(/[*$\n]/g, " ").trim();
  return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
};

const isMissingSessionError = (err: unknown) => {
  if (!(err instanceof Error)) {
    return false;
  }

  return err.message === 'No active session' || /Session .+ not found/.test(err.message);
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
  
  // ✅ Cache Gemini clients to reuse HTTP connections (major performance boost!)
  const geminiClients = useMemo(() => {
    return apiKeys.map(key => new GoogleGenerativeAI(key));
  }, [apiKeys]);
  
  // ✅ Cache model instances per key to avoid re-initialization
  const geminiModels = useMemo(() => {
    return geminiClients.map(client => client.getGenerativeModel({ model: selectedModel }));
  }, [geminiClients, selectedModel]);

  const persistNewSession = useCallback(async (
    titleText: string,
    messages: DBMessage[],
    imageBase64?: string
  ) => {
    const title = generateTitle(titleText || "圖片問題");
    const newSession = await createNewSession(title, messages, imageBase64);
    setCurrentSessionId(newSession.id);
    localStorage.setItem('current-session-id', newSession.id);
    await performCleanup();
    await loadSessions();
  }, [createNewSession, setCurrentSessionId, performCleanup, loadSessions]);

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
      let lastError: unknown = null;

      for (let i = 0; i < apiKeys.length; i++) {
        const keyIndex = (currentKeyIndex + i) % apiKeys.length;
        try {
          // ✅ Use cached client and model instance (reuses HTTP connections)
          const model = geminiModels[keyIndex];

          // Prepare request content
          const parts: GeminiPart[] = [];

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
            const generationConfig: GeminiGenerationConfig = {
              temperature: 0.7,  // Lower for faster, more focused responses
              maxOutputTokens: 16384,  // Balanced: sufficient for complex problems, potentially faster response
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
          } catch (err) {
            const msg = err instanceof Error ? err.message.toLowerCase() : "";
            const thinkingLikelyUnsupported = msg.includes("thinking") || msg.includes("unknown name") || msg.includes("unrecognized");

            if (thinkingMode === "thinking" && thinkingLikelyUnsupported && selectedModel.includes("gemini-3")) {
              console.warn("Thinking not supported for this key/model, retrying without thinking.", err instanceof Error ? err.message : err);
              modelResponseText = await streamOnce(false);
            } else {
              throw err;
            }
          }

          success = true;
          // ✅ Load balancing: rotate to next key after success (distribute load across all keys)
          setCurrentKeyIndex((keyIndex + 1) % apiKeys.length);
          break;
        } catch (err) {
          lastError = err;
          const errorMessage = err instanceof Error ? err.message : undefined;
          const errorStatus = typeof err === 'object' && err !== null && 'status' in err ? (err as { status?: number }).status : undefined;
          const errorStatusText = typeof err === 'object' && err !== null && 'statusText' in err ? (err as { statusText?: string }).statusText : undefined;

          console.error(`API key ${keyIndex} failed:`, {
            message: errorMessage,
            status: errorStatus,
            statusText: errorStatusText,
            error: err
          });
          continue;
        }
      }

      if (!success) {
        const errorDetail = (lastError instanceof Error ? lastError.message : null)
          || (typeof lastError === 'object' && lastError !== null && 'statusText' in lastError ? ((lastError as { statusText?: string }).statusText || null) : null)
          || (typeof lastError === 'object' && lastError !== null && 'status' in lastError && (lastError as { status?: number }).status ? `HTTP ${(lastError as { status?: number }).status}` : null)
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
        await persistNewSession(promptText || "圖片問題", [userDBMsg, modelDBMsg], userDBMsg.imageBase64);
      } else {
        try {
          await addMessages([userDBMsg, modelDBMsg]);
        } catch (err) {
          if (!isMissingSessionError(err)) {
            throw err;
          }

          console.warn("Active session was unavailable; creating a new session instead.", err);
          await persistNewSession(promptText || "圖片問題", [userDBMsg, modelDBMsg], userDBMsg.imageBase64);
        }
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
          } as Content;
          setApiHistory((prev: Content[]) => [...prev, userWithImage, modelApiPart]);
        } catch (e) {
          const fallbackUser = { role: "user", parts: [{ text: apiPrompt }] };
          setApiHistory((prev: Content[]) => [...prev, fallbackUser as Content, modelApiPart]);
        }
      } else {
        const userApiPart = { role: "user", parts: [{ text: apiPrompt }] };
        setApiHistory((prev: Content[]) => [...prev, userApiPart as Content, modelApiPart]);
      }
    } catch (err) {
      const friendlyError = getFriendlyErrorMessage(err);
      const technicalDetails = err instanceof Error
        ? (err.stack || err.message)
        : JSON.stringify(err, null, 2);

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
    persistNewSession,
  ]);

  return {
    handleSubmit,
  };
};
