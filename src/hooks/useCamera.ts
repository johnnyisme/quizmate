// Custom hook for camera functionality
import { useCallback, RefObject, ChangeEvent } from 'react';

type CameraHookProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  showCamera: boolean;
  setShowCamera: (show: boolean) => void;
  cameraStream: MediaStream | null;
  setCameraStream: (stream: MediaStream | null) => void;
  setImage: (img: File | null) => void;
  setImageUrl: (url: string) => void;
  setDisplayConversation: (conv: any) => void;
  setApiHistory: (hist: any) => void;
  setCurrentSessionId: (id: string | null) => void;
  setError: (err: any) => void;
};

export const useCamera = ({
  videoRef,
  canvasRef,
  cameraInputRef,
  showCamera,
  setShowCamera,
  cameraStream,
  setCameraStream,
  setImage,
  setImageUrl,
  setDisplayConversation,
  setApiHistory,
  setCurrentSessionId,
  setError,
}: CameraHookProps) => {
  // Detect if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Handle image file selection
  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check image size limit (10MB)
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_IMAGE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setError({
          message: "圖片檔案太大",
          suggestion: `目前圖片大小：${fileSizeMB} MB\n\n建議：\n1. 壓縮圖片後再上傳（建議 < 10MB）\n2. 使用線上工具壓縮：TinyPNG、Squoosh 等\n3. 調整圖片解析度（手機可選擇「中」或「低」畫質拍照）\n4. 截圖時選擇較小的區域\n\n💡 10MB 限制是為了保護瀏覽器儲存空間，避免影響效能。`
        });
        // Clear input to allow re-selecting same file
        e.target.value = '';
        return;
      }
      
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      setError(null);
      // Clear input to allow re-selecting same file
      e.target.value = '';
    }
  }, [setImage, setImageUrl, setError]);

  // Open camera (desktop only)
  const handleOpenCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Failed to access camera:', err);
      setError({ 
        message: "無法存取攝影機",
        suggestion: "請確認：\n1. 瀏覽器有攝影機權限\n2. 沒有其他應用程式正在使用攝影機\n3. 使用 HTTPS 連線（本地開發可用 localhost）"
      });
    }
  }, [setCameraStream, setShowCamera, videoRef, setError]);

  // Handle camera button click
  const handleCameraClick = useCallback(() => {
    if (isMobile()) {
      // Mobile: use native file picker (will provide camera option)
      cameraInputRef.current?.click();
    } else {
      // Desktop: open web camera
      handleOpenCamera();
    }
  }, [handleOpenCamera, cameraInputRef]);

  // Close camera
  const handleCloseCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream, setCameraStream, setShowCamera]);

  // Take photo
  const handleTakePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create File object
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImage(file);
          setImageUrl(URL.createObjectURL(file));
          
          // Reset conversation
          setDisplayConversation([]);
          setApiHistory([]);
          setCurrentSessionId(null);
          setError(null);
          
          // Close camera
          handleCloseCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  }, [videoRef, canvasRef, setImage, setImageUrl, setDisplayConversation, setApiHistory, setCurrentSessionId, setError, handleCloseCamera]);

  return {
    isMobile,
    handleCameraClick,
    handleOpenCamera,
    handleCloseCamera,
    handleTakePhoto,
    handleImageChange,
  };
};
