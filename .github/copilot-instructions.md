# QuizMate - AI Agent Instructions

## Project Overview
QuizMate is a Next.js + React student tutoring platform that leverages Google Gemini AI to interactively solve homework problems from uploaded images. Key feature: users upload a problem image once and can ask multiple follow-up questions about the same image without re-uploading.

## Architecture

### Frontend - Pure Client-Side Architecture
This is a **100% client-side application** with no backend server. All Gemini API calls are made directly from the browser.

**Main Component** ([src/app/page.tsx](../src/app/page.tsx)) - React Client Component:
- **State Management**: Maintains two separate conversation histories:
  - `displayConversation`: UI-facing messages with user-friendly formatting and images
  - `apiHistory`: API-facing conversation in Gemini `Content[]` format (includes image base64 in first message only)
- **Image Handling**: Converts first uploaded image to base64; subsequent questions skip image re-transmission
- **Markdown Rendering**: ReactMarkdown with remark-math, rehype-katex, and remark-gfm plugins
  - Full GFM support: tables, strikethrough, task lists, autolinks
  - Syntax highlighting: react-syntax-highlighter with oneDark/oneLight themes
  - Math formulas: KaTeX integration via rehype-katex plugin
  - Custom code component: auto-detects language from `` ```language `` fence
  - Safe HTML support: rehype-raw + rehype-sanitize allow common HTML tags while filtering dangerous content (script, iframe, etc.)
- **Error Recovery**: Failed sends are auto-restored to input field; conversation reverts to pre-send state
- **Multi-Key Rotation**: Supports multiple Gemini API keys stored in localStorage
  - Automatic failover on 429, quota, and permission errors
  - Load-balancing: advances key index on successful requests
  - Tracks failed keys; resets when all keys exhausted (retry-all pattern)
- **System Prompt**: Injected on first turn only; instructs AI as "patient middle-school teacher" with structured output (answer, concept, steps, formulas) in Traditional Chinese

## Key Workflows

### Development
```bash
npm install          # Install deps
npm run dev         # Start dev server on :3000 (auto-reload enabled)
npm run lint        # Run ESLint
```

### Local Setup
- **No `.env.local` needed**: All API Keys are managed client-side in browser localStorage
- Users configure their own API keys via the Settings UI on first visit

### Production Build & Deployment
```bash
npm run build       # Generates .next/ (required for `start`)
npm run start       # Local production server
```
- **Vercel Deployment**: Connect GitHub repo to Vercel → **No environment variables needed** (pure frontend)
- Users configure their own API keys in-browser on first visit

## Critical Data Flows

### First Message with Image
1. User uploads image → `setImage()`, reset conversation history
2. Frontend: `fileToBase64()` stores base64 in `apiHistory` on first response
3. Client-side API call: Detects `apiHistory.length === 0 && image` → transmits base64 blob and text in single request
4. Subsequent questions reuse image from `apiHistory` via reference

### API Key Rotation on Errors
1. Request fails with retryable error (429, quota, permission_denied, etc.)
2. `isRetryableErrorMessage()` detects error type (client-side logic)
3. Current key added to `failedKeys` set; system calls `getNextAvailableKey()`
4. Retry with fresh key; on success, advance `currentKeyIndex` for load balance

### API Key Rotation on Errors
1. Request fails with retryable error (429, quota, permission_denied, etc.)
2. `isRetryableErrorMessage()` detects error type (client-side logic)
3. Current key added to `failedKeys` set; system calls `getNextAvailableKey()`
4. Retry with fresh key; on success, advance `currentKeyIndex` for load balance

## Important Patterns & Conventions

### Gemini API Usage
- **Model**: `gemini-2.5-flash` (as of current code)
- **Config**: `maxOutputTokens: 65536` (supports long tutoring explanations)
- **History Format**: Gemini `Content[]` type; roles are `"user"` and `"model"`

### Camera Feature
- **Platform Detection**: `isMobile()` function using User Agent regex
  - Detects: iOS, Android, iPad, iPod, webOS, BlackBerry, IEMobile, Opera Mini
- **Desktop Behavior**: 
  - Uses `getUserMedia({ video: { facingMode: 'environment' } })`
  - Full-screen modal with live video preview
  - Canvas-based photo capture → JPEG File at 95% quality
  - Complete stream cleanup with `getTracks().forEach(track => track.stop())`
- **Mobile Behavior**: 
  - Native file input with `capture="environment"` attribute
  - Opens device camera directly
  - Better UX on iOS/Android
- **Resource Management**: Always cleanup MediaStream when closing camera
- **Error Handling**: Friendly permission error messages for getUserMedia failures

### UI/UX Conventions
- Responsive design: `max-w-2xl` container, Tailwind v4 with `@tailwindcss/postcss`
- Loading state: inline `animate-pulse` spinner
- Keyboard submit: `onKeyPress` detects Enter key (only when not loading)
- **Scroll Behavior**: 
  - User question scrolls to top of viewport when sending (mimicking Gemini app UX)
  - Implementation: Direct DOM manipulation in `handleSubmit` - sets `paddingBottom: 80vh` when loading starts, removes when complete
  - Smooth scroll triggered via `requestAnimationFrame` in `useEffect`
  - Padding provides scroll space; removed after AI response completes
- Camera modal: `z-[100]` full-screen with blue circular capture button (16x16)

### Error Handling
- Missing both prompt and image → client-side validation
- API errors → user message restored to input, conversation reverted, error displayed
- Image-to-base64 conversion fails → fallback to text-only history

## File Structure Rationale

```
src/app/
├── page.tsx          # Client component: conversation UI, image upload, KaTeX rendering
├── layout.tsx        # Root layout: global styles, metadata, PWA manifest
├── globals.css       # Tailwind directives
src/lib/
├── db.ts                    # IndexedDB utilities for session storage
├── useSessionStorage.ts     # React hooks: useSessionStorage, useSessionHistory
└── useAsyncState.ts         # Utility hook for async state management
```

### IndexedDB Session Storage
- **Database**: `quizmate-db` with `sessions` object store
- **LRU Cleanup**: Auto-prunes oldest sessions when count exceeds 10 (MAX_SESSIONS)
- **Schema**: Each session includes `id`, `title`, `createdAt`, `updatedAt`, `messages[]`, `imageBase64` (optional)
- **Operations**: createSession, getSession, appendMessages, updateSessionTitle, listSessions, deleteSession, pruneOldSessions
- **Session Persistence**: Current session ID stored in localStorage (`current-session-id` key)
  - Auto-restores last session on page reload
  - Cleared when starting new chat
  - Updated when switching sessions or creating new session
  - Enables seamless user experience across browser refreshes

### Camera Feature Tests
- **Device Detection**: iOS, Android, desktop User Agent testing
- **Platform Logic**: Mobile file input vs desktop getUserMedia routing
- **Modal State**: Show/hide camera modal state management
- **Stream Management**: MediaStream lifecycle and cleanup
- **Photo Capture**: Canvas → Blob → File conversion flow
- **Error Handling**: Permission denied, getUserMedia failures
- **UI Components**: Full-screen modal, capture button, cancel button
- **Edge Cases**: Video element not ready, blob creation failure, unsupported API
- **Session Title Editing**:
  - Click edit icon to enter edit mode (switches to session if not current)
  - Input limited to 30 characters with `maxLength` attribute
  - Compact circular buttons (green ✓ save, gray ✗ cancel) with `p-1.5 rounded-full`
  - Input uses `min-w-0` for responsive shrinking, `flex-1` for expansion
  - **Save triggers**: Click ✓ button OR press `Enter` key
  - **Cancel triggers**: Click ✗ button OR press `Escape` key OR click outside editing container
  - `useEffect` with `mousedown` event listener handles click-outside detection
  - Event listener auto-cleanup on unmount via return function
  - Desktop: Edit/delete buttons hidden, show on hover (`opacity-100 lg:opacity-0 lg:group-hover:opacity-100`)
  - Mobile: Buttons always visible for touch interaction
- **Time Display Format**:
  - Uses `toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })`
  - Format: 2026/01/01 14:30:45 (24-hour, zero-padded)
  - Previous: `toLocaleDateString('zh-TW')` only showed date

## Configuration & Dependencies
- **Next.js 16.1.1**: App Router with server routes at `app/api/**`
- **@google/generative-ai ^0.24.1**: Gemini SDK
- **Tailwind v4 + @tailwindcss/postcss**: Styling
- **Markdown Rendering**:
  - react-markdown: Core Markdown renderer
  - remark-math: Math notation support in Markdown
  - rehype-katex: KaTeX integration for LaTeX math rendering
  - remark-gfm: GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)
  - rehype-raw: Parse HTML in Markdown
  - rehype-sanitize: Sanitize HTML to prevent XSS attacks
- **Syntax Highlighting**: react-syntax-highlighter with Prism (oneDark/oneLight themes)
- **KaTeX ^0.16.27**: Math formula rendering (CSS bundled)
- **idb ^8.0.3**: Promise-based IndexedDB wrapper
- **Vitest**: Unit testing framework with 634 tests (frontend logic, Gemini SDK integration, API key rotation, error handling, DB LRU, theme, session management, sidebar responsive behavior, session hover buttons, session title editing with click-outside, session time format display, scroll buttons, camera feature with platform detection, Markdown rendering (55 tests), HTML sanitization (72 tests), syntax highlighting (78 tests), utilities)
- **TypeScript strict mode**: No `any` types without justification

## Common Tasks for AI Agents

### Adding Features
- Modify `page.tsx` for UI/client logic
- Modify `route.ts` for API/server logic or key rotation strategy
- Update system prompt in `route.ts` line ~110 to adjust tutor behavior
- Test locally with `npm run dev`, inspect console logs for key rotation traces

### Debugging
- Check `.env.local` exists and has valid `GEMINI_API_KEYS`
- Examine browser DevTools Network tab for FormData (image base64, history JSON)
- Server logs show `Using API key index: X (total keys: Y)` on each request
- KaTeX errors logged but don't break chat; check browser console

### Modifying Error Handling
- Update `isRetryableErrorMessage()` to add/remove error patterns (case-insensitive)
- Increase `maxOutputTokens` if responses truncate; decrease if quota too restrictive
- Adjust `failedKeys` reset logic if all-keys-failed scenario requires different recovery

## Constraints & Gotchas
- **Image persistence**: Only first uploaded image reused; users must re-upload to change image mid-session
- **No database**: All state in-memory per session; no persistence between page reloads
- **No auth**: Open endpoint; protect with Vercel env-only or rate-limiting if deployed publicly
- **FormData streaming**: Image file processed as stream-to-buffer; large files may impact memory
- **System prompt injection**: Always injected on first turn; cannot be overridden per-message (design choice)

## Next Steps for Extension
- Add chat export/save functionality
- Implement session persistence (localStorage or backend DB)
- Add support for multiple image uploads per session
- Rate-limiting & abuse protection for public deployments
- A/B testing different system prompts
