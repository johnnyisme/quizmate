// Utility functions for file and image handling

// Convert File to pure base64 (without data: prefix)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      if (commaIndex !== -1) {
        resolve(result.slice(commaIndex + 1));
      } else {
        resolve(result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Detect if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Generate session title from first user message
export const generateTitle = (text: string): string => {
  const cleaned = text.replace(/[*$\n]/g, " ").trim();
  return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
};

// Truncate prompt name based on language (Chinese vs English)
export const truncatePromptName = (name: string): string => {
  const hasChinese = /[\u4E00-\u9FFF]/.test(name);
  const maxLength = hasChinese ? 4 : 12;
  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
};

// Compress image file before upload
export const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new File object with compressed blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
