import { ResumeData, User } from "@/types";

const STORAGE_KEYS = {
  USER_ID: "resumematch_user_id",
  MASTER_RESUME: "resumematch_master_resume",
  AUTH_TOKEN: "resumematch_auth_token",
  GEMINI_API_KEY: "resumematch_gemini_key",
  LAST_SYNC: "resumematch_last_sync",
};

export async function saveToStorage(key: string, value: any): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [key]: JSON.stringify(value) }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } else {
    // Fallback to localStorage in web app
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export async function getFromStorage(key: string): Promise<any> {
  if (typeof chrome !== "undefined" && chrome.storage) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const value = result[key];
          resolve(value ? JSON.parse(value) : null);
        }
      });
    });
  } else {
    // Fallback to localStorage in web app
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } else {
    // Fallback to localStorage in web app
    localStorage.removeItem(key);
  }
}

export async function getUserId(): Promise<string | null> {
  return getFromStorage(STORAGE_KEYS.USER_ID);
}

export async function setUserId(userId: string): Promise<void> {
  return saveToStorage(STORAGE_KEYS.USER_ID, userId);
}

export async function getMasterResume(): Promise<ResumeData | null> {
  // Try to get from chrome.storage.sync first (extension context, works across extension pages)
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    try {
      const result = await new Promise<ResumeData | null>((resolve, reject) => {
        chrome.storage.sync.get([STORAGE_KEYS.MASTER_RESUME], (syncResult) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            const value = syncResult[STORAGE_KEYS.MASTER_RESUME];
            if (value) {
              try {
                const resume = typeof value === "string" ? JSON.parse(value) : value;
                resolve(resume);
              } catch (e) {
                console.warn("Failed to parse chrome.storage resume:", e);
                resolve(null);
              }
            } else {
              resolve(null);
            }
          }
        });
      });

      if (result) {
        console.log("Master resume retrieved from chrome.storage.sync");
        return result;
      }
    } catch (e) {
      console.warn("Failed to get from chrome.storage.sync:", e);
    }
  }

  // Fallback to localStorage (web app context)
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MASTER_RESUME);
    if (stored) {
      const resume = JSON.parse(stored);
      console.log("Master resume retrieved from localStorage");
      // Sync to chrome.storage if available
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
        try {
          await setMasterResume(resume);
        } catch (e) {
          console.warn("Could not sync to chrome.storage:", e);
        }
      }
      return resume;
    }
  } catch (e) {
    console.warn("Failed to get from localStorage:", e);
  }

  console.log("No master resume found in any storage");
  return null;
}

export async function setMasterResume(resume: ResumeData): Promise<void> {
  // Always save to localStorage as primary storage (works in all contexts)
  localStorage.setItem(STORAGE_KEYS.MASTER_RESUME, JSON.stringify(resume));

  // Also save to chrome.storage.sync if available (for extension access)
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    try {
      // Store as JSON string to ensure compatibility
      await new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set({ [STORAGE_KEYS.MASTER_RESUME]: JSON.stringify(resume) }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            console.log("Master resume saved to chrome.storage.sync");
            resolve();
          }
        });
      });
    } catch (e) {
      console.warn("Could not save to chrome.storage:", e);
    }
  }
}

export async function getAuthToken(): Promise<string | null> {
  return getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
}

export async function setAuthToken(token: string): Promise<void> {
  return saveToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
}

export async function getGeminiApiKey(): Promise<string | null> {
  return getFromStorage(STORAGE_KEYS.GEMINI_API_KEY);
}

export async function setGeminiApiKey(key: string): Promise<void> {
  return saveToStorage(STORAGE_KEYS.GEMINI_API_KEY, key);
}

export async function clearAllStorage(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  if (typeof chrome !== "undefined" && chrome.storage) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } else {
    // Fallback to localStorage
    keys.forEach((key) => localStorage.removeItem(key as string));
  }
}
