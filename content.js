// Check if script is already injected
if (typeof window.metaSuiteInboxScannerInjected === "undefined") {
  window.metaSuiteInboxScannerInjected = true;

  let scanInterval;
  let isScanning = false;
  let lastOpenedChat = null;
  let unreadRepliedCount = 0;

  // Simple function to attempt clicking
  async function attemptClick(element) {
    try {
      element.click();
      // console.log("Clicked element");
      await new Promise((r) => setTimeout(r, 500));
      return true;
    } catch (error) {
      console.error("Click failed:", error);
      return false;
    }
  }

  // Function to scan for messages
  async function scanRespondedMessages() {
    try {
      // Reset count
      unreadRepliedCount = 0;

      // Find all conversation containers
      const conversations = document.querySelectorAll("div._4k8w");
      console.log("Total conversations:", conversations.length);

      for (const conv of conversations) {
        try {
          // Get username element
          const usernameElement = conv.querySelector(".xmi5d70");
          if (!usernameElement) continue;

          // Check username classes
          const isUnread = usernameElement.classList.contains("x117nqv4");
          const isRead = usernameElement.classList.contains("x1fcty0u");

          const name = usernameElement.textContent.trim();
          // console.log(`Checking conversation "${name}":`, {
          //   isUnread,
          //   isRead,
          // });

          // Skip if not unread or is marked as read
          if (!isUnread || isRead) {
            // console.log("Skipping: Not an unread conversation");
            continue;
          }

          // Get message
          const messageDiv = conv.querySelector("div._4k8y ._4ik4._4ik5");
          if (!messageDiv) continue;

          const messageText = messageDiv.textContent.trim();

          // Check if it's a page response
          if (!messageText.startsWith("You:")) {
            // console.log("Skipping: Not a page response");
            continue;
          }

          console.log("Found target conversation:", {
            name,
            message: messageText,
          });
          unreadRepliedCount++;

          // Find clickable element
          const clickableElement = conv.querySelector("div._a6ag._a6ah");
          if (!clickableElement) {
            // console.log("No clickable element found");
            continue;
          }

          const clicked = await attemptClick(clickableElement);
          if (clicked) {
            // console.log("Successfully opened conversation");
            lastOpenedChat = name;
            break;
          }
        } catch (error) {
          console.error("Error processing conversation:", error);
        }
      }

      // Update badge
      chrome.runtime.sendMessage({
        type: "SCAN_STATE_CHANGE",
        scanning: isScanning,
        count: unreadRepliedCount,
      });
    } catch (error) {
      console.error("Scan error:", error);
    }
  }

  // Function to start scanning
  function startScanning() {
    if (!isScanning) {
      isScanning = true;
      lastOpenedChat = null;
      // console.log("Starting scanner...");
      scanRespondedMessages();
      scanInterval = setInterval(scanRespondedMessages, 10000);
    }
  }

  // Function to stop scanning
  function stopScanning() {
    if (isScanning) {
      clearInterval(scanInterval);
      isScanning = false;
      lastOpenedChat = null;
      unreadRepliedCount = 0;
      // console.log("Stopped scanning");

      chrome.runtime.sendMessage({
        type: "SCAN_STATE_CHANGE",
        scanning: false,
        count: 0,
      });
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.action === "startScan") {
        startScanning();
        sendResponse({ status: "started" });
      } else if (request.action === "stopScan") {
        stopScanning();
        sendResponse({ status: "stopped" });
      } else if (request.action === "getCount") {
        sendResponse({ count: unreadRepliedCount });
      }
    } catch (error) {
      console.error("Message error:", error);
      sendResponse({ status: "error", error: error.message });
    }
    return true;
  });

  // Clean up on unload
  window.addEventListener("unload", () => {
    stopScanning();
  });

  // Initialize state
  chrome.storage.local.get("scanEnabled", (data) => {
    if (data.scanEnabled) {
      startScanning();
    }
  });
}
