// Custom hook for managing image state
import { useState, useCallback } from 'react';

type ImageState = {
  image: File | null;
  imageUrl: string;
  cameraStream: MediaStream | null;
};

export const useImageState = () => {
  const [imageState, setImageState] = useState<ImageState>({
    image: null,
    imageUrl: "",
    cameraStream: null,
  });

  const updateImageState = useCallback((updates: Partial<ImageState>) => {
    setImageState(prev => ({ ...prev, ...updates }));
  }, []);

  const setImage = useCallback((img: File | null) => updateImageState({ image: img }), [updateImageState]);
  const setImageUrl = useCallback((url: string) => updateImageState({ imageUrl: url }), [updateImageState]);
  const setCameraStream = useCallback((stream: MediaStream | null) => updateImageState({ cameraStream: stream }), [updateImageState]);

  return {
    ...imageState,
    updateImageState,
    setImage,
    setImageUrl,
    setCameraStream,
  };
};
