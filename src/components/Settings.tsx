"use client";
import { useState } from "react";
import ApiKeySetup from "./ApiKeySetup";
import PromptSettings from "@/components/PromptSettings";
import type { CustomPrompt } from "@/components/PromptSettings";

type SettingsTab = "prompt" | "apikey" | "theme";

type Props = {
  isDark: boolean;
  onClose: () => void;
  apiKeys: string[];
  onKeysSaved: (keys: string[]) => void;
  prompts: CustomPrompt[];
  selectedPromptId: string;
  onPromptsUpdated: (prompts: CustomPrompt[], newSelectedId?: string) => void;
  onThemeToggle: () => void;
};

export default function Settings({
  isDark,
  onClose,
  apiKeys,
  onKeysSaved,
  prompts,
  selectedPromptId,
  onPromptsUpdated,
  onThemeToggle,
}: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("prompt");

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate" title="QuizMate - AI 互動家教">
            QuizMate - AI 互動家教
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
        <div className="flex border-t dark:border-gray-700">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "prompt"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            Prompt 設定
          </button>
          <button
            onClick={() => setActiveTab("apikey")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "apikey"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            API 金鑰
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "theme"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            外觀主題
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "prompt" && (
          <PromptSettings
            prompts={prompts}
            selectedPromptId={selectedPromptId}
            onPromptsUpdated={onPromptsUpdated}
            isDark={isDark}
            onClose={onClose}
            isModal={false}
          />
        )}
        {activeTab === "apikey" && (
          <ApiKeySetup
            onKeysSaved={onKeysSaved}
            isDark={isDark}
            onClose={onClose}
            isModal={false}
          />
        )}
        {activeTab === "theme" && (
          <div className="p-4 sm:p-6 h-full">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                選擇您偏好的外觀主題
              </p>
              <button
                onClick={() => {
                  onThemeToggle();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center gap-3 transition-colors"
              >
                {isDark ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>切換至淺色模式</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>切換至深色模式</span>
                  </>
                )}
              </button>
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  目前使用：<strong className="text-gray-900 dark:text-gray-100">{isDark ? "深色模式" : "淺色模式"}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
