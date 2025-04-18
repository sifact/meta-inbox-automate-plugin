// Function to update toggle button state and count
function updateToggleButton(enabled, count = 0) {
  const button = document.getElementById("toggle-scan");
  button.textContent = enabled ? `Stop Scanning (${count} unread replies)` : "Start Scanning";
  button.style.background = enabled ? "#DC3545" : "#0866FF";
}

// Function to send message to content script
async function queryContentScript(action) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      throw new Error("No active tab found");
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabs[0].id, { action }, (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("Could not establish connection")) {
            reject(new Error("Please refresh the Meta Suite Inbox page"));
          } else {
            reject(chrome.runtime.lastError);
          }
          return;
        }
        resolve(response);
      });
    });
  } catch (error) {
    throw error;
  }
}

// Function to get current count
async function getCurrentCount() {
  try {
    const response = await queryContentScript("getCount");
    return response.count || 0;
  } catch (error) {
    console.error("Error getting count:", error);
    return 0;
  }
}

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load current state
    const { scanEnabled } = await new Promise((resolve) => chrome.storage.local.get("scanEnabled", resolve));

    // Get current count
    const count = await getCurrentCount();
    updateToggleButton(scanEnabled, count);

    // Handle toggle button click
    document.getElementById("toggle-scan").addEventListener("click", async () => {
      try {
        // Toggle state
        const newState = !scanEnabled;

        // Update storage
        await new Promise((resolve) => chrome.storage.local.set({ scanEnabled: newState }, resolve));

        // Notify content script
        await queryContentScript(newState ? "startScan" : "stopScan");

        // Update button immediately
        updateToggleButton(newState, await getCurrentCount());
      } catch (error) {
        console.error("Error:", error);

        // Show error to user
        const button = document.getElementById("toggle-scan");
        const errorMessage = error.message || "Error occurred";
        button.textContent = errorMessage;
        button.style.background = "#DC3545";

        // Revert after 3 seconds
        setTimeout(async () => {
          const { scanEnabled } = await new Promise((resolve) => chrome.storage.local.get("scanEnabled", resolve));
          const count = await getCurrentCount();
          updateToggleButton(scanEnabled, count);
        }, 3000);
      }
    });
  } catch (error) {
    console.error("Popup initialization error:", error);
  }
});
