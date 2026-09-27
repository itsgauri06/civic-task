const express = require("express");
const fs = require("fs");
const path = require("path");
const { buildGraph, GraphError } = require("../services/graphBuilder");
const { searchOfficialWeb } = require("../services/webSearch");
const { extractPage } = require("../services/pageExtractor");
const { extractTaskData } = require("../services/taskExtractor");
const { buildRoadmap } = require("../services/roadmapBuilder");


const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "tasks.json");

function loadTasks() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

// GET /api/tasks — list available tasks (for search/autocomplete)
router.get("/", (req, res) => {
  const tasks = loadTasks();
  res.json(tasks.map(({ id, title, location }) => ({ id, title, location })));
});

router.get("/search-test", (req, res) => {
  try {
    const {
      task = "",
      state = "",
      city = ""
    } = req.query;

    const results = searchOfficialWeb(
      task,
      state,
      city
    );

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// TEMPORARY: test webpage extraction
router.get("/extract-test", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "URL is required"
      });
    }

    const result = await extractPage(url);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// TEMPORARY: test page extraction + task extraction
router.get("/task-extract-test", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "URL is required"
      });
    }

    const page = await extractPage(url);

    const taskData = extractTaskData(page.text, page.url);

    const roadmap = buildRoadmap(taskData);

    res.json({
      roadmap
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.get("/discover", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "URL is required"
      });
    }

    const page = await extractPage(url);

    const taskData = extractTaskData(page.text, page.url);

    const roadmap = buildRoadmap(taskData);

    res.json({
      success: true,
      roadmap
    });

  } catch (error) {
    console.error("DISCOVER ERROR:", error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/tasks/:taskId — full validated, tiered graph (published steps only)
router.get("/:taskId", (req, res) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Unknown task id" });

  try {
    const steps = buildGraph(task.steps, { includeDrafts: false });
    res.json({ ...task, steps });
  } catch (err) {
    if (err instanceof GraphError) {
      return res.status(500).json({ error: `Data integrity error: ${err.message}` });
    }
    throw err;
  }
});

// POST /api/tasks/resolve — natural language -> task id
// Simple keyword match for this scaffold; swap in a real NLP/LLM matcher
// behind this same endpoint without changing its contract (docs/API_SPEC.md).
router.post("/resolve", (req, res) => {
  const {
    description = "",
    state = "",
    city = "",
  } = req.body || {};

  console.log("RESOLVE REQUEST:", req.body);

  const tasks = loadTasks();
  const needle = description.toLowerCase();

  const keywordsByTask = {
    "register-small-business-in": [
      "business",
      "shop",
      "startup",
      "company",
      "enterprise",
      "msme"
    ],

    "apply-passport-in": [
      "passport",
      "travel document",
      "passport application",
      "apply passport",
      "renew passport",
      "reissue passport"
    ],

    "apply-pan-in": [
      "pan",
      "pan card",
      "permanent account number",
      "apply pan",
      "pan application"
    ],

    "apply-driving-license-in": [
      "driving license",
      "driving licence",
      "license",
      "licence",
      "driver license",
      "driving test",
      "learner license",
      "learner licence",
      "renew driving license",
      "renew driving licence"
    ]
  };

  let best = null;
  let bestScore = 0;
  for (const task of tasks) {
    const keywords = keywordsByTask[task.id] || [];
    const score = keywords.filter((k) => needle.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = task;
    }
  }

  console.log("BEST TASK:", best);
  console.log("BEST SCORE:", bestScore);

  if (best) {
    return res.json({ taskId: best.id, confidence: Math.min(0.5 + bestScore * 0.15, 0.95), location: { state, city } });
  }
  res.json({
    taskId: null, confidence: 0, suggestions: tasks.map((t) => t.id), location: {
      state,
      city
    }
  });
});

module.exports = router;
