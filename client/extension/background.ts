import { getFromStorage, saveToStorage } from "@/utils/storage";
import { generateResumeDocx, downloadResume } from "@/services/resumeGenerator";
import { tailorResumeForJob, calculateATSScore, extractJobRequirements } from "@/services/gemini";
import { ApplicationRecord, ResumeData } from "@/types";
import { saveApplication } from "@/services/mongodb";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "tailorResume") {
    handleTailoreResume(request.masterResume, request.jobData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === "generateAndDownload") {
    handleGenerateAndDownload(request.tailoredResume, request.company, request.jobTitle)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleTailoreResume(masterResume: ResumeData, jobData: any) {
  try {
    // Extract requirements from job description
    const jobDescription = await extractJobRequirements(jobData.description);

    // Tailor resume
    const tailoredResume = await tailorResumeForJob(masterResume, jobDescription);

    // Calculate ATS score
    const atsScore = await calculateATSScore(tailoredResume, jobDescription);

    return {
      success: true,
      tailoredResume,
      atsScore,
      jobDescription,
    };
  } catch (error) {
    console.error("Error tailoring resume:", error);
    throw error;
  }
}

async function handleGenerateAndDownload(
  tailoredResume: ResumeData,
  company: string,
  jobTitle: string
) {
  try {
    const blob = await generateResumeDocx(tailoredResume, company, jobTitle);
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split("T")[0];
    const filename = `Resume_${company}_${jobTitle}_${today}.docx`;

    // Use Chrome downloads API
    chrome.downloads.download({
      url,
      filename,
      saveAs: false,
    });

    return {
      success: true,
      message: "Resume downloaded successfully",
    };
  } catch (error) {
    console.error("Error generating/downloading resume:", error);
    throw error;
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    // Check if tab is a job posting site
    const jobSites = [
      "linkedin.com",
      "indeed.com",
      "naukri.com",
      "monster.com",
      "glassdoor.com",
    ];

    const isJobSite = jobSites.some(site => tab.url?.includes(site));

    if (isJobSite) {
      // Inject content script
      chrome.tabs.sendMessage(tabId, { action: "injectButton" }).catch(() => {
        // Content script not ready yet, it will inject itself
      });

      // Update extension badge
      chrome.action.setBadgeText({ text: "✓", tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#6633ff", tabId });
    }
  }
});
