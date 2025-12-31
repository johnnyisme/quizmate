"use client";
import { useEffect, useState, useRef } from "react";
// 統一的按鈕樣式
const buttonBaseClasses = "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors";
const buttonPrimaryClasses = `${buttonBaseClasses} bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700`;
const buttonPrimaryDisabledClasses = `${buttonBaseClasses} bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed`;
const buttonSecondaryClasses = `${buttonBaseClasses} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`;
const buttonSmallClasses = `px-2 py-1 text-xs font-medium rounded transition-colors`;
const buttonSmallActiveSurfaceClasses = `${buttonSmallClasses} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800`;
const buttonSmallDisabledSurfaceClasses = `${buttonSmallClasses} bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed`;
const buttonIconOnlyClasses = `p-1.5 rounded transition-colors`;
const buttonIconOnlyDangerClasses = `${buttonIconOnlyClasses} hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400`;

export type CustomPrompt = {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  isNew?: boolean;
};

// 預設的系統 Prompt，提供給首次使用者或未建立自定義 Prompt 時使用
export const DEFAULT_PROMPT: CustomPrompt = {
  id: "default",
  name: "QuizMate",
  content: `你是一位專業且有耐心的國中全科老師。請詳細分析題目並提供以下資訊：
1.  **最終答案**：清楚標示最後的答案。
2.  **題目主旨**：這題在考什麼觀念？
3.  **解題步驟**：一步一步帶領學生解題，說明每一步的思考邏輯。
4.  **相關公式**：列出解這題會用到的所有公式，並簡單說明。

請用繁體中文、條列式回答。如果使用者有額外指定題目（例如：請解第三題），請優先處理。`,
  isDefault: true,
};

type Props = {
  prompts: CustomPrompt[];
  selectedPromptId: string;
  onPromptsUpdated: (prompts: CustomPrompt[], newSelectedId?: string) => void;
  isDark: boolean;
  onClose: () => void;
  isModal: boolean;
};

export default function PromptSettings({
  prompts,
  selectedPromptId,
  onPromptsUpdated,
  isDark,
  onClose,
  isModal,
}: Props) {
  const [editingPrompts, setEditingPrompts] = useState<CustomPrompt[]>([]);
  const [initialPrompts, setInitialPrompts] = useState<CustomPrompt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const errorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 當 props 傳入時，深度複製一份來編輯，避免直接修改 props
    const copied = JSON.parse(JSON.stringify(prompts));
    setEditingPrompts(copied);
    setInitialPrompts(copied);
    setSelectedId(selectedPromptId);
  }, [prompts, selectedPromptId]);

  // 判斷是否有變更（比對編輯的與初始的）
  const hasChanges = () => {
    return JSON.stringify(editingPrompts.map(p => ({
      id: p.id,
      name: p.name,
      content: p.content,
    }))) !== JSON.stringify(initialPrompts.map(p => ({
      id: p.id,
      name: p.name,
      content: p.content,
    })));
  };

  const handleAddPrompt = () => {
    if (editingPrompts.filter((p) => !p.isDefault).length >= 5) {
      setError("最多只能新增 5 組自定義 prompt");
      return;
    }
    if (editingPrompts.some((p) => p.isNew)) {
      setError("請先儲存目前新增的 prompt");
      return;
    }

    const newPrompt: CustomPrompt = {
      id: `custom-${Date.now()}`,
      name: "",
      content: "",
      isDefault: false,
      isNew: true,
    };

    const updated = [...editingPrompts, newPrompt];
    setEditingPrompts(updated);
    setSelectedId(newPrompt.id);
    setError("");
  };

  const handleDeletePrompt = (id: string) => {
    const prompt = editingPrompts.find((p) => p.id === id);
    if (prompt?.id === "default") {
      setError("無法刪除預設 prompt");
      return;
    }

    const updated = editingPrompts.filter((p) => p.id !== id);
    setEditingPrompts(updated);
    
    let newSelectedId = selectedId;
    if (selectedId === id) {
      const defaultPrompt = updated.find(p => p.isDefault) || updated[0];
      newSelectedId = defaultPrompt?.id || null;
    }
    setSelectedId(newSelectedId);
    onPromptsUpdated(updated, newSelectedId || undefined);
    setError("");
  };

  const handleUpdatePrompt = (id: string, field: "name" | "content", value: string) => {
    const updated = editingPrompts.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setEditingPrompts(updated);
    setError("");
  };

  const handleSetDefault = (id: string) => {
    const target = editingPrompts.find((p) => p.id === id);
    if (target?.isNew) {
      setError("請先儲存此 prompt 才能將其設為預設");
      return;
    }

    // 只更新 isDefault，不更新其他狀態（避免影響 save 按鈕）
    const updated = editingPrompts.map((p) => ({ ...p, isDefault: p.id === id }));
    setSelectedId(id);
    setError("");
    
    // 直接將更新和新的預設 ID 傳遞給父組件（不更新本地 editingPrompts）
    const sanitized = updated.map(({ isNew, ...rest }) => rest);
    onPromptsUpdated(sanitized, id);
  };

  const handleSave = () => {
    for (const p of editingPrompts) {
      if (!p.name.trim()) {
        setError("請為所有 prompt 設定名稱");
        // 滾動到 error 訊息
        setTimeout(() => {
          errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
        return;
      }
      if (!p.content.trim()) {
        setError("請為所有 prompt 填寫內容");
        // 滾動到 error 訊息
        setTimeout(() => {
          errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
        return;
      }
    }

    const sanitized = editingPrompts.map(({ isNew, ...rest }) => ({ ...rest }));
    onPromptsUpdated(sanitized);
    setEditingPrompts(sanitized);
    setError("");
    // Optionally close modal on save
    // onClose();
  };

  const selectedPrompt = editingPrompts.find((p) => p.id === selectedId);

  return (
    <div className={`${isModal ? "" : ""} flex flex-col`}>
      <div className="flex-1 p-4 sm:p-6" ref={contentRef}>
        <div className="mb-4 flex flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 min-w-0">管理最多 5 組自定義 AI 老師 prompt（預設 prompt 不可刪除）</p>
          <button
            onClick={handleAddPrompt}
            disabled={editingPrompts.filter((p) => !p.isDefault).length >= 5 || editingPrompts.some((p) => p.isNew)}
            className={`${editingPrompts.filter((p) => !p.isDefault).length >= 5 || editingPrompts.some((p) => p.isNew) ? buttonPrimaryDisabledClasses : buttonPrimaryClasses} whitespace-nowrap flex-shrink-0`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增
          </button>
        </div>

        {error && (
          <div ref={errorRef} className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Prompt 列表</h3>
            <div className="space-y-2">
              {editingPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => setSelectedId(prompt.id)}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    selectedId === prompt.id
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {prompt.name}
                      {prompt.isNew && <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">(尚未儲存)</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      {!prompt.isNew && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!prompt.isDefault) {
                              handleSetDefault(prompt.id);
                            }
                          }}
                          disabled={prompt.isDefault}
                          className={prompt.isDefault ? buttonSmallDisabledSurfaceClasses : buttonSmallActiveSurfaceClasses}
                          title={prompt.isDefault ? "已使用" : "使用"}
                        >
                          {prompt.isDefault ? "已使用" : "使用"}
                        </button>
                      )}
                      {prompt.id !== "default" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.id);
                          }}
                          className={buttonIconOnlyDangerClasses}
                          title="刪除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedPrompt && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Prompt 名稱</label>
                  <input
                    type="text"
                    value={selectedPrompt.name}
                    onChange={(e) => handleUpdatePrompt(selectedPrompt.id, "name", e.target.value)}
                    disabled={selectedPrompt.id === "default"}
                    maxLength={15}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="輸入 prompt 名稱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Prompt 內容</label>
                  <textarea
                    value={selectedPrompt.content}
                    onChange={(e) => handleUpdatePrompt(selectedPrompt.id, "content", e.target.value)}
                    disabled={selectedPrompt.id === "default"}
                    rows={12}
                    className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="輸入 system prompt 內容..."
                  />
                  {selectedPrompt.id === "default" && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">目前使用的 prompt 不可編輯或刪除，請新增自定義 prompt</p>
                  )}
                </div>
              </div>
            )}
            {!selectedPrompt && editingPrompts.length > 0 && (
                 <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">正在載入...</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 border-t dark:border-gray-700 flex justify-end gap-3">
        {isModal && (
          <button
            onClick={onClose}
            className={buttonSecondaryClasses}
          >
            取消
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!hasChanges()}
          className={!hasChanges() ? buttonPrimaryDisabledClasses : buttonPrimaryClasses}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          儲存
        </button>
      </div>
    </div>
  );
}
