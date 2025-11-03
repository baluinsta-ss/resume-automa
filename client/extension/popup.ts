import { getMasterResume, getFromStorage } from "@/utils/storage";
import { tailorResumeForJob, calculateATSScore, extractJobRequirements } from "@/services/gemini";
import { saveApplication } from "@/services/mongodb";
import { downloadResume } from "@/services/resumeGenerator";
import { ResumeData, JobDescription, ApplicationRecord } from "@/types";

interface PopupState {
  masterResume: ResumeData | null;
  jobData: JobDescription | null;
  tailoredResume: ResumeData | null;
  atsScore: number;
}

let state: PopupState = {
  masterResume: null,
  jobData: null,
  tailoredResume: null,
  atsScore: 0,
};

const statusEl = document.getElementById("status")!;
const jobInfoEl = document.getElementById("job-info")!;
const loadingEl = document.getElementById("loading")!;
const errorEl = document.getElementById("error")!;
const successEl = document.getElementById("success")!;
const buttonsEl = document.getElementById("buttons")!;
const mainContentEl = document.getElementById("main-content")!;

const tailorBtn = document.getElementById("tailor-btn") as HTMLButtonElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const dashboardLink = document.getElementById("dashboard-link") as HTMLAnchorElement;

// Initialize
async function init() {
  try {
    // Get master resume from storage
    state.masterResume = await getMasterResume();

    // Get job data from current tab
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (currentTab[0].id) {
      chrome.tabs.sendMessage(
        currentTab[0].id,
        { action: "getJobData" },
        (response) => {
          if (response?.jobData) {
            state.jobData = response.jobData;
          }
          updateUI();
        }
      );
    }

    if (!state.masterResume) {
      updateUI();
      return;
    }

    updateUI();
  } catch (error) {
    console.error("Initialization error:", error);
    updateUI();
  }
}

function updateUI() {
  // Hide everything first
  statusEl.classList.add("hidden");
  jobInfoEl.classList.add("hidden");
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");
  buttonsEl.classList.add("hidden");

  if (!state.masterResume) {
    // Show error if no master resume
    statusEl.classList.remove("hidden");
    const statusIcon = statusEl.querySelector(".status-icon")!;
    const statusText = statusEl.querySelector(".status-text")!;
    statusIcon.textContent = "⚠️";
    statusText.innerHTML =
      '<strong>No Master Resume</strong><span>Upload your resume on the dashboard first</span>';

    dashboardLink.onclick = (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url: chrome.runtime.getURL("../index.html"),
      });
    };
    return;
  }

  // Show job info if available
  if (state.jobData) {
    jobInfoEl.classList.remove("hidden");
    (document.getElementById("job-title")!).textContent = state.jobData.title;
    (document.getElementById("job-company")!).textContent = state.jobData.company;

    // Show buttons
    buttonsEl.classList.remove("hidden");
    statusEl.classList.remove("hidden");
    const statusIcon = statusEl.querySelector(".status-icon")!;
    const statusText = statusEl.querySelector(".status-text")!;
    statusIcon.textContent = "✓";
    statusText.innerHTML =
      '<strong>Ready to Tailor</strong><span>Click below to optimize your resume for this job</span>';
  } else {
    // Show status for non-job pages
    statusEl.classList.remove("hidden");
    const statusIcon = statusEl.querySelector(".status-icon")!;
    const statusText = statusEl.querySelector(".status-text")!;
    statusIcon.textContent = "ℹ️";
    statusText.innerHTML =
      '<strong>No Job Posting Found</strong><span>Open this extension on a job posting page</span>';
  }
}

tailorBtn.addEventListener("click", async () => {
  if (!state.masterResume || !state.jobData) return;

  loadingEl.classList.remove("hidden");
  tailorBtn.disabled = true;

  try {
    // Extract job requirements
    const jobDescription = await extractJobRequirements(state.jobData.description);

    // Tailor resume
    state.tailoredResume = await tailorResumeForJob(state.masterResume, jobDescription);

    // Calculate ATS score
    const atsScoreData = await calculateATSScore(state.tailoredResume, jobDescription);
    state.atsScore = atsScoreData.score;

    loadingEl.classList.add("hidden");
    successEl.classList.remove("hidden");
    successEl.textContent = `✓ Resume tailored! ATS Score: ${state.atsScore}%`;
    downloadBtn.disabled = false;
    saveBtn.disabled = false;
    tailorBtn.textContent = "⚡ Tailor Again";
    tailorBtn.disabled = false;
  } catch (error) {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
    errorEl.textContent = `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    tailorBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!state.tailoredResume || !state.jobData) return;

  downloadBtn.disabled = true;

  try {
    await downloadResume(state.tailoredResume, state.jobData.company, state.jobData.title);
    successEl.classList.remove("hidden");
    successEl.textContent = "✓ Resume downloaded!";
    successEl.classList.add("success");
    downloadBtn.disabled = false;
  } catch (error) {
    errorEl.classList.remove("hidden");
    errorEl.textContent = `✗ Download failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    downloadBtn.disabled = false;
  }
});

saveBtn.addEventListener("click", async () => {
  if (!state.tailoredResume || !state.jobData) return;

  saveBtn.disabled = true;

  try {
    const application: ApplicationRecord = {
      userId: "current-user",
      jobTitle: state.jobData.title,
      company: state.jobData.company,
      jobUrl: state.jobData.url,
      jobDescription: state.jobData,
      originalResume: state.masterResume!,
      tailoredResume: state.tailoredResume,
      atsScore: state.atsScore,
      matchPercentage: state.atsScore,
      appliedDate: new Date(),
      status: "applied",
    };

    await saveApplication(application);
    successEl.classList.remove("hidden");
    successEl.textContent = "✓ Application saved!";
    successEl.classList.add("success");
    saveBtn.disabled = false;
  } catch (error) {
    errorEl.classList.remove("hidden");
    errorEl.textContent = `✗ Save failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    saveBtn.disabled = false;
  }
});

// Start initialization
init();
