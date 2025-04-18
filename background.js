// Keep track of scanning state
let isScanning = false;
let unreadRepliedCount = 0;

// Listen for scan state changes without sending responses
chrome.runtime.onMessage.addListener((message) => {
  try {
    if (message.type === "SCAN_STATE_CHANGE") {
      isScanning = message.scanning;
      unreadRepliedCount = message.count || 0;

      // Update badge text based on state
      chrome.action.setBadgeText({
        text: isScanning ? String(unreadRepliedCount || "0") : "OFF",
      });

      // Update badge color based on state
      chrome.action.setBadgeBackgroundColor({
        color: isScanning ? "#0866FF" : "#DC3545",
      });

      // Log updates for debugging
      console.log("Scanner state:", isScanning ? "ON" : "OFF");
      console.log("Unread replied count:", unreadRepliedCount);
    }
  } catch (error) {
    console.error("Error handling badge update:", error);
  }
});

// Initialize badge
chrome.action.setBadgeText({
  text: "OFF",
});

chrome.action.setBadgeBackgroundColor({
  color: "#DC3545",
});

// When extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Reset state
  chrome.storage.local.set({
    scanEnabled: false,
  });
});
