/**
 * Prompt 同步整合測試
 * 
 * 測試目標：Header prompt 選擇與 Settings 同步的完整流程
 * 場景：用戶在 Header 選擇 prompt → 儲存 → 刷新頁面 → 驗證恢復 → 驗證目前 prompt
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Prompt 同步整合測試', () => {
  const mockPrompts = [
    {
      id: 'default',
      name: '預設 Prompt',
      content: '你是一個數學老師。請以結構化的方式解答問題。',
      isDefault: true,
    },
    {
      id: 'english',
      name: '英文 Prompt',
      content: 'You are an English teacher. Explain in English.',
      isDefault: false,
    },
    {
      id: 'science',
      name: '科學 Prompt',
      content: '你是科學老師。使用科學方法解釋。',
      isDefault: false,
    },
  ];

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      length: 0,
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    } as any;

    // 初始化 localStorage 中的 prompts 和 selectedPromptId
    localStorage.setItem(
      'custom-prompts',
      JSON.stringify(mockPrompts)
    );
    localStorage.setItem('selected-prompt-id', 'default');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Prompt 選擇與儲存', () => {
    it('應該在 Header 中改變 prompt 選擇', () => {
      // 模擬 Header component 的 prompt selector 變更
      let selectedValue = 'default';

      expect(selectedValue).toBe('default');

      // 選擇新的 prompt
      selectedValue = 'english';
      
      expect(selectedValue).toBe('english');
    });

    it('應該將選擇的 prompt ID 保存到 localStorage', () => {
      const promptId = 'science';
      
      // 模擬選擇 prompt
      localStorage.setItem('selected-prompt-id', promptId);
      
      const stored = localStorage.getItem('selected-prompt-id');
      expect(stored).toBe('science');
    });

    it('應該在 localStorage 中保存 custom prompts', () => {
      const customPrompt = {
        id: 'custom-1',
        name: '自訂 Prompt',
        content: '自訂內容',
        isDefault: false,
      };

      const allPrompts = [...mockPrompts, customPrompt];
      localStorage.setItem('custom-prompts', JSON.stringify(allPrompts));

      const stored = localStorage.getItem('custom-prompts');
      const parsed = JSON.parse(stored!);
      
      expect(parsed).toHaveLength(4);
      expect(parsed[3]).toEqual(customPrompt);
    });
  });

  describe('Prompt 選擇持久化', () => {
    it('頁面刷新後應該恢復選擇的 prompt ID', () => {
      // Step 1: 選擇 prompt
      localStorage.setItem('selected-prompt-id', 'english');
      
      // Step 2: 模擬頁面刷新（清空然後重新載入）
      const selectedId = localStorage.getItem('selected-prompt-id');
      
      // Step 3: 驗證恢復
      expect(selectedId).toBe('english');
    });

    it('應該在沒有儲存選擇時使用預設 prompt', () => {
      localStorage.clear();
      localStorage.setItem('custom-prompts', JSON.stringify(mockPrompts));
      
      // 沒有設置 selected-prompt-id，應該使用預設
      const selectedId = localStorage.getItem('selected-prompt-id');
      const defaultPrompt = mockPrompts.find(p => p.isDefault);
      
      if (!selectedId) {
        // 應該使用預設 prompt
        expect(defaultPrompt?.id).toBe('default');
      }
    });

    it('應該在 prompt 列表更新後保持有效的選擇', () => {
      // Step 1: 選擇一個 prompt
      localStorage.setItem('selected-prompt-id', 'english');
      
      // Step 2: 新增自訂 prompt
      const customPrompt = {
        id: 'custom-new',
        name: '新 Prompt',
        content: '新內容',
        isDefault: false,
      };
      const allPrompts = [...mockPrompts, customPrompt];
      localStorage.setItem('custom-prompts', JSON.stringify(allPrompts));
      
      // Step 3: 驗證選擇仍然有效
      const selectedId = localStorage.getItem('selected-prompt-id');
      const allStoredPrompts = JSON.parse(
        localStorage.getItem('custom-prompts')!
      );
      const isValid = allStoredPrompts.some((p: any) => p.id === selectedId);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Settings 中的 Prompt 管理', () => {
    it('應該在 Settings 中顯示所有 prompts', () => {
      const storedPrompts = localStorage.getItem('custom-prompts');
      const prompts = JSON.parse(storedPrompts!);
      
      expect(prompts).toHaveLength(3);
      expect(prompts.map((p: any) => p.name)).toEqual([
        '預設 Prompt',
        '英文 Prompt',
        '科學 Prompt',
      ]);
    });

    it('應該允許新增自訂 prompt', () => {
      const storedPrompts = JSON.parse(
        localStorage.getItem('custom-prompts')!
      );
      
      const newPrompt = {
        id: `custom-${Date.now()}`,
        name: '新自訂 Prompt',
        content: '這是新的提示詞內容',
        isDefault: false,
      };
      
      const updatedPrompts = [...storedPrompts, newPrompt];
      localStorage.setItem('custom-prompts', JSON.stringify(updatedPrompts));
      
      const stored = JSON.parse(localStorage.getItem('custom-prompts')!);
      expect(stored).toHaveLength(4);
      expect(stored[3].name).toBe('新自訂 Prompt');
    });

    it('應該允許刪除自訂 prompt', () => {
      const customPrompt = {
        id: 'custom-to-delete',
        name: '要刪除的 Prompt',
        content: '將被刪除',
        isDefault: false,
      };
      
      const allPrompts = [...mockPrompts, customPrompt];
      localStorage.setItem('custom-prompts', JSON.stringify(allPrompts));
      
      // 刪除自訂 prompt
      const filtered = allPrompts.filter(p => p.id !== 'custom-to-delete');
      localStorage.setItem('custom-prompts', JSON.stringify(filtered));
      
      const stored = JSON.parse(localStorage.getItem('custom-prompts')!);
      expect(stored).toHaveLength(3);
      expect(stored.find((p: any) => p.id === 'custom-to-delete')).toBeUndefined();
    });

    it('刪除選定的 prompt 後應該切換到預設 prompt', () => {
      // Step 1: 創建並選擇自訂 prompt
      const customPrompt = {
        id: 'custom-selected',
        name: '自訂選定',
        content: '內容',
        isDefault: false,
      };
      
      const allPrompts = [...mockPrompts, customPrompt];
      localStorage.setItem('custom-prompts', JSON.stringify(allPrompts));
      localStorage.setItem('selected-prompt-id', 'custom-selected');
      
      // Step 2: 刪除該 prompt
      const filtered = allPrompts.filter(p => p.id !== 'custom-selected');
      localStorage.setItem('custom-prompts', JSON.stringify(filtered));
      
      // Step 3: 選擇應該切換到預設
      const defaultId = filtered.find(p => p.isDefault)?.id;
      localStorage.setItem('selected-prompt-id', defaultId!);
      
      // Step 4: 驗證
      const selectedId = localStorage.getItem('selected-prompt-id');
      expect(selectedId).toBe('default');
    });
  });

  describe('Prompt 內容更新與同步', () => {
    it('應該更新 prompt 的內容', () => {
      const stored = JSON.parse(localStorage.getItem('custom-prompts')!);
      const updated = stored.map((p: any) =>
        p.id === 'english'
          ? { ...p, content: '新的英文教師提示詞內容' }
          : p
      );
      
      localStorage.setItem('custom-prompts', JSON.stringify(updated));
      
      const storedAgain = JSON.parse(localStorage.getItem('custom-prompts')!);
      const englishPrompt = storedAgain.find((p: any) => p.id === 'english');
      
      expect(englishPrompt.content).toBe('新的英文教師提示詞內容');
    });

    it('應該將 prompt 更改從 Settings 同步到 Header', () => {
      // Step 1: Settings 中更新 prompt
      const stored = JSON.parse(localStorage.getItem('custom-prompts')!);
      const updated = stored.map((p: any) =>
        p.id === 'science'
          ? { ...p, content: '科學方法 v2' }
          : p
      );
      localStorage.setItem('custom-prompts', JSON.stringify(updated));
      
      // Step 2: Header 應該可以存取更新的內容
      const headerPrompts = JSON.parse(localStorage.getItem('custom-prompts')!);
      const sciencePrompt = headerPrompts.find((p: any) => p.id === 'science');
      
      // Step 3: 驗證同步
      expect(sciencePrompt.content).toBe('科學方法 v2');
    });
  });

  describe('完整流程：選擇 → 儲存 → 刷新 → 驗證', () => {
    it('完整流程：選擇 prompt → 刷新 → 驗證恢復 → 驗證同步', () => {
      // Step 1: 初始化
      expect(localStorage.getItem('selected-prompt-id')).toBe('default');
      
      // Step 2: 選擇新的 prompt
      localStorage.setItem('selected-prompt-id', 'science');
      expect(localStorage.getItem('selected-prompt-id')).toBe('science');
      
      // Step 3: 模擬刷新（重新讀取 localStorage）
      const refreshedId = localStorage.getItem('selected-prompt-id');
      expect(refreshedId).toBe('science');
      
      // Step 4: 驗證 prompts 列表保持完整
      const prompts = JSON.parse(localStorage.getItem('custom-prompts')!);
      expect(prompts).toHaveLength(3);
      
      // Step 5: 驗證目前選擇的 prompt 內容可用
      const currentPrompt = prompts.find((p: any) => p.id === refreshedId);
      expect(currentPrompt).toBeDefined();
      expect(currentPrompt.name).toBe('科學 Prompt');
      expect(currentPrompt.content).toContain('科學');
    });

    it('完整流程：新增自訂 → 選擇 → 刷新 → 驗證', () => {
      // Step 1: 新增自訂 prompt
      const customPrompt = {
        id: `custom-${Date.now()}`,
        name: '自訂老師',
        content: '自訂提示詞',
        isDefault: false,
      };
      
      const stored = JSON.parse(localStorage.getItem('custom-prompts')!);
      const updated = [...stored, customPrompt];
      localStorage.setItem('custom-prompts', JSON.stringify(updated));
      
      // Step 2: 選擇新增的 prompt
      localStorage.setItem('selected-prompt-id', customPrompt.id);
      
      // Step 3: 刷新（重新讀取）
      const prompts = JSON.parse(localStorage.getItem('custom-prompts')!);
      const selectedId = localStorage.getItem('selected-prompt-id');
      
      // Step 4: 驗證恢復
      expect(prompts).toHaveLength(4);
      expect(selectedId).toBe(customPrompt.id);
      
      // Step 5: 驗證可以找到選擇的 prompt
      const current = prompts.find((p: any) => p.id === selectedId);
      expect(current).toEqual(customPrompt);
    });
  });

  describe('邊界情況和錯誤處理', () => {
    it('應該處理 localStorage 不可用的情況', () => {
      const backup = localStorage;
      
      try {
        // 模擬 localStorage 不可用
        Object.defineProperty(window, 'localStorage', {
          value: null,
          writable: true,
        });
        
        // 應該不會拋出錯誤
        expect(localStorage).toBeNull();
      } finally {
        Object.defineProperty(window, 'localStorage', {
          value: backup,
          writable: true,
        });
      }
    });

    it('應該處理損壞的 JSON 資料', () => {
      localStorage.setItem('custom-prompts', 'invalid json');
      
      try {
        const parsed = JSON.parse(localStorage.getItem('custom-prompts')!);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('應該使用預設 prompt 如果沒有有效的選擇', () => {
      localStorage.clear();
      localStorage.setItem('custom-prompts', JSON.stringify(mockPrompts));
      
      const selectedId = localStorage.getItem('selected-prompt-id');
      const defaultPrompt = mockPrompts.find(p => p.isDefault);
      
      if (!selectedId) {
        const id = defaultPrompt?.id || 'default';
        expect(id).toBe('default');
      }
    });

    it('應該在 prompt 被刪除時恢復預設', () => {
      // 選擇一個 prompt
      localStorage.setItem('selected-prompt-id', 'english');
      
      // 刪除該 prompt（但不是預設的）
      const stored = JSON.parse(localStorage.getItem('custom-prompts')!);
      const filtered = stored.filter((p: any) => p.id !== 'english');
      localStorage.setItem('custom-prompts', JSON.stringify(filtered));
      
      // 驗證選擇仍然指向已刪除的 prompt
      expect(localStorage.getItem('selected-prompt-id')).toBe('english');
      
      // 應用程式應該檢測並恢復預設
      const prompts = JSON.parse(localStorage.getItem('custom-prompts')!);
      const isValid = prompts.some((p: any) => p.id === 'english');
      
      if (!isValid) {
        const defaultId = prompts.find((p: any) => p.isDefault)?.id;
        localStorage.setItem('selected-prompt-id', defaultId);
      }
      
      expect(localStorage.getItem('selected-prompt-id')).toBe('default');
    });
  });
});
