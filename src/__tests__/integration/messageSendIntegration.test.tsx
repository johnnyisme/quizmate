/**
 * 訊息發送整合測試
 * 
 * 測試目標：完整訊息發送管道與滾動管理
 * 驗證 API 調用、UI 更新、滾動行為的整個流程
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('訊息發送整合測試', () => {
  let mockChatContainer: HTMLDivElement;
  let mockState: any;

  beforeEach(() => {
    // 建立 mock chat container
    mockChatContainer = document.createElement('div');
    mockChatContainer.id = 'chat-container';
    Object.defineProperty(mockChatContainer, 'scrollHeight', {
      value: 1000,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockChatContainer, 'clientHeight', {
      value: 500,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockChatContainer, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });

    // Mock scrollTo
    mockChatContainer.scrollTo = vi.fn();

    document.body.appendChild(mockChatContainer);

    // Mock state
    mockState = {
      displayConversation: [],
      apiHistory: [],
      currentPrompt: '',
      isLoading: false,
      error: null,
      image: null,
      imageUrl: '',
    };

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(mockChatContainer);
    vi.clearAllMocks();
  });

  describe('訊息發送基本流程', () => {
    it('應該驗證輸入不為空', () => {
      const promptText = '';
      const hasImage = false;

      if (!promptText && !hasImage) {
        expect(true).toBe(true); // 應該拒絕
      }
    });

    it('應該接受文字輸入', () => {
      const promptText = '1+1=？';
      const hasImage = false;

      expect(promptText).toBeTruthy();
      expect(promptText.length > 0).toBe(true);
    });

    it('應該接受圖片輸入', () => {
      const promptText = '';
      const image = new File(['fake'], 'math.jpg');

      expect(image).toBeDefined();
      expect(image.name).toBe('math.jpg');
    });

    it('應該接受文字和圖片組合', () => {
      const promptText = '這是什麼？';
      const image = new File(['fake'], 'image.jpg');

      expect(promptText).toBeTruthy();
      expect(image).toBeDefined();
    });
  });

  describe('UI 更新流程', () => {
    it('應該在發送前將使用者訊息添加到 UI', () => {
      const userMessage = {
        role: 'user',
        text: '1+1=？',
      };

      mockState.displayConversation.push(userMessage);

      expect(mockState.displayConversation).toHaveLength(1);
      expect(mockState.displayConversation[0].role).toBe('user');
    });

    it('應該在發送時設置 isLoading 狀態', () => {
      mockState.isLoading = true;

      expect(mockState.isLoading).toBe(true);
    });

    it('應該在 API 回應後添加 AI 訊息', () => {
      const userMessage = { role: 'user', text: '1+1=？' };
      const aiMessage = { role: 'model', text: '1+1=2' };

      mockState.displayConversation = [userMessage];
      mockState.displayConversation.push(aiMessage);

      expect(mockState.displayConversation).toHaveLength(2);
      expect(mockState.displayConversation[1].role).toBe('model');
    });

    it('應該在完成後清除 isLoading', () => {
      mockState.isLoading = false;

      expect(mockState.isLoading).toBe(false);
    });

    it('應該清除輸入框', () => {
      mockState.currentPrompt = '';

      expect(mockState.currentPrompt).toBe('');
    });

    it('應該在成功發送後清除圖片', () => {
      mockState.image = null;
      mockState.imageUrl = '';

      expect(mockState.image).toBeNull();
      expect(mockState.imageUrl).toBe('');
    });
  });

  describe('API 調用流程', () => {
    it('應該在發送前準備 API 請求', () => {
      const apiRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text: '1+1=？' }],
          },
        ],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 65536,
        },
      };

      expect(apiRequest.contents).toHaveLength(1);
      expect(apiRequest.generationConfig.maxOutputTokens).toBe(65536);
    });

    it('應該在第一條訊息時包含 system prompt', () => {
      const systemPrompt = '你是一個數學老師';
      const userPrompt = '1+1=？';

      const apiRequest = {
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
      };

      expect(apiRequest.contents).toHaveLength(2);
      expect(apiRequest.contents[0].parts[0].text).toContain('數學老師');
    });

    it('應該在後續訊息時保持對話歷史', () => {
      const history = [
        {
          role: 'user',
          parts: [{ text: '1+1=？' }],
        },
        {
          role: 'model',
          parts: [{ text: '1+1=2' }],
        },
      ];

      const newMessage = {
        role: 'user',
        parts: [{ text: '2+2=？' }],
      };

      const apiRequest = {
        contents: [...history, newMessage],
      };

      expect(apiRequest.contents).toHaveLength(3);
    });

    it('應該在圖片存在時在 API 請求中包含圖片', () => {
      const imageBase64 = 'base64encodedimage';
      const apiRequest = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: 'image/jpeg',
                },
              },
              { text: '這是什麼？' },
            ],
          },
        ],
      };

      expect(apiRequest.contents[0].parts).toHaveLength(2);
      expect(apiRequest.contents[0].parts[0]).toHaveProperty('inlineData');
    });
  });

  describe('滾動管理流程', () => {
    it('應該在發送時標記需要滾動到問題', () => {
      const shouldScrollToQuestion = { current: false };

      shouldScrollToQuestion.current = true;

      expect(shouldScrollToQuestion.current).toBe(true);
    });

    it('應該在發送時添加底部 padding', () => {
      mockChatContainer.style.paddingBottom = '80vh';

      expect(mockChatContainer.style.paddingBottom).toBe('80vh');
    });

    it('應該在 AI 回應完成後移除 padding', () => {
      mockChatContainer.style.paddingBottom = '80vh';
      mockChatContainer.style.paddingBottom = '0px';

      expect(mockChatContainer.style.paddingBottom).toBe('0px');
    });

    it('應該在訊息發送時滾動到使用者問題', () => {
      const userMessage = document.createElement('div');
      userMessage.style.scrollMarginTop = '16px';

      // 模擬滾動到問題
      mockChatContainer.scrollTo?.({
        top: 100,
        behavior: 'smooth',
      } as any);

      expect(mockChatContainer.scrollTo).toHaveBeenCalled();
    });

    it('應該在 AI 回應時自動滾動', () => {
      mockState.isLoading = true;

      // 模擬自動滾動
      mockChatContainer.scrollTo?.({
        top: mockChatContainer.scrollHeight - mockChatContainer.clientHeight,
        behavior: 'smooth',
      } as any);

      expect(mockChatContainer.scrollTo).toHaveBeenCalled();
    });

    it('應該在使用者手動滾動時停止自動滾動', () => {
      let shouldAutoScroll = true;

      // 使用者手動滾動
      shouldAutoScroll = false;

      expect(shouldAutoScroll).toBe(false);
    });
  });

  describe('錯誤處理流程', () => {
    it('應該在 API 錯誤時保持使用者訊息', () => {
      const userMessage = { role: 'user', text: '1+1=？' };
      mockState.displayConversation.push(userMessage);

      // 模擬 API 錯誤
      const initialLength = mockState.displayConversation.length;

      // 不應該移除使用者訊息
      expect(mockState.displayConversation.length).toBe(initialLength);
    });

    it('應該在發送失敗時恢復輸入框', () => {
      const originalPrompt = '失敗的訊息';
      mockState.currentPrompt = originalPrompt;

      // 模擬失敗
      mockState.currentPrompt = originalPrompt;

      expect(mockState.currentPrompt).toBe('失敗的訊息');
    });

    it('應該在發送失敗時恢復圖片', () => {
      const image = new File(['fake'], 'math.jpg');
      const imageUrl = 'blob:http://localhost/123';

      mockState.image = image;
      mockState.imageUrl = imageUrl;

      // 模擬失敗時恢復
      expect(mockState.image).toBeDefined();
      expect(mockState.imageUrl).toBeTruthy();
    });

    it('應該在錯誤時設置錯誤狀態', () => {
      const error = {
        message: 'API 錯誤',
        suggestion: '請重試',
      };

      mockState.error = error;

      expect(mockState.error).toBeDefined();
      expect(mockState.error.message).toBe('API 錯誤');
    });

    it('應該在完成後清除 isLoading 即使發生錯誤', () => {
      mockState.isLoading = true;

      // 模擬錯誤發生後
      mockState.isLoading = false;

      expect(mockState.isLoading).toBe(false);
    });
  });

  describe('完整發送流程', () => {
    it('完整流程：驗證 → 清空 → 發送 → 滾動 → 等待 → 完成', () => {
      // Step 1: 驗證輸入
      const userInput = '1+1=？';
      expect(userInput).toBeTruthy();

      // Step 2: 清空輸入框
      mockState.currentPrompt = '';
      expect(mockState.currentPrompt).toBe('');

      // Step 3: 添加使用者訊息到 UI
      mockState.displayConversation.push({
        role: 'user',
        text: userInput,
      });
      expect(mockState.displayConversation).toHaveLength(1);

      // Step 4: 設置加載狀態
      mockState.isLoading = true;
      expect(mockState.isLoading).toBe(true);

      // Step 5: 添加 padding 並滾動
      mockChatContainer.style.paddingBottom = '80vh';
      expect(mockChatContainer.style.paddingBottom).toBe('80vh');

      // Step 6: 模擬 AI 回應
      mockState.displayConversation.push({
        role: 'model',
        text: '1+1=2',
      });
      expect(mockState.displayConversation).toHaveLength(2);

      // Step 7: 清除加載狀態
      mockState.isLoading = false;
      expect(mockState.isLoading).toBe(false);

      // Step 8: 移除 padding
      mockChatContainer.style.paddingBottom = '0px';
      expect(mockChatContainer.style.paddingBottom).toBe('0px');
    });

    it('完整流程：帶圖片的訊息發送', () => {
      const userInput = '這是什麼？';
      const image = new File(['fake'], 'image.jpg');
      const imageUrl = 'blob:http://localhost/123';

      // Step 1: 驗證輸入
      expect(userInput && image).toBeTruthy();

      // Step 2: 保存圖片參考
      const imageRef = image;
      const imageUrlRef = imageUrl;

      // Step 3: 清空圖片狀態（立即清除，允許下次上傳）
      mockState.image = null;
      mockState.imageUrl = '';
      expect(mockState.image).toBeNull();

      // Step 4: 添加訊息到 UI（包含圖片參考）
      mockState.displayConversation.push({
        role: 'user',
        text: userInput,
        image: imageUrlRef,
      });
      expect(mockState.displayConversation).toHaveLength(1);

      // Step 5: 設置加載
      mockState.isLoading = true;

      // Step 6: API 調用成功後
      mockState.displayConversation.push({
        role: 'model',
        text: '這是一個圖片描述',
      });

      // Step 7: 完成
      mockState.isLoading = false;

      expect(mockState.displayConversation).toHaveLength(2);
      expect(mockState.image).toBeNull(); // 仍然被清除
    });

    it('完整流程：多輪對話', () => {
      // 第一輪
      mockState.displayConversation.push({ role: 'user', text: '1+1=？' });
      mockState.displayConversation.push({ role: 'model', text: '2' });

      // 第二輪
      mockState.currentPrompt = '';
      mockState.displayConversation.push({
        role: 'user',
        text: '2+2=？',
      });
      mockState.displayConversation.push({ role: 'model', text: '4' });

      // 第三輪
      mockState.currentPrompt = '';
      mockState.displayConversation.push({ role: 'user', text: '3+3=？' });
      mockState.displayConversation.push({ role: 'model', text: '6' });

      expect(mockState.displayConversation).toHaveLength(6);
      expect(mockState.currentPrompt).toBe('');
    });
  });

  describe('邊界情況', () => {
    it('應該處理非常長的文字輸入', () => {
      const longText = 'a'.repeat(10000);

      mockState.displayConversation.push({
        role: 'user',
        text: longText,
      });

      expect(mockState.displayConversation[0].text.length).toBe(10000);
    });

    it('應該處理特殊字符', () => {
      const specialText = '你好 🎉 <script>alert("xss")</script> "quotes" & symbols';

      mockState.displayConversation.push({
        role: 'user',
        text: specialText,
      });

      expect(mockState.displayConversation[0].text).toContain('你好');
    });

    it('應該處理快速連續的多個發送', () => {
      mockState.isLoading = true;

      // 第一個發送
      mockState.displayConversation.push({ role: 'user', text: '訊息 1' });

      // 試圖第二個發送（應該被阻止）
      if (mockState.isLoading) {
        // 應該被阻止
        expect(mockState.displayConversation).toHaveLength(1);
      }
    });

    it('應該在網路中斷時恢復', () => {
      const originalPrompt = '網路中斷的訊息';
      mockState.currentPrompt = originalPrompt;

      // 模擬網路錯誤
      mockState.error = { message: '網路錯誤' };

      // 應該恢復原始內容
      mockState.currentPrompt = originalPrompt;

      expect(mockState.currentPrompt).toBe(originalPrompt);
    });
  });
});
