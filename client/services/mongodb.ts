import * as Realm from "@mongodb-js/realm-web";
import { User, ResumeData, ApplicationRecord } from "@/types";

const REALM_APP_ID = import.meta.env.VITE_MONGODB_REALM_APP_ID || "";

let app: Realm.App | null = null;

async function initRealm(): Promise<Realm.App> {
  if (app) return app;
  if (!REALM_APP_ID) {
    throw new Error(
      "MongoDB Realm App ID not configured. Set VITE_MONGODB_REALM_APP_ID in .env"
    );
  }

  app = new Realm.App({ id: REALM_APP_ID });
  return app;
}

export async function loginAnonymously(): Promise<Realm.User> {
  const realmApp = await initRealm();
  const user = await realmApp.logIn(new Realm.AnonymousCredential());
  return user;
}

export async function logout(): Promise<void> {
  const realmApp = await initRealm();
  if (realmApp.currentUser) {
    await realmApp.currentUser.logOut();
  }
}

export async function saveUser(userData: User): Promise<User> {
  const realmApp = await initRealm();
  if (!realmApp.currentUser) {
    await loginAnonymously();
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}

export async function getUserResume(userId: string): Promise<ResumeData | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/${userId}/resume`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching resume:", error);
    return null;
  }
}

export async function saveResume(
  userId: string,
  resume: ResumeData
): Promise<ResumeData> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/${userId}/resume`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error saving resume:", error);
    throw error;
  }
}

export async function saveApplication(
  application: ApplicationRecord
): Promise<ApplicationRecord> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/applications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(application),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error saving application:", error);
    throw error;
  }
}

export async function getApplicationHistory(
  userId: string
): Promise<ApplicationRecord[]> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/applications?userId=${userId}`
    );
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching application history:", error);
    return [];
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationRecord["status"]
): Promise<ApplicationRecord> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/applications/${applicationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
}
