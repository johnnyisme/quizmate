// Error handling utilities
export const getFriendlyErrorMessage = (error: any): { message: string; suggestion: string } => {
  const errorStr = error?.message || JSON.stringify(error) || '';
  
  // 429 - 配額用完
  if (errorStr.includes("429") || errorStr.toLowerCase().includes("quota") || errorStr.toLowerCase().includes("resource_exhausted")) {
    return {
      message: "API 配額已用完",
      suggestion: "免費額度已經用完。建議：\n1. 嘗試換不同的 Gemini agent\n2. 用不同 Google 帳號申請新的 API Key 並加入輪替\n3. 等待配額重置（通常每天重置)\n4. 升級到付費方案以獲得更高配額"
    };
  }
  
  // 403 - 權限問題
  if (errorStr.includes("403") || errorStr.toLowerCase().includes("permission_denied")) {
    return {
      message: "API 權限不足",
      suggestion: "可能原因：\n1. API Key 沒有存取權限\n2. 需要在 Google Cloud Console 啟用 'Generative Language API'\n3. API Key 可能有 IP 或 HTTP referrer 限制\n\n請到 Google Cloud Console 檢查設定"
    };
  }
  
  // 401 - 認證失敗
  if (errorStr.includes("401") || errorStr.toLowerCase().includes("unauthorized") || errorStr.toLowerCase().includes("invalid_api_key")) {
    return {
      message: "API Key 無效",
      suggestion: "請檢查：\n1. API Key 是否正確複製（沒有多餘空格）\n2. API Key 是否已過期或被刪除\n3. 到 Google AI Studio 重新生成新的 API Key"
    };
  }
  
  // 400 - 請求錯誤
  if (errorStr.includes("400") || errorStr.toLowerCase().includes("invalid_argument")) {
    return {
      message: "請求格式錯誤",
      suggestion: "可能原因：\n1. 圖片格式不支援（請使用 JPG、PNG、GIF、WebP）\n2. 圖片太大（建議小於 4MB）\n3. 問題內容包含不支援的字元\n\n請嘗試重新上傳圖片或修改問題"
    };
  }
  
  // 503 - 服務暫時無法使用
  if (errorStr.includes("503") || errorStr.toLowerCase().includes("unavailable")) {
    return {
      message: "服務暫時無法使用",
      suggestion: "Google AI 服務目前負載過高或維護中。\n請稍後再試，通常幾分鐘內就會恢復"
    };
  }
  
  // 500 - 伺服器錯誤
  if (errorStr.includes("500") || errorStr.toLowerCase().includes("internal")) {
    return {
      message: "伺服器發生錯誤",
      suggestion: "Google AI 服務發生內部錯誤。\n這通常是暫時性問題，請稍後再試"
    };
  }
  
  // Network errors
  if (errorStr.toLowerCase().includes("network") || errorStr.toLowerCase().includes("fetch")) {
    return {
      message: "網路連線問題",
      suggestion: "請檢查：\n1. 網路連線是否正常\n2. 是否有防火牆或代理伺服器阻擋\n3. 嘗試重新整理頁面"
    };
  }
  
  // 模型不支援
  if (errorStr.toLowerCase().includes("model") && errorStr.toLowerCase().includes("not found")) {
    return {
      message: "模型不可用",
      suggestion: "選擇的 AI 模型可能：\n1. 尚未開放使用\n2. 需要付費方案\n3. 已被停用\n\n建議切換到其他模型（如 Gemini 2.5 Flash）"
    };
  }
  
  // 預設錯誤訊息
  return {
    message: "發生未預期的錯誤",
    suggestion: "請嘗試：\n1. 重新整理頁面\n2. 清除瀏覽器快取\n3. 檢查 API Key 是否正確\n4. 點擊下方箭頭查看詳細錯誤訊息\n\n如問題持續，請回報給開發者"
  };
};
