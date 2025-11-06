import { User, ResumeData, ApplicationRecord } from "@/types";
import {
  saveToStorage,
  getFromStorage,
  setMasterResume,
  getMasterResume,
} from "@/utils/storage";

const STORAGE_KEYS = {
  USER_DATA: "resumematch_user_data",
  APPLICATIONS: "resumematch_applications",
};

export async function saveUser(userData: User): Promise<User> {
  try {
    await saveToStorage(STORAGE_KEYS.USER_DATA, userData);
    return userData;
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}

export async function getUser(): Promise<User | null> {
  try {
    return await getFromStorage(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getUserResume(): Promise<ResumeData | null> {
  try {
    return await getMasterResume();
  } catch (error) {
    console.error("Error fetching resume:", error);
    return null;
  }
}

export async function saveResume(
  resume: ResumeData,
): Promise<ResumeData> {
  try {
    await setMasterResume(resume);
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw error;
  }
}

export async function saveApplication(
  application: ApplicationRecord,
): Promise<ApplicationRecord> {
  try {
    const applications = await getApplicationHistory();
    const newApplication: ApplicationRecord = {
      ...application,
      id: `app_${Date.now()}`,
    };
    applications.push(newApplication);
    await saveToStorage(STORAGE_KEYS.APPLICATIONS, applications);
    return newApplication;
  } catch (error) {
    console.error("Error saving application:", error);
    throw error;
  }
}

export async function getApplicationHistory(): Promise<ApplicationRecord[]> {
  try {
    const history = await getFromStorage(STORAGE_KEYS.APPLICATIONS);
    return history || [];
  } catch (error) {
    console.error("Error fetching application history:", error);
    return [];
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationRecord["status"],
): Promise<ApplicationRecord> {
  try {
    const applications = await getApplicationHistory();
    const applicationIndex = applications.findIndex(
      (app) => app.id === applicationId,
    );
    if (applicationIndex === -1) {
      throw new Error("Application not found");
    }
    applications[applicationIndex].status = status;
    applications[applicationIndex].updatedAt = new Date();
    await saveToStorage(STORAGE_KEYS.APPLICATIONS, applications);
    return applications[applicationIndex];
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
}
