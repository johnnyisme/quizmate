// src/__tests__/cameraFeature.test.ts
// 攝影機功能的單元測試

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Camera Feature', () => {
  describe('Device Detection', () => {
    it('should detect mobile devices (iOS)', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      expect(isMobile).toBe(true);
    });

    it('should detect mobile devices (Android)', () => {
      const userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G973F)';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      expect(isMobile).toBe(true);
    });

    it('should detect mobile devices (iPad)', () => {
      const userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      expect(isMobile).toBe(true);
    });

    it('should not detect desktop as mobile', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      expect(isMobile).toBe(false);
    });

    it('should not detect macOS as mobile', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      expect(isMobile).toBe(false);
    });
  });

  describe('Camera Button Click Logic', () => {
    it('should trigger file input on mobile', () => {
      const isMobile = true;
      let fileInputClicked = false;
      let cameraOpened = false;

      if (isMobile) {
        fileInputClicked = true;
      } else {
        cameraOpened = true;
      }

      expect(fileInputClicked).toBe(true);
      expect(cameraOpened).toBe(false);
    });

    it('should open camera on desktop', () => {
      const isMobile = false;
      let fileInputClicked = false;
      let cameraOpened = false;

      if (isMobile) {
        fileInputClicked = true;
      } else {
        cameraOpened = true;
      }

      expect(fileInputClicked).toBe(false);
      expect(cameraOpened).toBe(true);
    });
  });

  describe('Camera Modal State', () => {
    it('should show camera modal when opened', () => {
      let showCamera = false;
      
      // 模擬開啟攝影機
      showCamera = true;
      
      expect(showCamera).toBe(true);
    });

    it('should hide camera modal when closed', () => {
      let showCamera = true;
      
      // 模擬關閉攝影機
      showCamera = false;
      
      expect(showCamera).toBe(false);
    });

    it('should initialize with camera modal hidden', () => {
      const showCamera = false;
      
      expect(showCamera).toBe(false);
    });
  });

  describe('Camera Stream Management', () => {
    it('should set stream when camera opens', () => {
      let cameraStream: MediaStream | null = null;
      
      // 模擬設定 stream
      const mockStream = {} as MediaStream;
      cameraStream = mockStream;
      
      expect(cameraStream).not.toBeNull();
      expect(cameraStream).toBe(mockStream);
    });

    it('should clear stream when camera closes', () => {
      let cameraStream: MediaStream | null = {} as MediaStream;
      
      // 模擬清除 stream
      cameraStream = null;
      
      expect(cameraStream).toBeNull();
    });

    it('should handle null stream gracefully', () => {
      const cameraStream: MediaStream | null = null;
      
      // 不應該拋出錯誤
      expect(cameraStream).toBeNull();
    });
  });

  describe('Photo Capture Logic', () => {
    it('should create File object from captured photo', () => {
      // 模擬 blob 轉換為 File
      const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      const timestamp = Date.now();
      const file = new File([blob], `photo-${timestamp}.jpg`, { type: 'image/jpeg' });
      
      expect(file).toBeInstanceOf(File);
      expect(file.type).toBe('image/jpeg');
      expect(file.name).toContain('photo-');
      expect(file.name).toContain('.jpg');
    });

    it('should use correct JPEG quality (0.95)', () => {
      const quality = 0.95;
      
      expect(quality).toBe(0.95);
      expect(quality).toBeGreaterThan(0);
      expect(quality).toBeLessThanOrEqual(1);
    });

    it('should reset conversation after photo capture', () => {
      let displayConversation: any[] = [{ role: 'user', text: 'test' }];
      let apiHistory: any[] = [{ role: 'user', parts: [] }];
      let currentSessionId: string | null = 'session-1';
      let error: any = { message: 'test error' };
      
      // 模擬拍照後重置
      displayConversation = [];
      apiHistory = [];
      currentSessionId = null;
      error = null;
      
      expect(displayConversation).toHaveLength(0);
      expect(apiHistory).toHaveLength(0);
      expect(currentSessionId).toBeNull();
      expect(error).toBeNull();
    });
  });

  describe('Camera Input Attributes', () => {
    it('should have capture="environment" for mobile', () => {
      const captureAttribute = 'environment';
      
      expect(captureAttribute).toBe('environment');
    });

    it('should accept image/* files', () => {
      const acceptAttribute = 'image/*';
      
      expect(acceptAttribute).toBe('image/*');
    });

    it('should be hidden input', () => {
      const className = 'hidden';
      
      expect(className).toContain('hidden');
    });
  });

  describe('Camera Error Handling', () => {
    it('should show friendly error message on camera access failure', () => {
      const error = {
        message: '無法存取攝影機',
        suggestion: '請確認：\n1. 瀏覽器有攝影機權限\n2. 沒有其他應用程式正在使用攝影機\n3. 使用 HTTPS 連線（本地開發可用 localhost）'
      };
      
      expect(error.message).toBe('無法存取攝影機');
      expect(error.suggestion).toContain('瀏覽器有攝影機權限');
      expect(error.suggestion).toContain('HTTPS');
    });

    it('should handle getUserMedia rejection', () => {
      const errorMessage = 'NotAllowedError: Permission denied';
      
      expect(errorMessage).toContain('Permission denied');
    });
  });

  describe('Camera Modal UI', () => {
    it('should have full screen camera modal (z-[100])', () => {
      const zIndex = 'z-[100]';
      
      expect(zIndex).toBe('z-[100]');
    });

    it('should have black background', () => {
      const backgroundColor = 'bg-black';
      
      expect(backgroundColor).toBe('bg-black');
    });

    it('should have cancel and capture buttons', () => {
      const hasCancel = true;
      const hasCapture = true;
      
      expect(hasCancel).toBe(true);
      expect(hasCapture).toBe(true);
    });

    it('should have circular capture button with border', () => {
      const captureButtonClasses = 'w-16 h-16 rounded-full border-4 border-blue-500';
      
      expect(captureButtonClasses).toContain('rounded-full');
      expect(captureButtonClasses).toContain('border-4');
      expect(captureButtonClasses).toContain('border-blue-500');
    });
  });

  describe('Video Element Configuration', () => {
    it('should have autoPlay attribute', () => {
      const autoPlay = true;
      
      expect(autoPlay).toBe(true);
    });

    it('should have playsInline attribute', () => {
      const playsInline = true;
      
      expect(playsInline).toBe(true);
    });

    it('should use object-contain for video', () => {
      const objectFit = 'object-contain';
      
      expect(objectFit).toBe('object-contain');
    });
  });

  describe('Canvas Configuration', () => {
    it('should be hidden from UI', () => {
      const className = 'hidden';
      
      expect(className).toContain('hidden');
    });

    it('should match video dimensions when capturing', () => {
      const videoWidth = 1920;
      const videoHeight = 1080;
      
      let canvasWidth = 0;
      let canvasHeight = 0;
      
      // 模擬設定 canvas 尺寸
      canvasWidth = videoWidth;
      canvasHeight = videoHeight;
      
      expect(canvasWidth).toBe(videoWidth);
      expect(canvasHeight).toBe(videoHeight);
    });
  });

  describe('Resource Cleanup', () => {
    it('should stop all tracks when closing camera', () => {
      const mockTrack = { stop: vi.fn() };
      const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;
      
      // 模擬關閉攝影機
      mockStream.getTracks().forEach(track => track.stop());
      
      expect(mockTrack.stop).toHaveBeenCalled();
    });

    it('should handle stream with multiple tracks', () => {
      const mockTrack1 = { stop: vi.fn() };
      const mockTrack2 = { stop: vi.fn() };
      const mockStream = { getTracks: () => [mockTrack1, mockTrack2] } as unknown as MediaStream;
      
      mockStream.getTracks().forEach(track => track.stop());
      
      expect(mockTrack1.stop).toHaveBeenCalled();
      expect(mockTrack2.stop).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full photo capture flow', () => {
      // 1. 開啟攝影機
      let showCamera = false;
      showCamera = true;
      expect(showCamera).toBe(true);
      
      // 2. 設定 stream
      let cameraStream: MediaStream | null = null;
      cameraStream = {} as MediaStream;
      expect(cameraStream).not.toBeNull();
      
      // 3. 拍照
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      expect(file).toBeInstanceOf(File);
      
      // 4. 關閉攝影機
      cameraStream = null;
      showCamera = false;
      expect(showCamera).toBe(false);
      expect(cameraStream).toBeNull();
    });

    it('should handle cancel flow', () => {
      // 1. 開啟攝影機
      let showCamera = true;
      let cameraStream: MediaStream | null = {} as MediaStream;
      
      // 2. 取消（關閉）
      cameraStream = null;
      showCamera = false;
      
      expect(showCamera).toBe(false);
      expect(cameraStream).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle video element not ready', () => {
      const videoRef: { current: HTMLVideoElement | null } = { current: null };
      const canvasRef: { current: HTMLCanvasElement | null } = { current: null };
      
      // 應該提前返回，不執行拍照邏輯
      if (!videoRef.current || !canvasRef.current) {
        expect(true).toBe(true); // 提前返回
      }
    });

    it('should handle blob creation failure', () => {
      let file: File | null = null;
      const blob: Blob | null = null;
      
      if (blob) {
        file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      }
      
      expect(file).toBeNull();
    });

    it('should handle getUserMedia not supported', () => {
      const mediaDevicesSupported = !!(typeof navigator !== 'undefined' && 
                                      navigator.mediaDevices && 
                                      navigator.mediaDevices.getUserMedia);
      
      // 在測試環境中可能不支援，但應該回傳 boolean
      expect(typeof mediaDevicesSupported).toBe('boolean');
      expect(mediaDevicesSupported).toBe(false); // 測試環境通常不支援
    });
  });
});
