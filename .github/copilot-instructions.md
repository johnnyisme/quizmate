# QuizMate - AI Agent Instructions

## Project Overview
QuizMate is a Next.js + React student tutoring platform that leverages Google Gemini AI to interactively solve homework problems from uploaded images. Key feature: users upload a problem image once and can ask multiple follow-up questions about the same image without re-uploading.

## Architecture

### Frontend ([src/app/page.tsx](src/app/page.tsx)) - React Client Component
- **State Management**: Maintains two separate conversation histories:
  - `displayConversation`: UI-facing messages with user-friendly formatting and images
  - `apiHistory`: API-facing conversation in Gemini `Content[]` format (includes image base64 in first message only)
- **Image Handling**: Converts first uploaded image to base64; subsequent questions skip image re-transmission
- **Math Rendering**: KaTeX processes both inline (`$...$`) and display (`$$...$$`) math formulas; wrapped in error handling (`throwOnError: false`)
- **Error Recovery**: Failed sends are auto-restored to input field; conversation reverts to pre-send state

### Backend ([src/app/api/gemini/route.ts](src/app/api/gemini/route.ts)) - Server Route Handler
- **Multi-Key Rotation**: Supports comma-separated Gemini API keys in `GEMINI_API_KEYS` environment variable
  - Automatic failover on 429, quota, and permission errors
  - Load-balancing: advances key index on successful requests
  - Tracks failed keys; resets set when all exhaust (implements retry-all pattern)
- **Image Transmission**: Only sends image in first request (when `history.length === 0`)
- **System Prompt**: Injected on first turn only; instructs AI as "patient middle-school teacher" with structured output (answer, concept, steps, formulas) in Traditional Chinese

## Key Workflows

### Development
```bash
npm install          # Install deps
npm run dev         # Start dev server on :3000 (auto-reload enabled)
npm run lint        # Run ESLint
```

### Local Setup
- Create `.env.local` with: `GEMINI_API_KEYS="key1,key2,key3"` (comma-separated, no spaces around commas required)
- `.env.local` is gitignored; never commit API keys

### Production Build & Deployment
```bash
npm run build       # Generates .next/ (required for `start`)
npm run start       # Local production server
```
- **Vercel Deployment**: Connect GitHub repo to Vercel → set `GEMINI_API_KEYS` env var in project settings

## Critical Data Flows

### First Message with Image
1. User uploads image → `setImage()`, reset conversation history
2. Frontend: `fileToBase64()` stores base64 in `apiHistory` on first response
3. Backend: Detects `history.length === 0 && imageFile` → transmits base64 blob and text in single request
4. Subsequent questions reuse image from `apiHistory` via reference

### API Key Rotation on Errors
1. Request fails with retryable error (429, quota, permission_denied, etc.)
2. `isRetryableErrorMessage()` detects error type
3. Current key added to `failedKeys` set; system calls `getNextAvailableKey()`
4. Retry with fresh key; on success, advance `currentKeyIndex` for load balance

## Important Patterns & Conventions

### Gemini API Usage
- **Model**: `gemini-2.5-flash` (as of current code)
- **Config**: `maxOutputTokens: 65536` (supports long tutoring explanations)
- **History Format**: Gemini `Content[]` type; roles are `"user"` and `"model"`

### UI/UX Conventions
- Responsive design: `max-w-2xl` container, Tailwind v4 with `@tailwindcss/postcss`
- Loading state: inline `animate-pulse` spinner
- Keyboard submit: `onKeyPress` detects Enter key (only when not loading)
- Scroll behavior: smooth auto-scroll to latest user message (not AI response) for readability

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
└── api/
    └── gemini/
        └── route.ts  # Server-side Gemini integration, key rotation logic
src/lib/
├── db.ts                    # IndexedDB utilities for session storage
├── useSessionStorage.ts     # React hooks: useSessionStorage, useSessionHistory
└── useAsyncState.ts         # Utility hook for async state management
```

### IndexedDB Session Storage
- **Database**: `quizmate-db` with `sessions` object store
- **LRU Cleanup**: Auto-prunes oldest sessions when count exceeds 5 (MAX_SESSIONS)
- **Schema**: Each session includes `id`, `title`, `createdAt`, `updatedAt`, `messages[]`, `imageBase64` (optional)
- **Operations**: createSession, getSession, appendMessages, updateSessionTitle, listSessions, deleteSession, pruneOldSessions

## Configuration & Dependencies
- **Next.js 16.1.1**: App Router with server routes at `app/api/**`
- **@google/generative-ai ^0.24.1**: Gemini SDK
- **Tailwind v4 + @tailwindcss/postcss**: Styling
- **KaTeX ^0.16.27**: Math formula rendering (CSS bundled)
- **idb ^8.0.3**: Promise-based IndexedDB wrapper
- **Vitest**: Unit testing framework with 77+ tests (utils, route, page, db)
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
