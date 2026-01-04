# Page.tsx 重構計劃

## 🎯 目標
將 1855 行的 page.tsx 重構為模組化、可維護的結構

## ✅ 已完成

### Phase 1: 創建自定義 Hooks
- ✅ `src/hooks/useUIState.ts` - UI 狀態管理
- ✅ `src/hooks/useSettingsState.ts` - 設定狀態管理
- ✅ `src/hooks/useChatState.ts` - 對話狀態管理
- ✅ `src/hooks/useImageState.ts` - 圖片狀態管理
- ✅ `src/hooks/useSelectionState.ts` - 選取狀態管理

### Phase 2: 提取工具函數
- ✅ `src/utils/errorHandling.ts` - 錯誤處理工具
- ✅ `src/utils/fileUtils.ts` - 檔案處理工具

## 📋 待完成

### Phase 3: 創建業務邏輯 Hooks

#### 3.1 Camera Hook
**檔案**: `src/hooks/useCamera.ts`
**功能**: 
- 攝影機開啟/關閉
- 拍照處理
- 平台偵測（desktop vs mobile）

#### 3.2 Message Actions Hook
**檔案**: `src/hooks/useMessageActions.ts`
**功能**:
- 複製訊息
- 長按選取
- 多選分享
- 訊息格式化

#### 3.3 Theme Hook
**檔案**: `src/hooks/useTheme.ts`
**功能**:
- 主題切換
- 主題初始化
- KaTeX 動態載入

#### 3.4 Scroll Management Hook
**檔案**: `src/hooks/useScrollManagement.ts`
**功能**:
- 滾動位置記憶
- 自動滾動到問題
- 滾動按鈕顯示邏輯

#### 3.5 Session Management Hook
**檔案**: `src/hooks/useSessionManagement.ts`
**功能**:
- 新建對話
- 切換對話
- 刪除對話
- 編輯標題

#### 3.6 Gemini API Hook
**檔案**: `src/hooks/useGeminiAPI.ts`
**功能**:
- API 呼叫
- Key 輪轉
- 錯誤處理
- 串流處理

### Phase 4: 拆分 UI 組件

#### 4.1 Header Component
**檔案**: `src/components/Header.tsx`
**內容**:
- 側邊欄切換
- Logo
- Prompt 選擇器
- 模型選擇器
- 設定按鈕

#### 4.2 ChatArea Component
**檔案**: `src/components/ChatArea.tsx`
**內容**:
- 對話訊息列表
- 空狀態
- 載入狀態
- 錯誤顯示

#### 4.3 ErrorDisplay Component
**檔案**: `src/components/ErrorDisplay.tsx`
**內容**:
- 錯誤訊息
- 建議展開
- 技術細節展開
- 關閉按鈕

#### 4.4 ImagePreview Component
**檔案**: `src/components/ImagePreview.tsx`
**內容**:
- 圖片預覽（大/小）
- 移除按鈕
- 點擊放大

#### 4.5 SelectionToolbar Component
**檔案**: `src/components/SelectionToolbar.tsx`
**內容**:
- 全選按鈕
- 取消按鈕
- 分享按鈕

#### 4.6 ScrollButtons Component
**檔案**: `src/components/ScrollButtons.tsx`
**內容**:
- 回到頂部
- 跳到最新
- 顯示/隱藏邏輯

#### 4.7 CameraModal Component
**檔案**: `src/components/CameraModal.tsx`
**內容**:
- 攝影機預覽
- 拍照按鈕
- 取消按鈕

### Phase 5: 重構 page.tsx

**目標結構**:
```tsx
export default function HomePage() {
  // Custom hooks
  const ui = useUIState();
  const settings = useSettingsState();
  const chat = useChatState();
  const image = useImageState();
  const selection = useSelectionState();
  const theme = useTheme();
  const camera = useCamera(image);
  const scroll = useScrollManagement();
  const sessions = useSessionManagement();
  const messageActions = useMessageActions();
  const gemini = useGeminiAPI(settings, chat);
  
  // Main render
  return (
    <div>
      <Header ... />
      <Sidebar ... />
      <ChatArea ... />
      <InputArea ... />
      <Modals ... />
    </div>
  );
}
```

**預期成果**:
- page.tsx < 300 行
- 邏輯清晰分離
- 易於測試
- 易於維護

## 📊 重構效益

### 程式碼組織
- ✅ 關注點分離 (Separation of Concerns)
- ✅ 單一職責原則 (Single Responsibility)
- ✅ 可重用性提升

### 可維護性
- ✅ 更容易定位問題
- ✅ 更容易添加新功能
- ✅ 更容易編寫測試

### 效能
- ✅ 更細粒度的 memo 優化
- ✅ 更好的 code splitting
- ✅ 減少不必要的 re-render

## 🔄 執行策略

### 漸進式重構
1. **不破壞現有功能** - 所有測試持續通過
2. **逐步遷移** - 一次重構一個模組
3. **向後相容** - 保持 API 一致性
4. **持續驗證** - 每次重構後跑測試

### 測試策略
1. 先跑一次完整測試確保基準
2. 每完成一個 phase 跑一次測試
3. 如果測試失敗，立即修復
4. 最後跑完整的 E2E 測試

## 🚀 下一步

建議按以下順序執行：
1. Phase 3.3 - Theme Hook（最簡單）
2. Phase 3.2 - Message Actions Hook
3. Phase 3.1 - Camera Hook
4. Phase 3.4 - Scroll Management Hook
5. Phase 3.5 - Session Management Hook
6. Phase 3.6 - Gemini API Hook（最複雜）
7. Phase 4 - UI 組件拆分
8. Phase 5 - 重構 page.tsx

是否要我開始執行 Phase 3？
