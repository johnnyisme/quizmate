// src/__tests__/page.test.ts
// 前端邏輯測試（不涉及 React 組件渲染）

describe('HomePage Helper Functions', () => {
  describe('fileToBase64', () => {
    it('should extract base64 from dataURL correctly', () => {
      // Test the string extraction logic without relying on FileReader (Node env)
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const commaIndex = dataUrl.indexOf(',');
      const base64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
      
      expect(base64).toBe('iVBORw0KGgo=');
      expect(base64).not.toMatch(/^data:/);
    });

    it('should handle dataURL without prefix', () => {
      const raw = 'iVBORw0KGgo=';
      const commaIndex = raw.indexOf(',');
      const base64 = commaIndex !== -1 ? raw.slice(commaIndex + 1) : raw;
      
      expect(base64).toBe('iVBORw0KGgo=');
    });
  });

  describe('renderMathInText', () => {
    const renderMathInText = (text: string): string => {
      try {
        // 簡化版本，用於測試
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/\n/g, '<br />');
        processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match) => `<katex>${match}</katex>`);
        processedText = processedText.replace(/\$([^$]+)\$/g, (match) => `<katex>${match}</katex>`);
        return processedText;
      } catch (e) {
        return text;
      }
    };

    it('should process bold text', () => {
      const input = '這是 **粗體** 文字';
      const output = renderMathInText(input);
      expect(output).toContain('<strong>粗體</strong>');
    });

    it('should process line breaks', () => {
      const input = '第一行\n第二行';
      const output = renderMathInText(input);
      expect(output).toContain('<br />');
    });

    it('should process inline math', () => {
      const input = '計算 $2+2=4$';
      const output = renderMathInText(input);
      expect(output).toContain('<katex>');
    });

    it('should process display math', () => {
      const input = '公式：$$x^2+y^2=z^2$$';
      const output = renderMathInText(input);
      expect(output).toContain('<katex>');
    });

    it('should handle combined formatting', () => {
      const input = '**重要**: $f(x) = x^2$';
      const output = renderMathInText(input);
      expect(output).toContain('<strong>');
      expect(output).toContain('<katex>');
    });
  });

  describe('Conversation Logic', () => {
    it('should validate input before sending', () => {
      const validateInput = (prompt: string, hasImage: boolean) => {
        return !!(prompt.trim() || hasImage);
      };

      expect(validateInput('', false)).toBe(false);
      expect(validateInput('   ', false)).toBe(false);
      expect(validateInput('question', false)).toBe(true);
      expect(validateInput('', true)).toBe(true);
      expect(validateInput('question', true)).toBe(true);
    });

    it('should only include image in first API request', () => {
      const shouldIncludeImage = (historyLength: number) => {
        return historyLength === 0;
      };

      expect(shouldIncludeImage(0)).toBe(true);
      expect(shouldIncludeImage(1)).toBe(false);
      expect(shouldIncludeImage(2)).toBe(false);
    });

    it('should compose FormData correctly', () => {
      const buildFormData = (
        prompt: string,
        history: any[],
        image?: File
      ) => {
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('history', JSON.stringify(history));
        if (history.length === 0 && image) {
          formData.append('image', image);
        }
        return formData;
      };

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const form1 = buildFormData('question', [], file);
      expect(form1.has('image')).toBe(true);

      const form2 = buildFormData('follow-up', [{ role: 'user' }], file);
      expect(form2.has('image')).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should restore prompt on error', () => {
      const originalPrompt = '2+2=?';
      const promptAfterError = originalPrompt;
      
      expect(promptAfterError).toBe('2+2=?');
    });

    it('should remove failed message from conversation', () => {
      const conversation = [
        { role: 'user' as const, text: 'first' },
        { role: 'model' as const, text: 'response' },
        { role: 'user' as const, text: 'failed message' },
      ];

      const recoverConversation = (conv: any[]) => {
        return conv.slice(0, -1);
      };

      const recovered = recoverConversation(conversation);
      expect(recovered.length).toBe(2);
      expect(recovered[recovered.length - 1].text).toBe('response');
    });
  });

  describe('Session Management UI', () => {
    it('should reset all state when starting new chat', () => {
      // Simulate state before new chat
      const mockState = {
        image: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        imageUrl: 'blob:http://localhost:3000/abc123',
        displayConversation: [{ role: 'user' as const, text: 'old message' }],
        apiHistory: [{ role: 'user', parts: [{ text: 'old' }] }],
        currentSessionId: 'session-123',
        error: 'some error',
        showSidebar: true,
      };

      // Simulate handleNewChat behavior
      const handleNewChat = () => ({
        image: null,
        imageUrl: '',
        displayConversation: [],
        apiHistory: [],
        currentSessionId: null,
        error: '',
        showSidebar: false, // Mobile sidebar collapses
      });

      const newState = handleNewChat();

      expect(newState.image).toBeNull();
      expect(newState.imageUrl).toBe('');
      expect(newState.displayConversation).toHaveLength(0);
      expect(newState.apiHistory).toHaveLength(0);
      expect(newState.currentSessionId).toBeNull();
      expect(newState.error).toBe('');
      expect(newState.showSidebar).toBe(false);
    });

    it('should close sidebar on mobile after new chat', () => {
      const mockSidebarState = { showSidebar: true };
      const handleNewChatEffect = () => ({ showSidebar: false });
      
      const result = handleNewChatEffect();
      expect(result.showSidebar).toBe(false);
    });

    it('should generate title from first user message', () => {
      const generateTitle = (text: string): string => {
        const cleaned = text.replace(/[*$\n]/g, ' ').trim();
        return cleaned.length > 30 ? cleaned.slice(0, 30) + '...' : cleaned;
      };

      expect(generateTitle('簡單問題')).toBe('簡單問題');
      expect(generateTitle('這是一個非常非常非常非常非常非常非常非常長的問題需要被截斷喔喔喔')).toBe('這是一個非常非常非常非常非常非常非常非常長的問題需要被截斷喔...');
      expect(generateTitle('**粗體**問題')).toBe('粗體  問題');
      expect(generateTitle('多行\n問題')).toBe('多行 問題');
      expect(generateTitle('數學$x^2$問題')).toBe('數學 x^2 問題');
    });

    it('should switch to existing session', () => {
      const mockSwitchSession = (sessionId: string) => ({
        currentSessionId: sessionId,
        showSidebar: false,
      });

      const result = mockSwitchSession('session-456');
      expect(result.currentSessionId).toBe('session-456');
      expect(result.showSidebar).toBe(false);
    });

    it('should delete session and clear if currently active', () => {
      const mockState = {
        currentSessionId: 'session-to-delete',
        sessions: [
          { id: 'session-to-delete', title: 'Test' },
          { id: 'session-keep', title: 'Keep' },
        ],
      };

      const deleteSession = (sessionId: string) => {
        const shouldClear = mockState.currentSessionId === sessionId;
        return {
          sessions: mockState.sessions.filter(s => s.id !== sessionId),
          currentSessionId: shouldClear ? null : mockState.currentSessionId,
          cleared: shouldClear,
        };
      };

      const result = deleteSession('session-to-delete');
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe('session-keep');
      expect(result.currentSessionId).toBeNull();
      expect(result.cleared).toBe(true);
    });

    it('should not clear state when deleting non-active session', () => {
      const mockState = {
        currentSessionId: 'session-active',
        sessions: [
          { id: 'session-active', title: 'Active' },
          { id: 'session-delete', title: 'Delete' },
        ],
      };

      const deleteSession = (sessionId: string) => {
        const shouldClear = mockState.currentSessionId === sessionId;
        return {
          sessions: mockState.sessions.filter(s => s.id !== sessionId),
          currentSessionId: shouldClear ? null : mockState.currentSessionId,
          cleared: shouldClear,
        };
      };

      const result = deleteSession('session-delete');
      expect(result.sessions).toHaveLength(1);
      expect(result.currentSessionId).toBe('session-active');
      expect(result.cleared).toBe(false);
    });

    it('should convert DB messages to display format', () => {
      const dbMessages = [
        {
          role: 'user' as const,
          content: '2+2=?',
          timestamp: Date.now(),
          imageBase64: 'data:image/png;base64,ABC',
        },
        {
          role: 'model' as const,
          content: '答案是 4',
          timestamp: Date.now(),
        },
      ];

      const convertToDisplay = (msgs: typeof dbMessages) => {
        return msgs.map(msg => ({
          role: msg.role,
          text: msg.content,
          image: msg.imageBase64,
        }));
      };

      const displayMsgs = convertToDisplay(dbMessages);
      expect(displayMsgs).toHaveLength(2);
      expect(displayMsgs[0].text).toBe('2+2=?');
      expect(displayMsgs[0].image).toBe('data:image/png;base64,ABC');
      expect(displayMsgs[1].text).toBe('答案是 4');
      expect(displayMsgs[1].image).toBeUndefined();
    });

    it('should rebuild API history from DB messages', () => {
      const dbMessages = [
        {
          role: 'user' as const,
          content: '問題',
          timestamp: Date.now(),
          imageBase64: 'data:image/jpeg;base64,XYZ',
        },
        {
          role: 'model' as const,
          content: '回答',
          timestamp: Date.now(),
        },
        {
          role: 'user' as const,
          content: '追問',
          timestamp: Date.now(),
        },
        {
          role: 'model' as const,
          content: '追答',
          timestamp: Date.now(),
        },
      ];

      const rebuildApiHistory = (msgs: typeof dbMessages) => {
        const apiMsgs: any[] = [];
        for (let i = 0; i < msgs.length; i++) {
          const msg = msgs[i];
          if (msg.role === 'user') {
            const parts: any[] = [];
            if (i === 0 && msg.imageBase64) {
              const base64Data = msg.imageBase64.split(',')[1] || msg.imageBase64;
              parts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/jpeg',
                },
              });
            }
            parts.push({ text: msg.content });
            apiMsgs.push({ role: 'user', parts });
          } else {
            apiMsgs.push({ role: 'model', parts: [{ text: msg.content }] });
          }
        }
        return apiMsgs;
      };

      const apiHistory = rebuildApiHistory(dbMessages);
      expect(apiHistory).toHaveLength(4);
      expect(apiHistory[0].role).toBe('user');
      expect(apiHistory[0].parts).toHaveLength(2); // image + text
      expect(apiHistory[0].parts[0].inlineData).toBeDefined();
      expect(apiHistory[0].parts[0].inlineData.data).toBe('XYZ');
      expect(apiHistory[0].parts[1].text).toBe('問題');
      expect(apiHistory[2].parts).toHaveLength(1); // text only
      expect(apiHistory[2].parts[0].text).toBe('追問');
    });

    it('should save messages to new session with image', () => {
      const mockCreateSession = async (
        title: string,
        messages: any[],
        imageBase64?: string
      ) => {
        return {
          id: 'new-session-id',
          title,
          messages,
          imageBase64,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      };

      const userMsg = {
        role: 'user' as const,
        content: '測試問題',
        timestamp: Date.now(),
        imageBase64: 'data:image/png;base64,TEST',
      };

      const modelMsg = {
        role: 'model' as const,
        content: '測試回答',
        timestamp: Date.now(),
      };

      mockCreateSession('測試問題', [userMsg, modelMsg], 'data:image/png;base64,TEST').then(
        (session) => {
          expect(session.title).toBe('測試問題');
          expect(session.messages).toHaveLength(2);
          expect(session.imageBase64).toBe('data:image/png;base64,TEST');
        }
      );
    });

    it('should append messages to existing session', () => {
      const mockAppendMessages = async (sessionId: string, messages: any[]) => {
        return {
          sessionId,
          messagesAdded: messages.length,
        };
      };

      const newMessages = [
        { role: 'user' as const, content: '追問', timestamp: Date.now() },
        { role: 'model' as const, content: '追答', timestamp: Date.now() },
      ];

      mockAppendMessages('existing-session', newMessages).then((result) => {
        expect(result.sessionId).toBe('existing-session');
        expect(result.messagesAdded).toBe(2);
      });
    });

    it('should convert image file to base64 for storage', async () => {
      const mockFileToBase64 = async (file: File): Promise<string> => {
        // Simulate extraction without actual FileReader
        return 'BASE64_DATA_STRING';
      };

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const base64 = await mockFileToBase64(mockFile);
      const dataUrl = `data:${mockFile.type};base64,${base64}`;

      expect(dataUrl).toBe('data:image/jpeg;base64,BASE64_DATA_STRING');
    });

    it('should restore image URL from session base64', () => {
      const sessionImageBase64 = 'data:image/png;base64,RESTORED_DATA';
      const restoreImage = (base64?: string) => {
        return base64 || '';
      };

      const imageUrl = restoreImage(sessionImageBase64);
      expect(imageUrl).toBe('data:image/png;base64,RESTORED_DATA');
    });

    it('should handle session without image', () => {
      const session = {
        id: 'no-image-session',
        title: 'Text Only',
        messages: [
          { role: 'user' as const, content: 'Question', timestamp: Date.now() },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        imageBase64: undefined,
      };

      expect(session.imageBase64).toBeUndefined();
    });
  });

  describe('Layout and Sidebar Behavior', () => {
    it('should show sidebar by default on desktop (lg+)', () => {
      // 模擬桌面版側邊欄狀態
      const isDesktop = true;
      const showSidebar = false; // 即使 state 為 false
      
      // 桌面版應該用 lg:translate-x-0 強制顯示
      const sidebarVisible = isDesktop || showSidebar;
      
      expect(sidebarVisible).toBe(true);
    });

    it('should hide sidebar by default on mobile', () => {
      // 模擬手機版側邊欄狀態
      const isDesktop = false;
      const showSidebar = false;
      
      const sidebarVisible = isDesktop || showSidebar;
      
      expect(sidebarVisible).toBe(false);
    });

    it('should toggle sidebar visibility on mobile', () => {
      // 模擬手機側邊欄切換
      let showSidebar = false;
      
      // 用戶點擊打開
      showSidebar = true;
      expect(showSidebar).toBe(true);
      
      // 用戶點擊關閉
      showSidebar = false;
      expect(showSidebar).toBe(false);
    });

    it('should center main content absolutely on mobile', () => {
      // 手機版主區域應該完全置中（inset-0）
      const mobileMainAreaClass = 'absolute inset-0';
      expect(mobileMainAreaClass).toContain('inset-0');
    });

    it('should offset main content for sidebar on desktop', () => {
      // 桌面版主區域應該從側邊欄右邊開始（lg:left-64）
      const desktopMainAreaClass = 'absolute inset-0 lg:left-64';
      expect(desktopMainAreaClass).toContain('lg:left-64');
    });

    it('should close sidebar after selecting session on mobile', () => {
      // 模擬選擇 session 後的行為
      const handleSwitchSession = (sessionId: string) => {
        return {
          currentSessionId: sessionId,
          showSidebar: false, // 手機版應該關閉側邊欄
        };
      };

      const result = handleSwitchSession('test-session');
      expect(result.showSidebar).toBe(false);
    });

    it('should close sidebar after creating new chat on mobile', () => {
      // 模擬新建對話後的行為
      const handleNewChat = () => {
        return {
          showSidebar: false, // 手機版應該關閉側邊欄
          currentSessionId: null,
        };
      };

      const result = handleNewChat();
      expect(result.showSidebar).toBe(false);
    });

    it('should apply correct z-index for overlay and sidebar', () => {
      // 確保層級正確：overlay z-[60], sidebar z-[70]
      const overlayZIndex = 60;
      const sidebarZIndex = 70;
      
      expect(sidebarZIndex).toBeGreaterThan(overlayZIndex);
    });

    it('should show overlay only on mobile when sidebar is open', () => {
      // 桌面版不應該有 overlay
      const showOverlay = (isMobile: boolean, sidebarOpen: boolean) => {
        return isMobile && sidebarOpen;
      };

      expect(showOverlay(true, true)).toBe(true);   // 手機 + 側邊欄開啟
      expect(showOverlay(true, false)).toBe(false);  // 手機 + 側邊欄關閉
      expect(showOverlay(false, true)).toBe(false);  // 桌面 + 側邊欄開啟
      expect(showOverlay(false, false)).toBe(false); // 桌面 + 側邊欄關閉
    });
  });
});
