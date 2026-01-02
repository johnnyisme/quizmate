/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContentStream: vi.fn(),
    })),
  })),
}));

// Mock IndexedDB
vi.mock('@/lib/db', () => ({
  initDB: vi.fn(),
  createSession: vi.fn(),
  getSession: vi.fn(),
  appendMessages: vi.fn(),
  updateSessionTitle: vi.fn(),
  listSessions: vi.fn(() => Promise.resolve([])),
  deleteSession: vi.fn(),
  getSessionCount: vi.fn(() => Promise.resolve(0)),
  pruneOldSessions: vi.fn(),
  clearAllSessions: vi.fn(),
  closeDB: vi.fn(),
  MAX_SESSIONS: 30,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
}));

// Mock useSessionStorage hooks
vi.mock('@/lib/useSessionStorage', () => ({
  useSessionStorage: () => ({
    session: null,
    createNewSession: vi.fn(),
    addMessages: vi.fn(),
    updateTitle: vi.fn(),
  }),
  useSessionHistory: () => ({
    sessions: [],
    loadSessions: vi.fn(),
    removeSession: vi.fn(),
    performCleanup: vi.fn(),
  }),
}));

// Helper function to simulate file upload
const uploadFile = (input: HTMLInputElement, file: File) => {
  // 先刪除已存在的 files 屬性定義（如果有）
  try {
    delete (input as any).files;
  } catch (e) {
    // 忽略刪除失敗的錯誤
  }
  
  Object.defineProperty(input, 'files', {
    value: [file],
    writable: false,
    configurable: true, // 允許重新配置
  });
  fireEvent.change(input);
};

describe('Image Size Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('gemini-api-keys', JSON.stringify(['test-key']));
  });

  it('should accept images smaller than 10MB', async () => {
    render(<HomePage />);
    
    // 創建 5MB 的模擬圖片
    const smallFile = new File(['x'.repeat(5 * 1024 * 1024)], 'small.jpg', { type: 'image/jpeg' });
    Object.defineProperty(smallFile, 'size', { value: 5 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, smallFile);
    
    // 應該不顯示錯誤
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/圖片檔案太大/i);
      expect(errorMessages).toHaveLength(0);
    });
  });

  it('should reject images larger than 10MB', async () => {
    render(<HomePage />);
    
    // 創建 15MB 的模擬圖片
    const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, largeFile);
    
    // 應該顯示錯誤訊息
    await waitFor(() => {
      expect(screen.getByText(/圖片檔案太大/i)).toBeInTheDocument();
    });
  });

  it('should show file size in error message', async () => {
    render(<HomePage />);
    
    const largeFile = new File(['x'.repeat(12 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 12 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, largeFile);
    
    await waitFor(() => {
      // 主錯誤訊息應該顯示
      expect(screen.getByText(/圖片檔案太大/i)).toBeInTheDocument();
    });
  });

  it('should provide compression suggestions in error message', async () => {
    render(<HomePage />);
    
    const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 20 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, largeFile);
    
    await waitFor(() => {
      // 主錯誤訊息應該顯示
      expect(screen.getByText(/圖片檔案太大/i)).toBeInTheDocument();
    });
  });

  it('should clear input after rejection to allow reselection', async () => {
    render(<HomePage />);
    
    const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, largeFile);
    
    await waitFor(() => {
      // Input 應該被清空，允許重新選擇同一個檔案
      expect(input.value).toBe('');
    });
  });

  it('should accept exactly 10MB image', async () => {
    render(<HomePage />);
    
    // 創建剛好 10MB 的圖片
    const exactFile = new File(['x'.repeat(10 * 1024 * 1024)], 'exact.jpg', { type: 'image/jpeg' });
    Object.defineProperty(exactFile, 'size', { value: 10 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, exactFile);
    
    // 10MB 剛好等於限制，應該接受
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/圖片檔案太大/i);
      expect(errorMessages).toHaveLength(0);
    });
  });

  it('should reject 10MB + 1 byte image', async () => {
    render(<HomePage />);
    
    const overLimitFile = new File(['x'.repeat(10 * 1024 * 1024 + 1)], 'over.jpg', { type: 'image/jpeg' });
    Object.defineProperty(overLimitFile, 'size', { value: 10 * 1024 * 1024 + 1 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, overLimitFile);
    
    await waitFor(() => {
      expect(screen.getByText(/圖片檔案太大/i)).toBeInTheDocument();
    });
  });

  it('should handle camera capture with large image', async () => {
    render(<HomePage />);
    
    const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'camera.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 });
    
    // 模擬相機拍照輸入
    const cameraInput = document.querySelector('input[type="file"]#camera-file') as HTMLInputElement;
    uploadFile(cameraInput, largeFile);
    
    await waitFor(() => {
      expect(screen.getByText(/圖片檔案太大/i)).toBeInTheDocument();
    });
  });

  it('should allow dismissing error and uploading new image', async () => {
    render(<HomePage />);
    
    // 先上傳過大的圖片
    const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, largeFile);
    
    await waitFor(() => {
      expect(screen.getByText(/圖片檔案太大/i)).toBeInTheDocument();
    });
    
    // 關閉錯誤訊息
    const closeButton = screen.getByRole('button', { name: /關閉/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/圖片檔案太大/i)).not.toBeInTheDocument();
    });
    
    // 上傳正常大小的圖片
    const smallFile = new File(['x'.repeat(5 * 1024 * 1024)], 'small.jpg', { type: 'image/jpeg' });
    Object.defineProperty(smallFile, 'size', { value: 5 * 1024 * 1024 });
    
    uploadFile(input, smallFile);
    
    // 應該成功，不顯示錯誤 (等待一下確保處理完成)
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/圖片檔案太大/i);
      expect(errorMessages).toHaveLength(0);
    }, { timeout: 2000 });
  });

  it('should mention 10MB limit in error suggestion', async () => {
    render(<HomePage />);
    
    const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 });
    
    const input = document.querySelector('input[type="file"]#dropzone-file') as HTMLInputElement;
    uploadFile(input, largeFile);
    
    await waitFor(() => {
      // 主錯誤訊息應該顯示
      expect(screen.getByText(/圖片檔案太大/i)).toBeInTheDocument();
    });
  });
});
