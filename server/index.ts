import express, { Express } from "express";
import cors from "cors";
import path from "path";
import {
  getUserResume,
  saveUserResume,
  saveUser,
  getApplicationHistory,
  saveApplication,
  updateApplicationStatus,
} from "./routes/resume";

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User routes
  app.post("/api/users", saveUser);
  app.get("/api/users/:userId/resume", getUserResume);
  app.post("/api/users/:userId/resume", saveUserResume);

  // Application routes
  app.get("/api/applications", getApplicationHistory);
  app.post("/api/applications", saveApplication);
  app.patch("/api/applications/:appId", updateApplicationStatus);

  // Serve SPA in production
  const spa_path = path.join(process.cwd(), "dist/spa");
  app.use(express.static(spa_path));

  // SPA fallback
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(spa_path, "index.html"));
    }
  });

  return app;
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log(`ResumeMatch Pro server listening on http://localhost:${port}`);
  });
}
