import { RequestHandler } from "express";
import { ResumeData, User, ApplicationRecord } from "@shared/api";

// Mock database - in production, use real MongoDB
const users = new Map<string, User>();
const applications = new Map<string, ApplicationRecord[]>();

export const getUserResume: RequestHandler = (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user.masterResume || null);
};

export const saveUserResume: RequestHandler = (req, res) => {
  const { userId } = req.params;
  const resume: ResumeData = req.body;

  let user = users.get(userId);
  if (!user) {
    user = {
      _id: userId,
      email: "",
      masterResume: resume,
      createdAt: new Date(),
    };
  } else {
    user.masterResume = resume;
  }

  users.set(userId, user);
  res.json(user);
};

export const saveUser: RequestHandler = (req, res) => {
  const userData: User = req.body;
  const userId = userData._id || `user_${Date.now()}`;

  let user = users.get(userId);
  if (!user) {
    user = {
      ...userData,
      _id: userId,
      createdAt: new Date(),
    };
  } else {
    user = { ...user, ...userData };
  }

  users.set(userId, user);
  res.json(user);
};

export const getApplicationHistory: RequestHandler = (req, res) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId required" });
  }

  const apps = applications.get(userId) || [];
  res.json(apps);
};

export const saveApplication: RequestHandler = (req, res) => {
  const app: ApplicationRecord = req.body;
  const userId = app.userId;

  let userApps = applications.get(userId) || [];
  app._id = `app_${Date.now()}`;
  app.createdAt = new Date();
  userApps.push(app);

  applications.set(userId, userApps);
  res.json(app);
};

export const updateApplicationStatus: RequestHandler = (req, res) => {
  const { appId } = req.params;
  const { status } = req.body;

  for (const [userId, apps] of applications.entries()) {
    const app = apps.find(a => a._id === appId);
    if (app) {
      app.status = status;
      app.updatedAt = new Date();
      res.json(app);
      return;
    }
  }

  res.status(404).json({ error: "Application not found" });
};
