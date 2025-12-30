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
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="w-full max-w-2xl">
        {/* Close button (for modal mode) */}
        {isModal && onClose && (
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
              title="關閉"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* 標題 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="robotGradientModal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#60A5FA'}} />
                    <stop offset="100%" style={{stopColor: '#A78BFA'}} />
                  </linearGradient>
                </defs>
                {/* Robot head */}
                <rect x="25" y="30" width="50" height="45" rx="8" fill="url(#robotGradientModal)" />
                {/* Antenna */}
                <line x1="50" y1="30" x2="50" y2="20" stroke="url(#robotGradientModal)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="50" cy="17" r="4" fill="url(#robotGradientModal)" />
                {/* Eyes */}
                <circle cx="40" cy="45" r="5" fill="white" opacity="0.9" />
                <circle cx="60" cy="45" r="5" fill="white" opacity="0.9" />
                <circle cx="41" cy="45" r="2.5" fill="#1E293B" />
                <circle cx="61" cy="45" r="2.5" fill="#1E293B" />
                {/* Smile */}
                <path d="M 38 58 Q 50 65 62 58" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                {/* Ears */}
                <rect x="18" y="42" width="7" height="12" rx="3" fill="url(#robotGradientModal)" opacity="0.8" />
                <rect x="75" y="42" width="7" height="12" rx="3" fill="url(#robotGradientModal)" opacity="0.8" />
              </svg>
            </div>
            <h1
              className={`text-3xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              QuizMate
            </h1>
          </div>
          <p
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            設置你的 Gemini API 金鑰
          </p>
        </div>

        {/* API 金鑰輸入卡片 */}
        <div
          className={`rounded-lg p-6 ${
            isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-bold mb-3 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            1️⃣ 取得 API 金鑰
          </h3>
          <div
            className={`p-4 rounded mb-6 ${
              isDark ? "bg-gray-700" : "bg-blue-50"
            }`}
          >
            <p
              className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              前往{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 font-semibold underline"
              >
                AI Studio
              </a>{" "}
              點擊「Create API Key」，複製你的金鑰。
            </p>
            <p
              className={`text-xs mt-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              💡 支援多把金鑰（用逗號分隔）
            </p>
          </div>

          {/* 已保存的金鑰列表 */}
          {savedKeys.length > 0 && (
            <>
              <h3
                className={`text-lg font-bold mb-3 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                📋 已保存的金鑰
              </h3>
              <div className="space-y-2 mb-6">
                {savedKeys.map((key, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-3 rounded border ${
                      isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    {editingIndex === index ? (
                      <>
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className={`flex-1 px-2 py-1 rounded border font-mono text-sm ${
                            isDark
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:border-blue-500`}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                          title="保存"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            isDark
                              ? "bg-gray-600 hover:bg-gray-500 text-gray-300"
                              : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                          }`}
                          title="取消"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`flex-1 font-mono text-sm truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          {key}
                        </span>
                        <button
                          onClick={() => handleStartEdit(index)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            isDark
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                          title="編輯"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteKey(index)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                          title="刪除"
                        >
                          刪除
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <h3
            className={`text-lg font-bold mb-3 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {savedKeys.length > 0 ? "➕ 新增金鑰" : "2️⃣ 貼上金鑰"}
          </h3>
          <textarea
            value={newKeyInput}
            onChange={(e) => {
              setNewKeyInput(e.target.value);
              setError("");
            }}
            placeholder="貼上你的 API 金鑰&#10;例如：key1, key2, key3"
            className={`w-full h-24 p-3 rounded border-2 font-mono text-sm resize-none transition-colors ${
              isDark
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:border-blue-500`}
          />

          {error && (
            <div className="mt-3 p-3 rounded bg-red-500 bg-opacity-20 text-red-600">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {savedKeys.length === 0 ? (
              <>
                <button
                  onClick={handleAddKey}
                  disabled={newKeyInput.trim().length === 0}
                  className={`flex-1 py-3 rounded font-bold transition-colors ${
                    newKeyInput.trim().length === 0
                      ? isDark
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : isDark
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  ✓ 保存金鑰並開始
                </button>
                {isModal && onClose && (
                  <button
                    onClick={onClose}
                    className={`px-4 py-3 rounded font-bold transition-colors ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                    }`}
                  >
                    返回
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleAddKey}
                  disabled={newKeyInput.trim().length === 0}
                  className={`flex-1 py-3 rounded font-bold transition-colors ${
                    newKeyInput.trim().length === 0
                      ? isDark
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : isDark
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  ➕ 新增金鑰
                </button>
                {isModal && onClose && (
                  <button
                    onClick={onClose}
                    className={`px-4 py-3 rounded font-bold transition-colors ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                    }`}
                  >
                    返回
                  </button>
                )}
              </>
            )}
          </div>

          <p
            className={`text-xs mt-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            🔒 你的 API 金鑰只會存儲在你的瀏覽器本地，我們不會蒐集或存儲任何金鑰資訊。
          </p>
        </div>
      </div>
    </div>
  );
}
