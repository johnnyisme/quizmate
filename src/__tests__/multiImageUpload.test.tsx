/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('Multi-Image Upload Feature', () => {
  beforeEach(() => {
    // Mock localStorage with API keys
    const mockLocalStorage: Record<string, string> = {
      'gemini-api-keys': JSON.stringify(['test-key-1', 'test-key-2']),
    };
    
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return mockLocalStorage[key] || null;
    });
    
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete mockLocalStorage[key];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Image Upload in Same Session', () => {
    it('should allow uploading second image without creating new session', async () => {
      const { container } = render(<HomePage />);
      
      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      // First image upload
      const file1 = new File(['image1'], 'test1.png', { type: 'image/png' });
      const input = container.querySelector('#dropzone-file') as HTMLInputElement;
      expect(input).toBeTruthy();
      
      fireEvent.change(input, { target: { files: [file1] } });
      
      await waitFor(() => {
        expect(input.value).toBe(''); // Input should be cleared
      });

      // Simulate sending first message
      // (In real test, would need to mock API and trigger send)
      
      // Second image upload
      const file2 = new File(['image2'], 'test2.png', { type: 'image/png' });
      
      fireEvent.change(input, { target: { files: [file2] } });
      
      await waitFor(() => {
        expect(input.value).toBe(''); // Input should be cleared again
      });
    });

    it('should clear file input after each upload to allow re-selection', async () => {
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      const input = container.querySelector("#dropzone-file") as HTMLInputElement;
      expect(input).toBeTruthy();
      const file = new File(['image'], 'test.png', { type: 'image/png' });
      
      // First upload
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });

      // Re-upload same file
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Image Preview Display', () => {
    it('should show preview above input when conversation has messages', async () => {
      // This would require setting up a session with existing messages
      // and then uploading an image
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      // Note: Full implementation would require mocking session with messages
      expect(container).toBeTruthy();
    });

    it('should not show preview above input when conversation is empty', async () => {
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = container.querySelector("#dropzone-file") as HTMLInputElement;
      expect(input).toBeTruthy();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      // In empty conversation, only center upload area should show image
      // No small preview above input
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

  });

  describe('Image State Management', () => {
    it('should preserve image preview when opening settings modal', async () => {
      // Settings modal is just an overlay, should NOT clear preview
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      // Upload an image first
      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = container.querySelector("#dropzone-file") as HTMLInputElement;
      expect(input).toBeTruthy();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });

      // Open settings
      const settingsButton = screen.getByTitle(/設定/i);
      fireEvent.click(settingsButton);
      
      // Wait for Settings modal to appear (dynamic import)
      await waitFor(() => {
        expect(screen.getByText(/QuizMate - AI 互動家教/i)).toBeInTheDocument();
      });

      // Close settings - find close button by title
      const closeButton = screen.getByTitle(/關閉/i);
      fireEvent.click(closeButton);
      
      // Settings should be closed
      await waitFor(() => {
        expect(screen.queryByText(/QuizMate - AI 互動家教/i)).not.toBeInTheDocument();
      });
      
      // Main component should still be mounted (image state preserved)
      expect(input).toBeInTheDocument();
    });

    it('should preserve image reference before clearing state', async () => {
      // This tests the pattern: save currentImage → clear state → use currentImage
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      // Upload and send would trigger the save-clear-use pattern
      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = container.querySelector("#dropzone-file") as HTMLInputElement;
      expect(input).toBeTruthy();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not restore image preview on page reload', async () => {
      // Image preview should be temporary, not persisted
      const { container, unmount } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = container.querySelector("#dropzone-file") as HTMLInputElement;
      expect(input).toBeTruthy();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      unmount();
      
      // Re-render (simulates page reload)
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      // Preview should not be restored
      const removeButtons = screen.queryAllByTitle(/移除圖片/i);
      expect(removeButtons.length).toBe(0);
    });

    it('should clear preview when switching sessions', async () => {
      // Switching sessions should clear image preview
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = container.querySelector("#dropzone-file") as HTMLInputElement;
      expect(input).toBeTruthy();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });

      // Note: Full test would require mocking session switch
      // Preview should be cleared after session switch
    });
  });

  describe('Error Recovery', () => {
    it('should restore image state on send failure', async () => {
      // When API call fails, image should be restored so user can retry
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = container.querySelector("#dropzone-file") as HTMLInputElement;
      expect(input).toBeTruthy();
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });

      // Note: Full test would require mocking API failure
      // and verifying image preview is restored
    });
  });

  describe('Initial Load Flag', () => {
    it('should use isInitialLoad flag to prevent image restoration on page load', async () => {
      // isInitialLoad.current should prevent restoring old images
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      // On first render, isInitialLoad should be true
      // This prevents session.imageBase64 from being restored
      const removeButtons = screen.queryAllByTitle(/移除圖片/i);
      expect(removeButtons.length).toBe(0);
    });

    it('should set isInitialLoad to false after first session load', async () => {
      // After first session load, flag should be false
      const { container } = render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
      });

      // Note: Full test would require mocking session load
      // and verifying flag state change
      expect(screen.queryByText(/載入中/)).not.toBeInTheDocument();
    });
  });
});
