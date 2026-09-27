const express = require("express");
const fs = require("fs");
const path = require("path");
const { buildGraph, GraphError } = require("../services/graphBuilder");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "tasks.json");

function loadTasks() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}
function saveTasks(tasks) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(tasks, null, 2));
}

// GET /api/admin/tasks/:taskId — includes draft steps
router.get("/tasks/:taskId", (req, res) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Unknown task id" });

  try {
    const steps = buildGraph(task.steps, { includeDrafts: true });
    res.json({ ...task, steps });
  } catch (err) {
    if (err instanceof GraphError) return res.status(500).json({ error: err.message });
    throw err;
  }
});

// PUT /api/admin/tasks/:taskId/steps/:stepId — partial update, re-validated
router.put("/tasks/:taskId/steps/:stepId", (req, res) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Unknown task id" });

  const idx = task.steps.findIndex((s) => s.id === req.params.stepId);
  if (idx === -1) return res.status(404).json({ error: "Unknown step id" });

  const updated = { ...task.steps[idx], ...req.body, id: req.params.stepId };
  const candidateSteps = [...task.steps];
  candidateSteps[idx] = updated;

  try {
    buildGraph(candidateSteps, { includeDrafts: true }); // validate before persisting
  } catch (err) {
    if (err instanceof GraphError) return res.status(400).json({ error: err.message });
    throw err;
  }

  task.steps = candidateSteps;
  saveTasks(tasks);
  res.json({ ...task, steps: buildGraph(task.steps, { includeDrafts: true }) });
});

// POST /api/admin/tasks/:taskId/steps — add a new step
router.post("/tasks/:taskId/steps", (req, res) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Unknown task id" });

  const newStep = { dependsOn: [], status: "draft", ...req.body };
  if (!newStep.id) return res.status(400).json({ error: "New step requires an id" });
  if (task.steps.some((s) => s.id === newStep.id)) {
    return res.status(400).json({ error: `Step id "${newStep.id}" already exists` });
  }

  const candidateSteps = [...task.steps, newStep];
  try {
    buildGraph(candidateSteps, { includeDrafts: true });
  } catch (err) {
    if (err instanceof GraphError) return res.status(400).json({ error: err.message });
    throw err;
  }

  task.steps = candidateSteps;
  saveTasks(tasks);
  res.status(201).json({ ...task, steps: buildGraph(task.steps, { includeDrafts: true }) });
});

// DELETE /api/admin/tasks/:taskId/steps/:stepId
router.delete("/tasks/:taskId/steps/:stepId", (req, res) => {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Unknown task id" });

  const referencedBy = task.steps.filter(
    (s) => s.id !== req.params.stepId && (s.dependsOn || []).includes(req.params.stepId)
  );
  if (referencedBy.length > 0) {
    return res.status(400).json({
      error: `Cannot delete: still depended on by ${referencedBy.map((s) => s.id).join(", ")}`,
    });
  }

  task.steps = task.steps.filter((s) => s.id !== req.params.stepId);
  saveTasks(tasks);
  res.json({ ...task, steps: buildGraph(task.steps, { includeDrafts: true }) });
});

module.exports = router;
