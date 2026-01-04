// Image Preview Modal component - Full-screen image viewer
import React from 'react';

interface ImagePreviewModalProps {
  previewImage: string | null;
  onClose: () => void;
}

export const ImagePreviewModal = ({ previewImage, onClose }: ImagePreviewModalProps) => {
  if (!previewImage) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full w-full flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors z-10 shadow-lg"
          title="關閉"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img 
          src={previewImage} 
          alt="Preview" 
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="text-center mt-4 text-white text-sm sm:text-base">
          點擊周圍或關閉按鈕退出預覽
        </div>
      </div>
    </div>
  );
};
