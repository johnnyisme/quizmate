/**
 * useCamera Hook 依賴陣列測試
 * 
 * 測試目標：驗證 MediaStream 的生命週期、 Camera 許可和圖片上傳
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCamera } from '@/hooks/useCamera';
import { useRef } from 'react';

describe('useCamera - MediaStream 生命週期和許可管理', () => {
  let mockGeometryGetUserMedia: any;
  let mockCanvasContext: any;

  beforeEach(() => {
    // Mock getUserMedia
    mockGeometryGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: vi.fn(() => [
        {
          stop: vi.fn(),
          kind: 'video',
        },
      ]),
    });

    // Mock canvas context
    mockCanvasContext = {
      drawImage: vi.fn(),
    };

    // Mock canvas.toBlob
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: vi.fn(() => mockCanvasContext),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: vi.fn((callback) => {
        callback(new Blob(['fake'], { type: 'image/jpeg' }));
      }),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGeometryGetUserMedia },
      writable: true,
      configurable: true,
    });

    // Mock isMobile
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Camera 許可和設備偵測', () => {
    it('應該在桌面設備上使用 getUserMedia', async () => {
      const mockSetError = vi.fn();
      const videoRef = { current: document.createElement('video') };
      const canvasRef = { current: document.createElement('canvas') };

      const { result } = renderHook(() =>
        useCamera({
          videoRef,
          canvasRef,
          cameraInputRef: { current: null },
          showCamera: false,
          setShowCamera: vi.fn(),
          cameraStream: null,
          setCameraStream: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: mockSetError,
        })
      );

      // 驗證桌面設備偵測
      expect(result.current.isMobile()).toBe(false);
    });

    it('應該在 getUserMedia 許可被拒時顯示錯誤', async () => {
      mockGeometryGetUserMedia.mockRejectedValueOnce(
        new DOMException('Permission denied', 'NotAllowedError')
      );

      const mockSetError = vi.fn();
      const videoRef = { current: document.createElement('video') };

      const { result } = renderHook(() =>
        useCamera({
          videoRef,
          canvasRef: { current: null },
          cameraInputRef: { current: null },
          showCamera: false,
          setShowCamera: vi.fn(),
          cameraStream: null,
          setCameraStream: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: mockSetError,
        })
      );

      await act(async () => {
        await result.current.handleOpenCamera();
      });

      expect(mockSetError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '無法存取攝影機',
        })
      );
    });
  });

  describe('圖片上傳驗證', () => {
    it('應該拒絕超過 10MB 的圖片', async () => {
      const mockSetError = vi.fn();
      const mockSetImage = vi.fn();

      const { result } = renderHook(() =>
        useCamera({
          videoRef: { current: null },
          canvasRef: { current: null },
          cameraInputRef: { current: null },
          showCamera: false,
          setShowCamera: vi.fn(),
          cameraStream: null,
          setCameraStream: vi.fn(),
          setImage: mockSetImage,
          setImageUrl: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: mockSetError,
        })
      );

      // 建立超過 10MB 的假檔案
      const largeBlob = new Blob(['x'.repeat(11 * 1024 * 1024)], {
        type: 'image/jpeg',
      });
      const largeFile = new File([largeBlob], 'large.jpg', {
        type: 'image/jpeg',
      });

      const mockEvent = {
        target: {
          files: [largeFile],
          value: 'fake.jpg',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      // Mock Object.defineProperty for file size
      Object.defineProperty(largeFile, 'size', {
        value: 11 * 1024 * 1024,
        writable: true,
      });

      await act(async () => {
        result.current.handleImageChange(mockEvent);
      });

      expect(mockSetError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '圖片檔案太大',
        })
      );
      expect(mockSetImage).not.toHaveBeenCalled();
    });

    it('應該接受小於 10MB 的圖片', async () => {
      const mockSetError = vi.fn();
      const mockSetImage = vi.fn();
      const mockSetImageUrl = vi.fn();

      const { result } = renderHook(() =>
        useCamera({
          videoRef: { current: null },
          canvasRef: { current: null },
          cameraInputRef: { current: null },
          showCamera: false,
          setShowCamera: vi.fn(),
          cameraStream: null,
          setCameraStream: vi.fn(),
          setImage: mockSetImage,
          setImageUrl: mockSetImageUrl,
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: mockSetError,
        })
      );

      const smallBlob = new Blob(['x'], { type: 'image/jpeg' });
      const smallFile = new File([smallBlob], 'small.jpg', {
        type: 'image/jpeg',
      });

      Object.defineProperty(smallFile, 'size', {
        value: 1024 * 1024, // 1MB
        writable: true,
      });

      const mockEvent = {
        target: {
          files: [smallFile],
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImageChange(mockEvent);
      });

      expect(mockSetImage).toHaveBeenCalledWith(smallFile);
      expect(mockSetImageUrl).toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith(null);
    });
  });

  describe('MediaStream 生命週期', () => {
    it('應該在關閉 camera 時停止所有 tracks', async () => {
      const mockSetShowCamera = vi.fn();
      const mockSetCameraStream = vi.fn();

      const mockTrack = {
        stop: vi.fn(),
        kind: 'video',
      };

      const mockStream = {
        getTracks: vi.fn(() => [mockTrack]),
      } as unknown as MediaStream;

      const { result } = renderHook(() =>
        useCamera({
          videoRef: { current: null },
          canvasRef: { current: null },
          cameraInputRef: { current: null },
          showCamera: true,
          setShowCamera: mockSetShowCamera,
          cameraStream: mockStream,
          setCameraStream: mockSetCameraStream,
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: vi.fn(),
        })
      );

      await act(async () => {
        result.current.handleCloseCamera();
      });

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mockSetCameraStream).toHaveBeenCalledWith(null);
      expect(mockSetShowCamera).toHaveBeenCalledWith(false);
    });

    it('應該在拍照時正確處理 canvas', async () => {
      const videoRef = { current: document.createElement('video') };
      const canvasRef = { current: document.createElement('canvas') };

      // Mock video dimensions
      Object.defineProperty(videoRef.current, 'videoWidth', {
        value: 640,
        writable: true,
      });
      Object.defineProperty(videoRef.current, 'videoHeight', {
        value: 480,
        writable: true,
      });

      const mockSetImage = vi.fn();
      const mockSetImageUrl = vi.fn();
      const mockSetShowCamera = vi.fn();
      const mockSetCameraStream = vi.fn();

      const mockStream = {
        getTracks: vi.fn(() => [{ stop: vi.fn() }]),
      };

      const { result } = renderHook(() =>
        useCamera({
          videoRef,
          canvasRef,
          cameraInputRef: { current: null },
          showCamera: true,
          setShowCamera: mockSetShowCamera,
          cameraStream: mockStream as unknown as MediaStream,
          setCameraStream: mockSetCameraStream,
          setImage: mockSetImage,
          setImageUrl: mockSetImageUrl,
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: vi.fn(),
        })
      );

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(mockCanvasContext.drawImage).toHaveBeenCalledWith(
        videoRef.current,
        0,
        0,
        640,
        480
      );
      expect(mockSetImage).toHaveBeenCalled();
      expect(mockSetImageUrl).toHaveBeenCalled();
    });
  });

  describe('平台偵測', () => {
    it('應該在 iOS 設備上識別為 mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useCamera({
          videoRef: { current: null },
          canvasRef: { current: null },
          cameraInputRef: { current: null },
          showCamera: false,
          setShowCamera: vi.fn(),
          cameraStream: null,
          setCameraStream: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: vi.fn(),
        })
      );

      expect(result.current.isMobile()).toBe(true);
    });

    it('應該在 Android 設備上識別為 mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G960F)',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useCamera({
          videoRef: { current: null },
          canvasRef: { current: null },
          cameraInputRef: { current: null },
          showCamera: false,
          setShowCamera: vi.fn(),
          cameraStream: null,
          setCameraStream: vi.fn(),
          setImage: vi.fn(),
          setImageUrl: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: vi.fn(),
        })
      );

      expect(result.current.isMobile()).toBe(true);
    });
  });

  describe('完整流程測試', () => {
    it('桌面拍照流程：開啟相機 → 拍照 → 關閉', async () => {
      const videoRef = { current: document.createElement('video') };
      const canvasRef = { current: document.createElement('canvas') };
      const mockSetShowCamera = vi.fn();
      const mockSetCameraStream = vi.fn();
      const mockSetImage = vi.fn();

      Object.defineProperty(videoRef.current, 'videoWidth', {
        value: 640,
        writable: true,
      });
      Object.defineProperty(videoRef.current, 'videoHeight', {
        value: 480,
        writable: true,
      });

      const { result } = renderHook(() =>
        useCamera({
          videoRef,
          canvasRef,
          cameraInputRef: { current: null },
          showCamera: false,
          setShowCamera: mockSetShowCamera,
          cameraStream: null,
          setCameraStream: mockSetCameraStream,
          setImage: mockSetImage,
          setImageUrl: vi.fn(),
          setDisplayConversation: vi.fn(),
          setApiHistory: vi.fn(),
          setCurrentSessionId: vi.fn(),
          setError: vi.fn(),
        })
      );

      // Step 1: 開啟相機
      await act(async () => {
        await result.current.handleOpenCamera();
      });

      expect(mockGeometryGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' },
      });

      // Step 2: 拍照
      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(mockSetImage).toHaveBeenCalled();
    });
  });
});
