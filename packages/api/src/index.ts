import express from "express";
import cors from "cors";
import {
  listProjectRecords,
  listCheckpointsCloud,
  loadLatestCheckpointCloud,
  loadLatestContextCloud,
} from "@gitback/core";

const app = express();
app.use(cors());
app.use(express.json());

const USER_ID = process.env.GITBACK_USER_ID || "demo-user";
const PORT = parseInt(process.env.PORT || "3001", 10);

app.get("/projects", async (_req, res) => {
  try {
    const projects = await listProjectRecords(USER_ID);
    res.json({ projects });
  } catch (err) {
    console.error("Error listing projects:", err);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

app.get("/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const projects = await listProjectRecords(USER_ID);
    const project = projects.find((p) => p.projectId === projectId);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const checkpoints = await listCheckpointsCloud(USER_ID, projectId);

    // Also fetch the full latest checkpoint for the resume view
    const latestFull = await loadLatestCheckpointCloud(USER_ID, projectId);

    // Fetch the latest context snapshot
    const latestContext = await loadLatestContextCloud(USER_ID, projectId);

    res.json({
      project,
      checkpoints: latestFull ? [latestFull] : [],
      context: latestContext,
    });
  } catch (err) {
    console.error("Error getting project:", err);
    res.status(500).json({ error: "Failed to get project" });
  }
});

app.get("/projects/:projectId/checkpoints", async (req, res) => {
  try {
    const { projectId } = req.params;
    const checkpoints = await listCheckpointsCloud(USER_ID, projectId);
    res.json({ checkpoints });
  } catch (err) {
    console.error("Error listing checkpoints:", err);
    res.status(500).json({ error: "Failed to list checkpoints" });
  }
});

app.listen(PORT, () => {
  console.log(`GitBack API server running on http://localhost:${PORT}`);
});
