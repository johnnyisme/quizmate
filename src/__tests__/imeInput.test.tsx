// src/__tests__/imeInput.test.tsx
// Tests for IME (Input Method Editor) handling in ChatInput component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatInput } from '@/components/ChatInput';

describe('IME Input Handling', () => {
  describe('注音輸入法選字行為', () => {
    it('應該在組字期間忽略 Enter 鍵（不送出訊息）', () => {
      const mockSubmit = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      // 模擬開始組字（輸入注音符號）
      fireEvent.compositionStart(textarea);
      
      // 模擬輸入文字
      fireEvent.change(textarea, { target: { value: '測試' } });
      
      // 模擬按 Enter 選字（此時 isComposing 為 true）
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      // ✅ 不應該觸發送出
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // 模擬組字結束
      fireEvent.compositionEnd(textarea);
    });

    it('應該在完成選字後正常處理 Enter 鍵（送出訊息）', () => {
      // Mock window.innerWidth for desktop behavior
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const mockSubmit = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      // 模擬開始組字
      fireEvent.compositionStart(textarea);
      
      // 模擬輸入文字
      fireEvent.change(textarea, { target: { value: '測試問題' } });
      
      // 模擬按 Enter 選字
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      // 模擬組字結束
      fireEvent.compositionEnd(textarea);
      
      // ✅ 現在 isComposing 為 false，再按 Enter 應該送出
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      expect(mockSubmit).toHaveBeenCalledWith('測試問題');
    });

    it('應該正確追蹤 isComposing 狀態', () => {
      const mockSubmit = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      // 初始狀態：不在組字模式
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      
      // 開始組字
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: 'Hello測' } });
      
      // 組字期間按 Enter 不送出
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // 結束組字
      fireEvent.compositionEnd(textarea);
      
      // 再次開始組字
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: 'Hello測試' } });
      
      // 組字期間按 Enter 仍不送出
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // 結束組字
      fireEvent.compositionEnd(textarea);
    });
  });

  describe('不同輸入法的兼容性', () => {
    it('應該支援日文輸入法', () => {
      const mockSubmit = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      // 模擬日文輸入法組字
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: 'こんにちは' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      // 不應該送出
      expect(mockSubmit).not.toHaveBeenCalled();
      
      fireEvent.compositionEnd(textarea);
    });

    it('應該支援簡體中文拼音輸入法', () => {
      const mockSubmit = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      // 模擬拼音輸入法組字
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: '你好' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      // 不應該送出
      expect(mockSubmit).not.toHaveBeenCalled();
      
      fireEvent.compositionEnd(textarea);
    });
  });

  describe('Edge Cases', () => {
    it('應該在組字期間允許 Shift+Enter 換行', () => {
      const mockSubmit = vi.fn();
      const mockPreventDefault = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: '測試' } });
      
      // Shift+Enter 不應該送出訊息（即使在組字中）
      const event = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        shiftKey: true,
        bubbles: true,
        cancelable: true 
      });
      
      fireEvent(textarea, event);
      
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('應該在沒有文字時不送出（即使不在組字模式）', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const mockSubmit = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      // 沒有文字，按 Enter 不送出
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Mobile vs Desktop Behavior', () => {
    it('應該在 mobile 上的組字期間不處理 Enter', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      const mockSubmit = vi.fn();
      
      render(
        <ChatInput
          onSubmit={mockSubmit}
          isLoading={false}
          hasImage={false}
          hasHistory={false}
          onUploadClick={vi.fn()}
          onCameraClick={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText('輸入問題或上傳圖片');
      
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: '測試' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      // Mobile 上組字期間也不送出
      expect(mockSubmit).not.toHaveBeenCalled();
      
      fireEvent.compositionEnd(textarea);
    });
  });
});
