import {
  extractJobDescriptionFromDOM,
  createJobExtractionButton,
} from "@/utils/jobExtractor";
import { saveToStorage } from "@/utils/storage";

let injectedButton = false;

// Monitor for resume uploads on localhost:8080 and sync to chrome.storage
function syncResumeToExtension() {
  try {
    const resumeKey = "resumematch_master_resume";
    const resumeData = localStorage.getItem(resumeKey);

    console.log("[Content Script] Checking for resume...");
    console.log("[Content Script] Resume exists:", !!resumeData);

    if (resumeData && chrome.storage && chrome.storage.sync) {
      console.log("[Content Script] Syncing resume to chrome.storage.sync...");
      chrome.storage.sync.set({ [resumeKey]: resumeData }, () => {
        if (!chrome.runtime.lastError) {
          console.log("[Content Script] ✓ Resume synced to chrome.storage.sync");
        } else {
          console.error("[Content Script] Failed to sync resume:", chrome.runtime.lastError);
        }
      });
    } else {
      if (!resumeData) {
        console.warn("[Content Script] No resume found in localStorage");
      }
      if (!chrome.storage || !chrome.storage.sync) {
        console.error("[Content Script] chrome.storage.sync not available");
      }
    }
  } catch (e) {
    console.error("[Content Script] Error syncing resume:", e);
  }
}

// Listen for storage changes in the web app
window.addEventListener("storage", (event) => {
  if (event.key === "resumematch_master_resume") {
    console.log("Resume updated in localStorage, syncing to extension...");
    syncResumeToExtension();
  }
});

// Also sync on page load
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  syncResumeToExtension();
}

function getPageHTML(): string {
  return document.documentElement.outerHTML;
}

function getPageText(): string {
  return document.body.innerText;
}

function injectButton() {
  if (injectedButton) return;

  const button = createJobExtractionButton();
  document.body.appendChild(button);
  injectedButton = true;

  button.addEventListener("click", async () => {
    button.textContent = "⏳ Analyzing...";
    button.disabled = true;

    // Capture the full HTML page
    const pageHTML = getPageHTML();
    const pageText = getPageText();
    const pageURL = window.location.href;

    // Also try to extract basic info from DOM as fallback
    const basicJobData = extractJobDescriptionFromDOM();

    // Save page content to storage for the popup to access
    try {
      // Use chrome.storage.sync directly to ensure data persists across extension contexts
      const dataToStore = {
        currentPageHTML: pageHTML,
        currentPageText: pageText,
        currentPageURL: pageURL,
        currentPageAnalyzedAt: new Date().toISOString(),
      };

      if (basicJobData) {
        dataToStore["currentJobData"] = basicJobData;
      }

      // Store in chrome.storage.sync for extension context
      await new Promise<void>((resolve, reject) => {
        if (chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.set(dataToStore, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        } else {
          reject(new Error("Chrome storage not available"));
        }
      });

      console.log("Page data saved to chrome.storage.sync");
      console.log("Page HTML length:", pageHTML.length);
      console.log("Page text length:", pageText.length);
      console.log("Basic job data extracted:", basicJobData);

      // Show success feedback
      button.textContent = "✓ Analyzed! Opening...";
      button.style.background =
        "linear-gradient(135deg, #10b981 0%, #059669 100%)";

      // Open the popup
      chrome.runtime.sendMessage({ action: "openPopup" }).catch((err) => {
        console.log("Popup message sent:", err?.message || "success");
      });

      // Reset button after a delay
      setTimeout(() => {
        button.textContent = "Analyse";
        button.disabled = false;
        button.style.background =
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      }, 2000);
    } catch (error) {
      console.error("Error saving page data:", error);
      alert(
        `Failed to analyze page: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      button.textContent = "Analyse";
      button.disabled = false;
    }
  });
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectButton);
} else {
  injectButton();
}

// Also inject on dynamically loaded content
const observer = new MutationObserver(() => {
  if (!injectedButton) {
    injectButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
});

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getJobData") {
    const jobData = extractJobDescriptionFromDOM();
    sendResponse({ jobData: jobData || null });
  } else if (request.action === "getPageHTML") {
    const pageHTML = getPageHTML();
    sendResponse({ html: pageHTML });
  } else if (request.action === "getPageText") {
    const pageText = getPageText();
    sendResponse({ text: pageText });
  } else if (request.action === "injectButton") {
    injectButton();
    sendResponse({ success: true });
  } else if (request.action === "checkSync") {
    console.log("[Content Script] checkSync message received");
    sendResponse({ status: "Content script is active" });
  } else if (request.action === "syncResume") {
    console.log("[Content Script] Manual sync requested");
    syncResumeToExtension();
    sendResponse({ status: "Sync triggered" });
  }
});
