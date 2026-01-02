# Integration Test 補齊計畫

## ✅ 完成狀態 (2026-01-02)

**所有 5 個 Phase 已完成！**
- 總測試數：1,021 tests (926 unit + 95 integration)
- 整合測試增幅：+10.3%
- 目標達成率：119-136% (原定 70-80 tests，實際 95 tests)

### 已完成 Integration Tests
1. ✅ **Phase 1** - Error Handling (19 tests)
2. ✅ **Phase 2** - Scroll Features (17 tests)
3. ✅ **Phase 3** - Session UI (22 tests)
4. ✅ **Phase 4** - Message Interaction (18 tests)
5. ✅ **Phase 5** - Input & UI State (14 tests)

---

## 現況分析（已完成）

### ✅ 已有完整測試
- **MessageBubble** - 5 integration tests (React Testing Library)
- **ApiKeySetup** - 33 logic tests（純邏輯，需補 DOM）
- **Settings** - 41 logic tests（純邏輯，需補 DOM）
- **PromptSettings** - 39 logic tests（純邏輯，需補 DOM）

### ❌ 測試缺口（Critical）
**只有邏輯測試，沒有 DOM 渲染驗證的功能：**

1. **錯誤處理 UI** (`errorHandling.test.ts`)
   - ❌ 缺少：展開/收起按鈕渲染
   - ❌ 缺少：錯誤訊息關閉按鈕（errorCloseButton 有邏輯但沒 DOM）
   - ❌ 缺少：自動滾動到錯誤詳情

2. **滾動相關功能**
   - ❌ `scrollToQuestion` - 只測邏輯，沒驗證實際滾動效果
   - ❌ `scrollButtons` - 只測狀態，沒驗證按鈕顯示/隱藏
   - ❌ `smartScrollButtons` - 只測可見性邏輯，沒驗證 opacity
   - ❌ `scrollPositionMemory` - 只測 localStorage，沒驗證實際恢復

3. **Session 管理 UI**
   - ❌ `sessionTitleEdit` - 只測邏輯，沒驗證編輯框渲染
   - ❌ `sessionHoverButtons` - 只測狀態，沒驗證 hover 效果
   - ❌ `sessionTimeFormat` - 只測格式化，沒驗證顯示

4. **訊息功能**
   - ❌ `copyMessage` - 只測 clipboard API，沒驗證按鈕渲染
   - ❌ `shareMessages` - 只測選取邏輯，沒驗證選取框 UI
   - ❌ `desktopShareButton` - 只測邏輯，沒驗證桌面按鈕顯示

5. **輸入相關**
   - ❌ `inputAutoGrow` - 只測高度計算，沒驗證 textarea 渲染

6. **側邊欄**
   - ❌ `sidebarToggle` - 只測狀態，沒驗證動畫效果
   - ❌ `sidebarPersistence` - 只測 localStorage，沒驗證初始狀態

7. **主題切換**
   - ❌ `theme` - 只測狀態，沒驗證 class 切換

8. **相機功能**
   - ❌ `cameraFeature` - 只測邏輯，沒驗證 modal 渲染

---

## 🎯 Integration Test 策略

### 測試分級（優先順序）

**P0 - Critical Path（影響核心功能）**
1. 錯誤處理 UI（展開/關閉/滾動）
2. 滾動到問題（scroll-to-question）
3. Session 標題編輯（編輯框渲染 + 外部點擊）
4. 訊息複製按鈕（hover 顯示 + 點擊複製）
5. 主題切換（class 變更）

**P1 - Important（常用功能）**
6. 智慧滾動按鈕（可見性 + opacity）
7. 訊息分享選取框（checkbox 渲染）
8. 側邊欄切換動畫
9. 輸入框自動增長

**P2 - Nice to Have（增強體驗）**
10. Session hover 按鈕效果
11. 相機 modal 渲染
12. 滾動位置恢復視覺驗證

---

## 📋 具體實作計畫

### ✅ Phase 1: 錯誤處理 Integration Tests (已完成)
**檔案**: `src/__tests__/errorHandling.integration.test.tsx` (19 tests)
**狀態**: ✅ 已提交並推送 (2026-01-02)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Error Handling Integration', () => {
  it('should render friendly error message with expand button', () => {
    // 渲染帶錯誤的組件
    // 驗證：主要錯誤訊息顯示
    // 驗證：展開按鈕存在
  });

  it('should expand/collapse error suggestion on click', () => {
    // 點擊展開箭頭
    // 驗證：suggestion div 顯示
    // 再次點擊
    // 驗證：suggestion div 隱藏
  });

  it('should show close button and dismiss error on click', () => {
    // 驗證：關閉按鈕渲染在右上角
    // 點擊關閉
    // 驗證：錯誤訊息消失
  });

  it('should auto-scroll to expanded content', async () => {
    // 展開錯誤詳情
    // 驗證：scrollIntoView 被呼叫
  });

  it('should show two-level expand (suggestion + technical details)', () => {
    // 展開第一層（建議）
    // 驗證：技術詳情按鈕顯示
    // 展開第二層
    // 驗證：原始錯誤訊息顯示
  });
});
```

**估計測試數量**: 8-10 tests

---

### ✅ Phase 2: 滾動功能 Integration Tests (已完成)
**檔案**: `src/__tests__/scrollFeatures.integration.test.tsx` (17 tests)
**狀態**: ✅ 已提交並推送 (2026-01-02)

```typescript
describe('Scroll Features Integration', () => {
  describe('Scroll to Question', () => {
    it('should add paddingBottom when loading starts', () => {
      // 模擬送出問題
      // 驗證：chatContainer.style.paddingBottom === '80vh'
    });

    it('should remove paddingBottom when loading ends', () => {
      // 完成 loading
      // 驗證：paddingBottom 移除
    });

    it('should scroll to last user message with smooth behavior', () => {
      // 驗證：lastUserMessageRef.current 存在
      // 驗證：scrollTo 被呼叫，參數正確
    });
  });

  describe('Smart Scroll Buttons', () => {
    it('should show scroll-to-top button when scrolled > 100px', () => {
      // 模擬滾動到 150px
      // 驗證：按鈕 opacity/visible class
    });

    it('should hide scroll-to-top button at top', () => {
      // 滾動到 0px
      // 驗證：按鈕 hidden
    });

    it('should trigger scrollTo on button click', () => {
      // 點擊回到頂部
      // 驗證：scrollTo({ top: 0, behavior: 'smooth' })
    });
  });

  describe('Scroll Position Memory', () => {
    it('should restore scroll position from localStorage on mount', () => {
      // 設定 localStorage scroll-pos-{sessionId}
      // 掛載組件
      // 等待 100ms
      // 驗證：scrollTop 被設定為儲存值
    });
  });
});
```

**估計測試數量**: 12-15 tests

---

### ✅ Phase 3: Session UI Integration Tests (已完成)
**檔案**: `src/__tests__/sessionUI.integration.test.tsx` (22 tests)
**狀態**: ✅ 已提交並推送 (2026-01-02)

```typescript
describe('Session UI Integration', () => {
  describe('Title Editing', () => {
    it('should render edit icon on hover (desktop)', () => {
      // 渲染 session item
      // hover 到 session
      // 驗證：編輯按鈕 opacity 變化
    });

    it('should show input field when clicking edit', () => {
      // 點擊編輯
      // 驗證：input 顯示
      // 驗證：儲存/取消按鈕顯示
    });

    it('should save on Enter key', () => {
      // 進入編輯模式
      // 輸入新標題
      // 按 Enter
      // 驗證：updateTitle 被呼叫
    });

    it('should cancel on Escape or outside click', () => {
      // 進入編輯模式
      // 點擊外部
      // 驗證：編輯模式關閉
    });
  });

  describe('Hover Buttons', () => {
    it('should show edit/delete buttons on hover (desktop)', () => {
      // hover session
      // 驗證：按鈕 opacity: 0 -> 100
    });

    it('should always show buttons on mobile', () => {
      // 模擬 mobile viewport
      // 驗證：按鈕 opacity: 100
    });
  });

  describe('Time Format Display', () => {
    it('should render full timestamp (YYYY/MM/DD HH:mm:ss)', () => {
      // 渲染 session with timestamp
      // 驗證：顯示格式正確
      // 驗證：包含秒數
    });
  });
});
```

**估計測試數量**: 10-12 tests

---

### ✅ Phase 4: 訊息互動 Integration Tests (已完成)
**檔案**: `src/__tests__/messageInteraction.integration.test.tsx` (18 tests)
**狀態**: ✅ 已提交並推送 (2026-01-02)

```typescript
describe('Message Interaction Integration', () => {
  describe('Copy Button', () => {
    it('should render copy button outside bubble bottom-right', () => {
      // 渲染 MessageBubble
      // 驗證：按鈕位置 absolute -bottom-2 -right-2
    });

    it('should show copy button on hover (desktop)', () => {
      // hover message
      // 驗證：opacity 變化
    });

    it('should show checkmark for 2 seconds after copy', async () => {
      // 點擊複製
      // 驗證：綠色 checkmark 顯示
      // 等待 2 秒
      // 驗證：恢復複製圖示
    });
  });

  describe('Share Selection', () => {
    it('should show checkbox when entering select mode', () => {
      // 長按訊息 500ms
      // 驗證：checkbox 渲染
    });

    it('should show bottom toolbar with count', () => {
      // 選取 3 則訊息
      // 驗證：toolbar 顯示 "已選 3 則"
    });

    it('should highlight selected messages with ring', () => {
      // 選取訊息
      // 驗證：ring-2 ring-blue-500 class
    });
  });

  describe('Desktop Share Button', () => {
    it('should show share button on hover (desktop only)', () => {
      // 模擬桌面
      // hover message
      // 驗證：分享按鈕顯示
    });

    it('should enter select mode with message pre-selected', () => {
      // 點擊分享按鈕
      // 驗證：isSelectMode = true
      // 驗證：該訊息已選取
    });
  });
});
```

**估計測試數量**: 15-18 tests

---

### Phase 5: 輸入與 UI 狀態 Integration Tests
**新檔案**: `src/__tests__/inputAndUI.integration.test.tsx`

```typescript
describe('Input and UI State Integration', () => {
  describe('Auto-Growing Textarea', () => {
    it('should adjust height as content grows', () => {
      // 輸入多行文字
      // 驗證：textarea.style.height 增加
      // 驗證：max 3 行（66px）
    });

    it('should shrink back on blur (mobile keyboard)', () => {
      // 輸入文字後 blur
      // 驗證：height 恢復 36px
    });
  });

  describe('Theme Toggle', () => {
    it('should add dark class to html when toggling', () => {
      // 點擊主題切換
      // 驗證：document.documentElement.classList.contains('dark')
    });

    it('should persist to localStorage', () => {
      // 切換主題
      // 驗證：localStorage.getItem('theme') === 'dark'
    });
  });

  describe('Sidebar Animation', () => {
    it('should apply translate-x transition', () => {
      // 開啟 sidebar
      // 驗證：translate-x-0 class
      // 關閉 sidebar
      // 驗證：-translate-x-full class
    });
  });
});
```

**估計測試數量**: 8-10 tests

---

## 📊 預期成果

### 測試數量增加
- **現有**: 926 unit tests（大部分純邏輯）
- **新增**: ~70-80 integration tests
- **總計**: ~1000 tests

### 覆蓋率提升
- **邏輯覆蓋率**: ~90%（已達成）
- **DOM/渲染覆蓋率**: 目前 <5% → 目標 60-70%
- **整體覆蓋率**: 目標 80-85%

### Integration vs E2E 成本對比
| 測試類型 | 執行時間 | 維護成本 | 覆蓋範圍 |
|---------|---------|---------|---------|
| E2E (Playwright) | ~30-60s | 高（環境依賴） | 完整用戶流程 |
| Integration (RTL) | ~5-10s | 中（組件 API） | 單一功能 + DOM |
| Unit (純邏輯) | <1s | 低（純函數） | 函數邏輯 |

**Integration test 優勢**：
- ✅ 比 E2E 快 5-10 倍
- ✅ 不需要啟動瀏覽器
- ✅ 驗證 DOM 渲染 + 用戶互動
- ✅ 可獨立測試組件行為
- ✅ 容易 debug（jsdom stack trace）

---

## 🚀 實作順序建議

### Week 1: Critical Path（P0）
1. ✅ 錯誤處理 Integration (8-10 tests)
2. ✅ 滾動到問題 (5-7 tests)
3. ✅ Session 標題編輯 (6-8 tests)

### Week 2: Important Features（P1）
4. ✅ 訊息複製/分享 UI (15-18 tests)
5. ✅ 智慧滾動按鈕 (7-9 tests)
6. ✅ 輸入與主題 (8-10 tests)

### Week 3: Polish（P2）
7. ✅ 側邊欄動畫驗證
8. ✅ 相機 modal 渲染
9. ✅ 滾動位置恢復視覺檢查

---

## 📝 測試範本（可複用）

### 基本 Integration Test 結構
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '@/app/page';

describe('Feature Name Integration', () => {
  beforeEach(() => {
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem');
  });

  it('should render element with correct styles', () => {
    render(<HomePage />);
    const element = screen.getByRole('button', { name: /label/i });
    
    // 驗證渲染
    expect(element).toBeInTheDocument();
    
    // 驗證樣式
    expect(element).toHaveClass('expected-class');
  });

  it('should respond to user interaction', async () => {
    render(<HomePage />);
    const button = screen.getByRole('button', { name: /click/i });
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/result/i)).toBeInTheDocument();
    });
  });
});
```

---

## ✅ Definition of Done

每個 integration test 必須驗證：
1. **DOM 渲染** - 元素存在且位置正確
2. **樣式應用** - CSS class 正確套用
3. **用戶互動** - 點擊/輸入觸發正確行為
4. **狀態變更** - UI 反映內部狀態變化
5. **可訪問性** - role/aria 屬性正確（bonus）

---

## 🎓 關鍵學習

### 為何 messageBubbleRef 的 bug 沒被抓到？
- **原因**: 只測試邏輯（ref 變數存在），沒測試 DOM（ref 實際綁定）
- **教訓**: React.memo/forwardRef 這類組件邊界需要 integration test
- **解法**: 使用 React Testing Library 渲染組件，驗證 ref.current

### Integration Test 黃金法則
1. **不要測試實作細節** - 測試用戶看到的
2. **從用戶角度測試** - getByRole > getByTestId
3. **等待非同步** - 使用 waitFor 而非 setTimeout
4. **獨立測試** - 每個 test 不依賴其他 test
5. **有意義的斷言** - 驗證行為，不只是存在

---

## 📚 參考資源

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Common Mistakes with RTL](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Playground](https://testing-playground.com/) - 找正確的 query
- [jest-dom Matchers](https://github.com/testing-library/jest-dom) - 斷言參考

