import { extractJobDescriptionFromDOM, createJobExtractionButton } from "@/utils/jobExtractor";
import { saveToStorage, getFromStorage } from "@/utils/storage";

let injectedButton = false;

function injectButton() {
  if (injectedButton) return;

  const button = createJobExtractionButton();
  document.body.appendChild(button);
  injectedButton = true;

  button.addEventListener("click", async () => {
    const jobData = extractJobDescriptionFromDOM();
    if (!jobData) {
      alert("Could not extract job description. Please make sure you're on a job posting page.");
      return;
    }

    // Save to extension storage
    await saveToStorage("currentJobData", jobData);

    // Open extension popup
    chrome.runtime.sendMessage(
      { action: "openPopup", jobData },
      (response) => {
        if (response?.success) {
          alert("Opening ResumeMatch Pro...");
        }
      }
    );
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getJobData") {
    const jobData = extractJobDescriptionFromDOM();
    sendResponse({ jobData });
  } else if (request.action === "downloadResume") {
    const link = document.createElement("a");
    link.href = request.blobUrl;
    link.download = request.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sendResponse({ success: true });
  }
});
