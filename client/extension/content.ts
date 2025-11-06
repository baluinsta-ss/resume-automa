import {
  extractJobDescriptionFromDOM,
  createJobExtractionButton,
} from "@/utils/jobExtractor";
import { saveToStorage } from "@/utils/storage";

let injectedButton = false;

function injectButton() {
  if (injectedButton) return;

  const button = createJobExtractionButton();
  document.body.appendChild(button);
  injectedButton = true;

  button.addEventListener("click", async () => {
    const jobData = extractJobDescriptionFromDOM();
    if (!jobData) {
      alert(
        "Could not extract job description. Please make sure you're on a job posting page.",
      );
      return;
    }

    // Save job data to extension storage for the popup to access
    try {
      await saveToStorage("currentJobData", jobData);
      // Open the popup
      chrome.runtime.sendMessage({ action: "openPopup" }).catch(() => {
        // Popup may already be open
      });
    } catch (error) {
      console.error("Error saving job data:", error);
      alert("Failed to extract job data. Please try again.");
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
  } else if (request.action === "injectButton") {
    injectButton();
    sendResponse({ success: true });
  }
});
