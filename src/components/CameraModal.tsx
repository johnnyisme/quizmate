// Camera Modal component - Desktop camera capture interface
import React from 'react';

interface CameraModalProps {
  showCamera: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onClose: () => void;
  onTakePhoto: () => void;
}

export const CameraModal = ({
  showCamera,
  videoRef,
  canvasRef,
  onClose,
  onTakePhoto,
}: CameraModalProps) => {
  if (!showCamera) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors shadow-lg"
        >
          取消
        </button>
        <button
          onClick={onTakePhoto}
          className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-all shadow-lg border-4 border-blue-500"
          title="拍照"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-full"></div>
        </button>
      </div>
    </div>
  );
};
