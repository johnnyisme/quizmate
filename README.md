# QuizMate

一個針對學生拍題互動解題的 Next.js + Gemini 前後端整合專案。支援：
- 上傳或拍攝題目圖片，維持圖片上下文，連續追問同張圖片的多個問題
- 文字/圖片任一即可送出
- KaTeX 數學公式渲染
- 首則系統提示：用條列、繁體中文詳細解題
- 多把 Gemini API Key 自動輪替，避免 429 配額問題

## 環境需求
- Node.js 18+（Next.js App Router）
- Google Gemini API Key（可多把，逗號分隔）

## 快速開始（本地）
```bash
npm install
# 專案根目錄建立 .env.local，內容例如：
# GEMINI_API_KEYS="key1,key2,key3"
npm run dev
# 打開 http://localhost:3000
```

### `.env.local` 說明
- `GEMINI_API_KEYS`：逗號分隔的多把 key，會自動輪詢，遇到 429 會換下一把。
- `.env.local` 已在 `.gitignore`，不要提交。

## 部署（Vercel 推薦，免費方案可用）
1) 建立 GitHub 倉庫並推送程式碼。
2) 在 Vercel 新建專案 → 連結該 GitHub Repo。
3) 到 Vercel 專案 Settings → Environment Variables：
   - `GEMINI_API_KEYS` = 你的逗號分隔 key 串。
4) Build Command 預設 `npm run build`，Output `.next`，部署後取得 `*.vercel.app` 網址。

## 使用方式
1) 首次上傳/拍攝題目圖片並輸入問題（可只傳圖片或只文字）。
2) AI 回答後，後續追問同張圖片的其他題目，無需再次上傳圖片。
3) 數學公式會自動以 KaTeX 顯示。
4) 錯誤時，輸入框會自動還原剛送出的問題，方便重試。

## 常見問題
- 429 / Too Many Requests：已內建多 key 輪替；若所有 key 用完，請等配額重置或增補新 key。
- 403 / SERVICE_DISABLED：到該 key 所屬專案啟用「Generative Language API」，等 1-3 分鐘再試。
- 手機只能拍照不能選相簿：已移除 capture 屬性，可從相簿選取。

## 指令速查
```bash
npm run dev     # 本地開發
npm run build   # 生產建置
npm run start   # 本地啟動生產版
```

## 目錄摘要
- `src/app/page.tsx`：前端主介面、上傳/聊天邏輯、捲動控制、KaTeX 轉換。
- `src/app/api/gemini/route.ts`：後端 API，處理圖片/base64、對話歷史、API key 輪替。
- `.env.local`：放 `GEMINI_API_KEYS`（不提交）。

## 安全提示
- 請勿將 `.env.local` 推上 GitHub。
- 若在公開網域使用，建議限制 API Key 使用範圍（HTTP referrers 或 IP），並做好速率/防濫用保護。This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
