import { GoogleGenerativeAI, Part, Content } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// 存儲當前使用的 key 索引
let currentKeyIndex = 0;
let failedKeys = new Set<number>();

// Helper function to convert stream to buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

// 判斷是否屬於可重試且應輪換金鑰的錯誤
function isRetryableErrorMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("429") ||
    m.includes("too many requests") ||
    m.includes("quota") ||
    m.includes("service_disabled") ||
    m.includes("generative language api has not been used") ||
    m.includes("permission_denied") ||
    m.includes("api key not valid") ||
    m.includes("invalid api key") ||
    m.includes("request had insufficient authentication scopes")
  );
}

// 獲取下一個可用的 API key
function getNextAvailableKey(apiKeys: string[]): string {
  // 如果有可用的 key，直接用下一個
  for (let i = 0; i < apiKeys.length; i++) {
    const index = (currentKeyIndex + i) % apiKeys.length;
    if (!failedKeys.has(index)) {
      currentKeyIndex = index;
      return apiKeys[index];
    }
  }

  // 如果所有 key 都失敗過，重置並返回第一個
  failedKeys.clear();
  currentKeyIndex = 0;
  return apiKeys[0];
}

// 解析並清理環境變數中的 API Keys（移除意外的引號與空白）
function parseApiKeys(raw: string): string[] {
  return (raw.includes(",") ? raw.split(",") : [raw])
    .map(k => k.trim().replace(/^"+|"+$/g, ""))
    .filter(k => k.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const prompt = formData.get("prompt") as string;
    const historyString = formData.get("history") as string;

    const history: Content[] = historyString ? JSON.parse(historyString) : [];

    if (!prompt && !imageFile) {
      return NextResponse.json({ error: "No prompt or image file provided" }, { status: 400 });
    }

    // 取得所有 API keys
    const apiKeysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (!apiKeysString) {
      return NextResponse.json({ error: "Gemini API keys not configured" }, { status: 500 });
    }

    const apiKeys = parseApiKeys(apiKeysString);

    // 取得下一個可用的 key
    const apiKey = getNextAvailableKey(apiKeys);
    console.log(`Using API key index: ${currentKeyIndex} (total keys: ${apiKeys.length})`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 12000,
      },
    });

    const userParts: Part[] = [];

    // Add image part ONLY if it's the start of the conversation and an image exists
    if (history.length === 0 && imageFile) {
      const imageBuffer = await streamToBuffer(imageFile.stream());
      userParts.push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: imageFile.type,
        },
      });
    }

    // 如果是第一次對話，加入系統級的初始 Prompt
    const initialPrompt = `你是一位專業且有耐心的國中全科老師。請詳細分析題目並提供以下資訊：
1.  **最終答案**：清楚標示最後的答案。    
2.  **題目主旨**：這題在考什麼觀念？
3.  **解題步驟**：一步一步帶領學生解題，說明每一步的思考邏輯。
4.  **相關公式**：列出解這題會用到的所有公式，並簡單說明。

請用繁體中文、條列式回答。如果使用者有額外指定題目（例如：請解第三題），請優先處理。`;

    // 組合訊息：第一次對話加入 initialPrompt
    if (history.length === 0) {
      userParts.push({ text: initialPrompt });
    }
    
    // Add the user's text prompt
    userParts.push({ text: prompt });
    
    // 使用流式回應
    const stream = await chat.sendMessageStream(userParts);
    
    // 建立一個 ReadableStream 來流式傳送回應
    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for await (const chunk of stream.stream) {
          const chunkText = chunk.text();
          // 每個 chunk 都發送給客戶端，讓它逐字顯示
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    // 如果成功，移動到下一個 key 以負載均衡
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Error in Gemini API route:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isRetryableErrorMessage(errorMessage)) {
      // 將目前使用的 key 標記為失敗，並嘗試下一把
      failedKeys.add(currentKeyIndex);
      console.log("Retryable error detected. Marking key as failed and trying next one.");

      try {
        const apiKeysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
        if (!apiKeysString) {
          return NextResponse.json({ error: "Gemini API keys not configured" }, { status: 500 });
        }
        const apiKeys = parseApiKeys(apiKeysString);

        if (failedKeys.size >= apiKeys.length) {
          return NextResponse.json({
            error: "No available API keys. Please enable Generative Language API for each key's project or wait for quota reset."
          }, { status: 503 });
        }

        const retryKey = getNextAvailableKey(apiKeys);
        console.log(`Retrying with key index: ${currentKeyIndex}`);

        // 重新組裝請求資料
        const formData = await req.clone().formData();
        const imageFile = formData.get("image") as File | null;
        const prompt = formData.get("prompt") as string;
        const historyString = formData.get("history") as string;
        const history: Content[] = historyString ? JSON.parse(historyString) : [];

        const genAI = new GoogleGenerativeAI(retryKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chat = model.startChat({
          history: history,
          generationConfig: { maxOutputTokens: 12000 },
        });

        const userParts: Part[] = [];
        if (history.length === 0 && imageFile) {
          const imageBuffer = await streamToBuffer(imageFile.stream());
          userParts.push({
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: imageFile.type,
            },
          });
        }

        const initialPrompt = `你是一位專業且有耐心的國中全科老師。請詳細分析題目並提供以下資訊：
1.  **最終答案**：清楚標示最後的答案。    
2.  **題目主旨**：這題在考什麼觀念？
3.  **解題步驟**：一步一步帶領學生解題，說明每一步的思考邏輯。
4.  **相關公式**：列出解這題會用到的所有公式，並簡單說明。

請用繁體中文、條列式回答。如果使用者有額外指定題目（例如：請解第三題），請優先處理。`;

        if (history.length === 0) {
          userParts.push({ text: initialPrompt });
        }
        userParts.push({ text: prompt });

        // 使用流式回應進行重試
        const retryStream = await chat.sendMessageStream(userParts);
        
        const responseStream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for await (const chunk of retryStream.stream) {
              const chunkText = chunk.text();
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
            controller.close();
          },
        });

        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        return new NextResponse(responseStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
      }
    }

    return NextResponse.json({
      error: `Internal Server Error: ${errorMessage}`
    }, { status: 500 });
  }
}
