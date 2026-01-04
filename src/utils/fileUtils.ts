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
