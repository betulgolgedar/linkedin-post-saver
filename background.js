// =============================================
// LinkedIn Post Saver - background.js
// Service Worker - arka plan işlemleri
// =============================================

// Extension ilk kurulduğunda çalışır
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    console.log("[LPS] Extension kuruldu!");
    // Varsayılan storage yapısını oluştur
    chrome.storage.local.set({
      posts: [],
      settings: {
        plan: "free",     // "free" | "premium"
        freeLimit: 20,
        installedAt: new Date().toISOString(),
      },
    });
  }
});

// Popup'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_POST_COUNT") {
    chrome.storage.local.get(["posts"], (result) => {
      sendResponse({ count: (result.posts || []).length });
    });
    return true; // async response için
  }

  if (message.type === "DELETE_POST") {
    chrome.storage.local.get(["posts"], (result) => {
      const posts = (result.posts || []).filter((p) => p.id !== message.id);
      chrome.storage.local.set({ posts }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === "UPDATE_TAGS") {
    chrome.storage.local.get(["posts"], (result) => {
      const posts = (result.posts || []).map((p) =>
        p.id === message.id ? { ...p, tags: message.tags } : p
      );
      chrome.storage.local.set({ posts }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
