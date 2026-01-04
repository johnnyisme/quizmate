# QuizMate - AI Agent Instructions

## Project Overview
QuizMate is a Next.js + React student tutoring platform that leverages Google Gemini AI to interactively solve homework problems from uploaded images. **Key feature: users can upload multiple images within the same chat session**, asking different questions about different images without creating new sessions.

## Architecture

### Frontend - Pure Client-Side Architecture
This is a **100% client-side application** with no backend server. All Gemini API calls are made directly from the browser.

### Modular Architecture (Refactored v1.2.0)
**Reduced from 1,855 lines to 456 lines (75.4% reduction)** through systematic extraction into:

**Main Component** ([src/app/page.tsx](../src/app/page.tsx)) - Pure Orchestration Layer:
- **No direct state management**: All state delegated to custom hooks
- **Component composition**: Assembles 7 UI components with prop drilling
- **Hook integration**: Composes 13 custom hooks for all business logic
- **Minimal glue code**: Only ref declarations, hook composition, and event handler wiring

**State Management Hooks** (5 hooks - Grouped State Pattern):
- [useUIState.ts](../src/hooks/useUIState.ts): Modal visibility, sidebar, scroll buttons, selection mode (14 state variables)
- [useSettingsState.ts](../src/hooks/useSettingsState.ts): API keys, models, prompts, thinking mode (6 state variables)
- [useChatState.ts](../src/hooks/useChatState.ts): Conversations (display + API), loading, errors (5 state variables)
- [useImageState.ts](../src/hooks/useImageState.ts): Image preview, camera stream (4 state variables)
- [useSelectionState.ts](../src/hooks/useSelectionState.ts): Message selection, session editing (4 state variables)
- **Pattern**: `useState` with object + batch updater + individual setters + spread return for flat access

**Business Logic Hooks** (6 hooks - Event Handler Patterns):
- [useTheme.ts](../src/hooks/useTheme.ts): Dark mode toggle, localStorage persistence, KaTeX dynamic loading
- [useCamera.ts](../src/hooks/useCamera.ts): Platform detection, getUserMedia (desktop), file input (mobile), image validation
- [useMessageActions.ts](../src/hooks/useMessageActions.ts): Copy, share, long-press gestures, Web Share API
- [useScrollManagement.ts](../src/hooks/useScrollManagement.ts): Smart scroll, position memory per session, scroll-to-question
- [useSessionManagement.ts](../src/hooks/useSessionManagement.ts): New chat, switch session, delete, title editing
- [useGeminiAPI.ts](../src/hooks/useGeminiAPI.ts): API calls, key rotation, streaming, error recovery

**UI Components** (7 components - Presentational Layer):
- [Header.tsx](../src/components/Header.tsx): Sidebar toggle, logo, model/prompt selectors, settings button
- [ChatArea.tsx](../src/components/ChatArea.tsx): Message list, empty state, loading animation, image upload area
- [ChatInput.tsx](../src/components/ChatInput.tsx): Multi-line textarea, upload/camera buttons, submit button
- [ErrorDisplay.tsx](../src/components/ErrorDisplay.tsx): Collapsible error (message → suggestion → technical)
- [ImagePreviewModal.tsx](../src/components/ImagePreviewModal.tsx): Full-screen image viewer
- [SelectionToolbar.tsx](../src/components/SelectionToolbar.tsx): Multi-message selection controls
- [ScrollButtons.tsx](../src/components/ScrollButtons.tsx): Smart scroll-to-top/bottom buttons
- [CameraModal.tsx](../src/components/CameraModal.tsx): Desktop camera capture with video preview
- [MessageBubble.tsx](../src/components/MessageBubble.tsx): Memoized message rendering with Markdown/KaTeX/syntax highlighting

**Utility Modules** (2 modules):
- [errorHandling.ts](../src/utils/errorHandling.ts): Error classification, retry detection, user-friendly messages
- [fileUtils.ts](../src/utils/fileUtils.ts): File validation, base64 conversion, size checks

### Modular Architecture (Refactored v1.2.0)
**Reduced from 1,855 lines to 456 lines (75.4% reduction)** through systematic extraction into:

**Main Component** ([src/app/page.tsx](../src/app/page.tsx)) - Pure Orchestration Layer:
- **No direct state management**: All state delegated to custom hooks
- **Component composition**: Assembles 7 UI components with prop drilling
- **Hook integration**: Composes 13 custom hooks for all business logic
- **Minimal glue code**: Only ref declarations, hook composition, and event handler wiring

**State Management Hooks** (5 hooks - Grouped State Pattern):
- [useUIState.ts](../src/hooks/useUIState.ts): Modal visibility, sidebar, scroll buttons, selection mode (14 state variables)
- [useSettingsState.ts](../src/hooks/useSettingsState.ts): API keys, models, prompts, thinking mode (6 state variables)
- [useChatState.ts](../src/hooks/useChatState.ts): Conversations (display + API), loading, errors (5 state variables)
- [useImageState.ts](../src/hooks/useImageState.ts): Image preview, camera stream (4 state variables)
- [useSelectionState.ts](../src/hooks/useSelectionState.ts): Message selection, session editing (4 state variables)
- **Pattern**: `useState` with object + batch updater + individual setters + spread return for flat access

**Business Logic Hooks** (6 hooks - Event Handler Patterns):
- [useTheme.ts](../src/hooks/useTheme.ts): Dark mode toggle, localStorage persistence, KaTeX dynamic loading
- [useCamera.ts](../src/hooks/useCamera.ts): Platform detection, getUserMedia (desktop), file input (mobile), image validation
- [useMessageActions.ts](../src/hooks/useMessageActions.ts): Copy, share, long-press gestures, Web Share API
- [useScrollManagement.ts](../src/hooks/useScrollManagement.ts): Smart scroll, position memory per session, scroll-to-question
- [useSessionManagement.ts](../src/hooks/useSessionManagement.ts): New chat, switch session, delete, title editing
- [useGeminiAPI.ts](../src/hooks/useGeminiAPI.ts): API calls, key rotation, streaming, error recovery

**UI Components** (7 components - Presentational Layer):
- [Header.tsx](../src/components/Header.tsx): Sidebar toggle, logo, model/prompt selectors, settings button
- [ChatArea.tsx](../src/components/ChatArea.tsx): Message list, empty state, loading animation, image upload area
- [ChatInput.tsx](../src/components/ChatInput.tsx): Multi-line textarea, upload/camera buttons, submit button
- [ErrorDisplay.tsx](../src/components/ErrorDisplay.tsx): Collapsible error (message → suggestion → technical)
- [ImagePreviewModal.tsx](../src/components/ImagePreviewModal.tsx): Full-screen image viewer
- [SelectionToolbar.tsx](../src/components/SelectionToolbar.tsx): Multi-message selection controls
- [ScrollButtons.tsx](../src/components/ScrollButtons.tsx): Smart scroll-to-top/bottom buttons
- [CameraModal.tsx](../src/components/CameraModal.tsx): Desktop camera capture with video preview
- [MessageBubble.tsx](../src/components/MessageBubble.tsx): Memoized message rendering with Markdown/KaTeX/syntax highlighting

**Utility Modules** (2 modules):
- [errorHandling.ts](../src/utils/errorHandling.ts): Error classification, retry detection, user-friendly messages
- [fileUtils.ts](../src/utils/fileUtils.ts): File validation, base64 conversion, size checks

**Conversation State** (Maintained by useChatState):
- `displayConversation`: UI-facing messages with user-friendly formatting and images
- `apiHistory`: API-facing conversation in Gemini `Content[]` format (includes image base64 in each message with image)
- **Multi-Image Support**: Users can upload multiple images in the same session
  - No session reset on image upload (removed auto-conversation reset)
  - File input cleared after each upload (`e.target.value = ''`) to allow re-uploading same file
  - Image state cleared immediately after sending to allow next upload
  - **Image Reference Pattern**: Save image reference → clear state → use saved reference (prevents race conditions)
  - **Error Recovery**: Restore image on send failure so user can retry
- **Image Preview**: 
  - **Empty conversation**: Only center upload area shows image preview
  - **Active conversation**: Small thumbnail preview (80px height) above input box
  - **Preview UI**: Blue border, gray circular X button (top-right), no filename overlay
  - **Temporary State**: Preview not persisted to localStorage/IndexedDB
  - **Clear on**: Page reload, session switch, after successful send
  - **Persist on**: Opening settings modal (just a modal overlay)
- **Performance Optimization**: Uses `MessageBubble` component wrapped with `React.memo` to prevent unnecessary re-renders during typing
- **Markdown Rendering**: ReactMarkdown with remark-math, rehype-katex, and remark-gfm plugins
  - Full GFM support: tables, strikethrough, task lists, autolinks
  - Syntax highlighting: react-syntax-highlighter with oneDark/oneLight themes
  - Math formulas: KaTeX integration via rehype-katex plugin
  - Custom code component: auto-detects language from `` ```language `` fence
  - Safe HTML support: rehype-raw + rehype-sanitize allow common HTML tags while filtering dangerous content (script, iframe, etc.)
  - **Code Block Overflow Handling**: Custom wrapper with horizontal scroll for long code lines
    - Wrapper: `<div className="overflow-x-auto -mx-3 px-3 my-2" style={{ maxWidth: 'calc(100vw - 4rem)' }}><SyntaxHighlighter>...</SyntaxHighlighter></div>`
    - Negative margin (`-mx-3`) extends scroll area to bubble edges
    - Padding (`px-3`) maintains visual spacing consistency
    - Vertical margin (`my-2`) adds spacing between code blocks and other content
    - Max-width: `calc(100vw - 4rem)` prevents overflow on mobile
    - Custom styles: `margin: 0`, `borderRadius: '0.375rem'`, `fontSize: '0.875rem'`
    - Handles long single-line code (e.g., `model = genai.GenerativeModel(model_name="...")`) without breaking layout
    - Works seamlessly on mobile (touch scroll) and desktop (mouse scroll)
  - **Table Overflow Handling**: Custom table component wrapper with horizontal scroll and auto-sizing cells
    - Wrapper: `<div className="overflow-x-scroll -mx-3 px-3 my-2" style={{ maxWidth: 'calc(100vw - 4rem)', wordBreak: 'normal' }}><table>...</table></div>`
    - Negative margin (`-mx-3`) extends scroll area to bubble edges
    - Padding (`px-3`) maintains visual spacing consistency
    - Vertical margin (`my-2`) adds spacing between tables and other content
    - Max-width: `calc(100vw - 4rem)` prevents overflow on mobile
    - wordBreak: `normal` in table wrapper overrides parent's `break-word` to maintain table formatting
    - Prose container: `overflow-x-auto` with `wordBreak: 'break-word'` for long text
    - Table cells (th/td): `whiteSpace: 'nowrap'` allows auto-sizing based on content width
    - Prevents wide tables from breaking message bubble layout
    - Works seamlessly on mobile (touch scroll) and desktop (mouse scroll)
- **Error Recovery**: Failed sends are auto-restored to input field; conversation reverts to pre-send state
- **Multi-Key Rotation**: Supports multiple Gemini API keys stored in localStorage
  - Automatic failover on 429, quota, and permission errors
  - Load-balancing: advances key index on successful requests
  - Tracks failed keys; resets when all keys exhausted (retry-all pattern)
- **System Prompt**: Injected on first turn only; instructs AI as "patient middle-school teacher" with structured output (answer, concept, steps, formulas) in Traditional Chinese
- **Sidebar Persistence**: Sidebar open/close state saved to localStorage
  - Key: `sidebar-open` (string: 'true' or 'false')
  - Restored on page load
  - Auto-closes on mobile (<1024px) when switching sessions or starting new chat
  - Persists across page refreshes
- **Scroll Position Memory**: Chat scroll position saved per session
  - Key pattern: `scroll-pos-{sessionId}` (string: scroll offset in pixels)
  - Saved on `beforeunload` event
  - Restored ONLY when switching between sessions (detected via `prevSessionIdRef`)
  - NOT restored during same-session updates (e.g., AI streaming responses)
  - Different positions tracked for each session independently
  - Prevents scroll jumps when AI response completes

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

### Multi-Image Upload in Same Session
1. **First image**: User uploads → `setImage()` + `setImageUrl()` → displays preview
2. User inputs question → clicks send
3. **Image Reference Pattern**:
   - Save references: `const currentImage = image; const currentImageUrl = imageUrl;`
   - Clear state immediately: `setImage(null); setImageUrl("");` (allows next upload)
   - Use saved refs in API call: `await fileToBase64(currentImage)`
4. On API success: Image included in conversation bubble, state already cleared
5. On API failure: Restore image → `setImage(currentImage); setImageUrl(currentImageUrl);`
6. **Second image**: User uploads new image → same flow, no session reset
7. **File input clearing**: `e.target.value = ''` after each upload allows re-selecting same file

### Image Preview Display Logic
- **Condition**: `{imageUrl && displayConversation.length > 0 && (...preview UI...)}`
- **Empty conversation (length === 0)**: No preview above input, only center upload area
- **Active conversation (length > 0)**: Small thumbnail preview above input
- **Not persisted**: Preview is React state only, cleared on unmount/reload/session-switch
- **Initial Load Flag**: `isInitialLoad.current` prevents restoring old session images on page load

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
- **Input Behavior**: Enter key creates new line (no auto-submit); submit via button click only
- **Mobile Keyboard UX**: Input Area uses `sticky bottom-0 z-10` to keep input field anchored above mobile keyboard when scrolling chat
- **Multi-line Input**: Textarea auto-grows up to 3 lines; scrollable beyond that
- **Scroll Behavior**: 
  - User question scrolls to top of viewport when sending (mimicking Gemini app UX)
  - Implementation: Direct DOM manipulation in `handleSubmit` - sets `paddingBottom: 80vh` when loading starts, removes when complete
  - Smooth scroll triggered via `requestAnimationFrame` in `useEffect`
  - Padding provides scroll space; removed after AI response completes
  - **Session Switch Detection**: Uses `prevSessionIdRef` to distinguish real session switches from same-session updates
  - **Scroll Position Preservation**: When AI response completes, removes padding WITHOUT forcing scroll position change (browser handles naturally)
  - **No Scroll Jumps**: User scroll position maintained during AI streaming and after completion
- Camera modal: `z-[100]` full-screen with blue circular capture button (16x16)

### Error Handling
- Missing both prompt and image → client-side validation
- API errors → user message restored to input, conversation reverted, error displayed
- Image-to-base64 conversion fails → fallback to text-only history

## File Structure Rationale

```
src/app/
├── page.tsx          # Orchestration layer: hook composition + component assembly (456 lines, reduced from 1,855)
├── layout.tsx        # Root layout: global styles, metadata, PWA manifest
├── globals.css       # Tailwind directives

src/hooks/            # Custom Hooks (13 total)
├── useUIState.ts            # UI state: modals, sidebar, scroll buttons, selection mode
├── useSettingsState.ts      # Settings: API keys, models, prompts, thinking mode
├── useChatState.ts          # Chat state: conversations (display + API), loading, errors
├── useImageState.ts         # Image state: preview, camera stream
├── useSelectionState.ts     # Selection state: message selection, session editing
├── useTheme.ts              # Theme management: dark mode, localStorage, KaTeX loading
├── useCamera.ts             # Camera: platform detection, getUserMedia, validation
├── useMessageActions.ts     # Message actions: copy, share, long-press gestures
├── useScrollManagement.ts   # Scroll: smart scroll, position memory, scroll-to-question
├── useSessionManagement.ts  # Session: new chat, switch, delete, title editing
└── useGeminiAPI.ts          # API: Gemini calls, key rotation, streaming, error recovery

src/components/       # UI Components (7 presentational + utilities)
├── Header.tsx               # Top navigation with sidebar toggle, selectors, settings
├── ChatArea.tsx             # Message display area with MessageBubble list
├── ChatInput.tsx            # Multi-line textarea with upload/camera buttons
├── ErrorDisplay.tsx         # Collapsible error display (3 levels)
├── ImagePreviewModal.tsx    # Full-screen image viewer
├── SelectionToolbar.tsx     # Multi-message selection controls
├── ScrollButtons.tsx        # Smart scroll-to-top/bottom buttons
├── CameraModal.tsx          # Desktop camera capture interface
├── MessageBubble.tsx        # Memoized message component (React.memo for performance)
├── SessionList.tsx          # Sidebar session history list
├── ApiKeySetup.tsx          # API key management UI
├── PromptSettings.tsx       # Custom prompt editor
└── Settings.tsx             # Settings modal container

src/lib/              # Utilities & Storage
├── db.ts                    # IndexedDB utilities for session storage
├── useSessionStorage.ts     # React hooks: useSessionStorage, useSessionHistory
├── useAsyncState.ts         # Utility hook for async state management
├── errorHandling.ts         # Error classification and user-friendly messages
└── fileUtils.ts             # File validation and base64 conversion
```

### MessageBubble Component ([src/components/MessageBubble.tsx](../src/components/MessageBubble.tsx))
- **Purpose**: Isolated, memoized message rendering component for optimal performance
- **React.memo + forwardRef**: Prevents re-rendering when parent state changes (e.g., typing in input) while supporting ref forwarding
- **Props**: msg, index, isLastUserMessage, isSelectMode, isSelected, copiedMessageIndex, isDark, event handlers
- **Encapsulates**: All message rendering logic including ReactMarkdown, KaTeX, SyntaxHighlighter, copy/share buttons
- **Performance Impact**: 80-90% reduction in CPU usage during typing with 20+ messages
- **Ref Forwarding**: Uses `React.forwardRef` to pass `lastUserMessageRef` for scroll-to-question behavior
- **Testing**: 5 dedicated tests for ref forwarding validation (messageBubbleRef.test.tsx)

### IndexedDB Session Storage
- **Database**: `quizmate-db` with `sessions` object store
- **LRU Cleanup**: Auto-prunes oldest sessions when count exceeds 30 (MAX_SESSIONS)
- **Image Size Limit**: 10MB max per image (MAX_IMAGE_SIZE)
- **Schema**: Each session includes `id`, `title`, `createdAt`, `updatedAt`, `messages[]`, `imageBase64` (optional)
- **Operations**: createSession, getSession, appendMessages, updateSessionTitle, listSessions, deleteSession, pruneOldSessions
- **Session Persistence**: Current session ID stored in localStorage (`current-session-id` key)
  - Auto-restores last session on page reload
  - Cleared when starting new chat
  - Updated when switching sessions or creating new session
  - Enables seamless user experience across browser refreshes
- **Message Copy Feature**: One-click copy for all messages
  - **Position**: Outside bubble at bottom-right corner (`absolute -bottom-2 -right-2`)
  - **Styling**: Circular button (`rounded-full`) with white background + shadow
  - **Responsive**:
    - Mobile: Always visible (`opacity-100`)
    - Desktop: Show on hover (`lg:opacity-0 lg:group-hover:opacity-100`)
  - **Content**: Icon only, no text (4x4 icon size)
  - **Copy mechanism**: 
    - Primary: `navigator.clipboard.writeText()` (modern browsers)
    - Fallback: `document.execCommand('copy')` (HTTP, old browsers)
  - **Visual feedback**: Icon changes to green checkmark for 2 seconds
  - **State**: `copiedMessageIndex` tracks which message was copied
  - **Error handling**: Displays friendly error if clipboard access fails
- **Message Share Feature**: Multi-message selection and sharing
  - **Mobile - Long-press Gesture**: 500ms touch to enter selection mode (touch events only)
    - Timer stored in `longPressTimer` ref
    - `onTouchStart` starts timer, `onTouchEnd`/`onTouchMove` cancels
    - First selected message auto-added when entering mode
    - No mouse events (onMouseDown/Up/Leave removed)
  - **Desktop - Share Button**: Click to enter selection mode
    - Position: Left of copy button in `flex gap-1` container
    - Visibility: `hidden lg:block opacity-0 lg:group-hover:opacity-100`
    - Action: `enterShareMode(index)` - enters selection mode with message pre-selected
    - Icon: Share/connect nodes SVG
  - **Selection Mode UI**:
    - Checkboxes appear left of each message (6x6 rounded border-2)
    - Selected messages: blue checkmark + ring-2 ring-blue-500 highlight
    - Copy and share buttons hidden during selection mode
    - Click message bubble to toggle selection
  - **Bottom Toolbar** (shown when `isSelectMode === true`):
    - **全選** button: Selects all messages in conversation
    - **取消** button: Exits selection mode, clears selection
    - **分享(N)** button: Shares N selected messages
      - Disabled when `selectedMessages.size === 0`
      - Shows count badge
      - Share icon (connect nodes)
  - **Share Format**: Markdown with emoji labels
    ```
    與 QuizMate AI 老師的討論
    ──────────────────────────────
    👤 用戶：[question]
    🤖 AI：[answer]
    ```
  - **Web Share API Integration**:
    - Primary: `navigator.share({ title, text })` - native share sheet
    - Fallback: `navigator.clipboard.writeText()` + alert
    - Supports: LINE, Messenger, WhatsApp, Mail, Notes, etc.
    - Error handling: AbortError (user cancel) silently ignored
  - **State Management**:
    - `isSelectMode: boolean` - toggles selection UI
    - `selectedMessages: Set<number>` - tracks selected indices
    - Functions: `toggleMessageSelect`, `selectAllMessages`, `clearSelection`, `shareSelectedMessages`, `formatSelectedMessages`, `enterShareMode`
- **Error Message Close Button**:
  - **Position**: `absolute top-2 right-2` in relative error container
  - **Styling**: Red color scheme, hover effect, X icon
  - **Action**: `onClick={() => setError(null)}` - dismisses error
  - **Content Padding**: `pr-6` to avoid overlap with close button
  - **Accessibility**: Clear visual feedback, sufficient contrast, descriptive title

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
- **Vitest**: Unit testing framework with 1074 tests (frontend logic, Gemini SDK integration, API key rotation, error handling, DB LRU, theme, session management, sidebar responsive behavior, sidebar persistence (10 tests - save/restore state), scroll position memory (15 tests - save/restore per session), scroll after AI response (23 tests - padding management, session switch detection, no scroll jumps), session hover buttons, session title editing with click-outside, session time format display, smart scroll buttons (23 tests - visibility logic with opacity-based hiding), camera feature with platform detection, MessageBubble ref forwarding (5 tests - React component integration), Markdown rendering (55 tests), HTML sanitization (72 tests), syntax highlighting (78 tests), message sharing (31 tests - mobile touch gestures), desktop share button (21 tests - desktop click enter selection mode), error close button (22 tests - dismiss errors), table overflow handling (33 tests - horizontal scroll with auto-sizing cells and wordBreak management), code block overflow handling (24 tests - horizontal scroll for long code lines), Enter key behavior (23 tests - newline instead of submit), utilities)
- **React Testing Library 16.3.1**: React component testing with DOM rendering validation
- **TypeScript strict mode**: No `any` types without justification
- **Vitest Config**: Path alias `@` → `./src` configured in vitest.config.ts for consistent imports

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
