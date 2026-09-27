const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "..", "data", "tasks.json");

function loadTasks() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

/**
 * POST /api/chat — Level 2 extension point.
 *
 * frontend/js/chatbot.js already calls this exact URL (CONFIG.llmEndpoint)
 * whenever CONFIG.mode is set to "llm", and falls back to its own rule
 * engine if this route errors or 501s — so this stub is safe to leave
 * in place, or wire up, without breaking Level 1.
 *
 * Expected request body: { message: string, history: [{role, text}] }
 * Expected response: { reply: string }
 *
 * To implement:
 *   1. Add an LLM API key to backend/.env (never in frontend code).
 *   2. Call the LLM SDK here with:
 *      - req.body.history for conversational follow-ups
 *      - loadTasks() (or a matched subset of it) as grounding context,
 *        so answers come from your real step/fee/document data instead
 *        of the model guessing
 *   3. Return { reply: "..." } in the same shape the frontend expects.
 */
router.post("/", (req, res) => {
  // Not implemented yet — the frontend's getReply() falls back to the
  // Level 1 rule engine whenever this responds with an error.
  res.status(501).json({
    error: "Level 2 chat endpoint not implemented yet. See backend/routes/chat.js."
  });
});

module.exports = router;
