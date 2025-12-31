"use client";
import { useState, useEffect } from "react";

interface ApiKeySetupProps {
  onKeysSaved: (keys: string[]) => void;
  isDark: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export default function ApiKeySetup({ onKeysSaved, isDark, onClose, isModal }: ApiKeySetupProps) {
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [error, setError] = useState("");

  // 載入已保存的金鑰
  useEffect(() => {
    const stored = localStorage.getItem("gemini-api-keys");
    if (stored) {
      try {
        const keys = JSON.parse(stored);
        setSavedKeys(keys);
      } catch {
        setSavedKeys([]);
      }
    }
  }, []);

  const handleAddKey = () => {
    const newKeys = newKeyInput
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (newKeys.length === 0) {
      setError("請輸入至少一個 API key");
      return;
    }

    const updatedKeys = [...savedKeys, ...newKeys];
    localStorage.setItem("gemini-api-keys", JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);
    setNewKeyInput("");
    setError("");
    onKeysSaved(updatedKeys);
  };

  const handleDeleteKey = (index: number) => {
    const updatedKeys = savedKeys.filter((_, i) => i !== index);
    localStorage.setItem("gemini-api-keys", JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);
    onKeysSaved(updatedKeys);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(savedKeys[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (trimmed.length === 0) {
      setError("金鑰不能為空");
      return;
    }
    
    const updatedKeys = [...savedKeys];
    updatedKeys[index] = trimmed;
    localStorage.setItem("gemini-api-keys", JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);
    setEditingIndex(null);
    setEditingValue("");
    setError("");
    onKeysSaved(updatedKeys);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
    setError("");
  };

  return (
    <div className={`${isModal ? '' : 'h-full'} flex flex-col`}>
      {isModal && onClose && (
        <div className="p-4 sm:p-6 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
            API 金鑰設定
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
            title="關閉"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 說明區塊 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              如何取得 API 金鑰
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              前往{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-200 font-medium"
              >
                Google AI Studio
              </a>
              {" "}點擊「Create API Key」，複製你的金鑰。支援多把金鑰（用逗號分隔）。
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-500 mt-2">
              🔒 API 金鑰只會存儲在你的瀏覽器本地，不會上傳到任何伺服器。
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 已保存的金鑰列表 */}
          {savedKeys.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                已保存的 API 金鑰 ({savedKeys.length})
              </h3>
              <div className="space-y-2">
                {savedKeys.map((key, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  >
                    {editingIndex === index ? (
                      <>
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 px-3 py-2 rounded border font-mono text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                          title="保存"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-2 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
                          title="取消"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-mono text-sm truncate text-gray-700 dark:text-gray-300">
                          {key}
                        </span>
                        <button
                          onClick={() => handleStartEdit(index)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                          title="編輯"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteKey(index)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400"
                          title="刪除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 新增金鑰區 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {savedKeys.length > 0 ? "新增 API 金鑰" : "設定 API 金鑰"}
            </h3>
            <textarea
              value={newKeyInput}
              onChange={(e) => {
                setNewKeyInput(e.target.value);
                setError("");
              }}
              placeholder="貼上你的 API 金鑰（支援多把，用逗號分隔）&#10;例如：AIzaSy...abc123, AIzaSy...def456"
              className="w-full h-32 p-3 rounded-lg border font-mono text-sm resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleAddKey}
                disabled={newKeyInput.trim().length === 0}
                className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {savedKeys.length > 0 ? "新增金鑰" : "儲存金鑰"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
